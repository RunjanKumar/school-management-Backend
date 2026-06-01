import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { Constants, createErrorResponse, createSuccessResponse } from '@school/common';
import { LoginAudit, School, Session, User } from '../models';
import { createLoginSession, createPasswordResetSession, revokeSessionByRefreshToken, rotateRefreshToken, verifyTokenAndSession } from '../services/tokenService';
import { verifyGoogleToken } from '../services/googleAuthService';
import { logger } from '../services/logger';

const GENERIC_LOGIN_FAILURE = 'Invalid email or password.';
const GOOGLE_AUTO_CREATE_ROLES = new Set([
	Constants.USER_ROLES.PARENT,
	Constants.USER_ROLES.STUDENT,
	Constants.USER_ROLES.GUEST
]);

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const getBearerToken = (request: Request) => {
	const header = request.headers.authorization;
	if (!header?.startsWith('Bearer ')) {
		return undefined;
	}

	return header.slice('Bearer '.length).trim();
};

const auditLogin = async (
	request: Request,
	input: {
		userId?: unknown;
		email: string;
		schoolId?: unknown;
		role?: string;
		loginMethod: string;
		success: boolean;
		failureReason?: string;
	}
) => {
	// Login audits are intentionally separate from normal logs so security teams can query them later.
	await LoginAudit.create({
		...input,
		ipAddress: request.ip,
		userAgent: request.get('user-agent')
	});
};

const sendError = (response: Response, statusCode: number, message: string, type = Constants.ERROR_TYPES.UNAUTHORIZED) => {
	const responseObject = createErrorResponse(message, type);
	return response.status(statusCode).json({ ...responseObject, statusCode });
};

const ensureUserCanLogin = async (user: any) => {
	if (!user || user.isDeleted || user.status !== Constants.USER_STATUS.ACTIVE) {
		return 'User account is not active.';
	}

	if (user.schoolId) {
		const school = await School.findOne({
			_id: user.schoolId,
			isDeleted: false,
			status: Constants.SCHOOL_STATUS.ACTIVE
		});

		if (!school) {
			return 'School is inactive or suspended.';
		}
	}

	return undefined;
};

const buildUserSummary = (user: any) => ({
	_id: user._id.toString(),
	email: user.email,
	role: user.role,
	schoolId: user.schoolId?.toString() || null,
	profileRef: user.profileRef?.toString() || null,
	profileModel: user.profileModel || null,
	name: user.name || undefined
});

export const login = async (req: Request, res: Response) => {
	const { email, password, deviceId } = req.body;
	const normalizedEmail = normalizeEmail(email);

	logger.info('Password login requested', { email: normalizedEmail, ipAddress: req.ip });

	const user = await User.findOne({ normalizedEmail, isDeleted: false }).select('+passwordHash');
	const loginFailure = async (reason = GENERIC_LOGIN_FAILURE) => {
		await auditLogin(req, {
			email: normalizedEmail,
			role: user?.role,
			schoolId: user?.schoolId,
			loginMethod: Constants.AUTH_PROVIDERS.PASSWORD,
			success: false,
			failureReason: reason
		});
		logger.warn('Password login failed', { email: normalizedEmail, reason });
		return sendError(res, 401, GENERIC_LOGIN_FAILURE);
	};

	if (!user || !user.passwordHash || user.authProviders?.password === false) {
		return loginFailure();
	}

	const statusFailure = await ensureUserCanLogin(user);
	if (statusFailure) {
		return loginFailure(statusFailure);
	}

	const isValidPassword = await bcrypt.compare(password, user.passwordHash);
	if (!isValidPassword) {
		return loginFailure();
	}

	const { token, refreshToken, session } = await createLoginSession({
		userId: user._id,
		role: user.role,
		schoolId: user.schoolId,
		deviceId,
		ipAddress: req.ip,
		userAgent: req.get('user-agent')
	});

	user.lastLoginAt = new Date();
	await user.save();
	await auditLogin(req, {
		userId: user._id,
		email: normalizedEmail,
		role: user.role,
		schoolId: user.schoolId,
		loginMethod: Constants.AUTH_PROVIDERS.PASSWORD,
		success: true
	});
	logger.info('Password login successful', { userId: user._id.toString(), role: user.role, sessionId: session._id.toString() });

	const responseObject = createSuccessResponse('Login successful.', {
		token,
		refreshToken,
		sessionId: session._id.toString(),
		user: buildUserSummary(user)
	});
	return res.status(responseObject.statusCode).json(responseObject);
};

export const createSchoolAdmin = async (req: Request, res: Response) => {
	const token = getBearerToken(req);
	if (!token) {
		return sendError(res, 401, 'Missing authorization token.');
	}

	const validation = await verifyTokenAndSession(token);
	if (!validation.valid) {
		return sendError(res, 401, validation.message);
	}

	if (validation.payload.role !== Constants.USER_ROLES.SUPER_ADMIN) {
		return sendError(res, 403, 'Only super admin can create school admins.', Constants.ERROR_TYPES.FORBIDDEN);
	}

	const { email, password, name } = req.body;
	const normalizedEmail = normalizeEmail(email);

	const existingUser = await User.findOne({ normalizedEmail, isDeleted: false });
	if (existingUser) {
		const responseObject = createErrorResponse('A user with this email already exists.', Constants.ERROR_TYPES.ALREADY_EXISTS);
		return res.status(responseObject.statusCode).json(responseObject);
	}

	const passwordHash = await bcrypt.hash(password, 10);
	const user = await User.create({
		email: normalizedEmail,
		normalizedEmail,
		name,
		passwordHash,
		role: Constants.USER_ROLES.SCHOOL_ADMIN,
		authProviders: { password: true, google: false },
		emailVerified: true,
		status: Constants.USER_STATUS.ACTIVE,
		isDeleted: false
	});

	logger.info('School admin created by super admin', {
		userId: user._id.toString(),
		createdBy: validation.payload.userId
	});

	const responseObject = createSuccessResponse('School admin created successfully.', {
		user: buildUserSummary(user)
	});
	return res.status(201).json(responseObject);
};

export const googleAuth = async (req: Request, res: Response) => {
	const { idToken, role, schoolCode, deviceId } = req.body;
	const claims = await verifyGoogleToken(idToken);

	if (!claims.email || claims.email_verified === false) {
		return sendError(res, 401, 'Google email must be verified.');
	}

	const normalizedEmail = normalizeEmail(claims.email);
	logger.info('Google login requested', { email: normalizedEmail, requestedRole: role, schoolCode });

	let user = await User.findOne({
		isDeleted: false,
		$or: [{ googleSub: claims.sub }, { normalizedEmail }]
	});

	if (!user) {
		if (!role || !GOOGLE_AUTO_CREATE_ROLES.has(role)) {
			await auditLogin(req, {
				email: normalizedEmail,
				role,
				loginMethod: Constants.AUTH_PROVIDERS.GOOGLE,
				success: false,
				failureReason: 'Google auto-create is not allowed for this role.'
			});
			logger.warn('Google auto-create rejected for protected role', { email: normalizedEmail, role });
			return sendError(res, 403, 'Google login is not allowed for this role.', Constants.ERROR_TYPES.FORBIDDEN);
		}

		let schoolId;
		if (schoolCode) {
			const school = await School.findOne({
				code: String(schoolCode).trim().toUpperCase(),
				isDeleted: false,
				status: Constants.SCHOOL_STATUS.ACTIVE
			});

			if (!school) {
				return sendError(res, 401, 'School is inactive or not found.');
			}
			schoolId = school._id;
		}

		user = await User.create({
			email: normalizedEmail,
			normalizedEmail,
			role,
			schoolId,
			authProviders: { password: false, google: true },
			googleSub: claims.sub,
			emailVerified: true,
			status: Constants.USER_STATUS.ACTIVE
		});
		logger.info('Google user auto-created', { userId: user._id.toString(), role: user.role, schoolId: user.schoolId?.toString() });
	} else {
		const statusFailure = await ensureUserCanLogin(user);
		if (statusFailure) {
			await auditLogin(req, {
				userId: user._id,
				email: normalizedEmail,
				role: user.role,
				schoolId: user.schoolId,
				loginMethod: Constants.AUTH_PROVIDERS.GOOGLE,
				success: false,
				failureReason: statusFailure
			});
			logger.warn('Google login failed account validation', { userId: user._id.toString(), reason: statusFailure });
			return sendError(res, 401, statusFailure);
		}

		if (!user.googleSub) {
			user.googleSub = claims.sub;
		}
		user.authProviders = { ...user.authProviders, google: true };
		user.emailVerified = true;
	}

	const { token, refreshToken, session } = await createLoginSession({
		userId: user._id,
		role: user.role,
		schoolId: user.schoolId,
		type: Constants.SESSION_TYPES.GOOGLE_LOGIN,
		deviceId,
		ipAddress: req.ip,
		userAgent: req.get('user-agent')
	});

	user.lastLoginAt = new Date();
	await user.save();
	await auditLogin(req, {
		userId: user._id,
		email: normalizedEmail,
		role: user.role,
		schoolId: user.schoolId,
		loginMethod: Constants.AUTH_PROVIDERS.GOOGLE,
		success: true
	});
	logger.info('Google login successful', { userId: user._id.toString(), role: user.role, sessionId: session._id.toString() });

	const responseObject = createSuccessResponse('Login successful.', {
		token,
		refreshToken,
		sessionId: session._id.toString(),
		user: buildUserSummary(user)
	});
	return res.status(responseObject.statusCode).json(responseObject);
};

export const logout = async (req: Request, res: Response) => {
	const token = getBearerToken(req) || req.body.token;
	const refreshToken = req.body.refreshToken;

	if (token) {
		await Session.updateOne({ token, revokedAt: { $exists: false } }, { $set: { revokedAt: new Date() } });
	}

	if (refreshToken) {
		await revokeSessionByRefreshToken(refreshToken).catch((error) => {
			logger.warn('Refresh-token logout could not revoke a session', { error: error instanceof Error ? error.message : String(error) });
		});
	}

	logger.info('Logout requested', { hasAccessToken: Boolean(token), hasRefreshToken: Boolean(refreshToken) });
	const responseObject = createSuccessResponse('Logged out successfully.');
	return res.status(responseObject.statusCode).json(responseObject);
};

export const me = async (req: Request, res: Response) => {
	const token = getBearerToken(req);
	if (!token) {
		return sendError(res, 401, 'Missing authorization token.');
	}

	const validation = await verifyTokenAndSession(token);
	if (!validation.valid) {
		return sendError(res, 401, validation.message);
	}

	const user = await User.findById(validation.payload.userId);
	if (!user) {
		return sendError(res, 404, 'User not found.', Constants.ERROR_TYPES.DATA_NOT_FOUND);
	}

	const responseObject = createSuccessResponse('Profile fetched successfully.', {
		user: buildUserSummary(user),
		sessionId: validation.payload.sessionId
	});
	return res.status(responseObject.statusCode).json(responseObject);
};

export const updateMe = async (req: Request, res: Response) => {
	const token = getBearerToken(req);
	if (!token) {
		return sendError(res, 401, 'Missing authorization token.');
	}

	const validation = await verifyTokenAndSession(token);
	if (!validation.valid) {
		return sendError(res, 401, validation.message);
	}

	const allowedRoles = new Set([ Constants.USER_ROLES.SUPER_ADMIN, Constants.USER_ROLES.SCHOOL_ADMIN ]);
	if (!allowedRoles.has(validation.payload.role)) {
		return sendError(res, 403, 'Only super admin and school admin can update basic profile data.', Constants.ERROR_TYPES.FORBIDDEN);
	}

	const updatePayload: Record<string, unknown> = {};
	if (Object.prototype.hasOwnProperty.call(req.body, 'name')) {
		updatePayload.name = req.body.name;
	}

	const user = await User.findOneAndUpdate(
		{ _id: validation.payload.userId, isDeleted: false },
		{ $set: updatePayload },
		{ new: true, runValidators: true }
	);

	if (!user) {
		return sendError(res, 404, 'User not found.', Constants.ERROR_TYPES.DATA_NOT_FOUND);
	}

	logger.info('Basic profile updated', { userId: user._id.toString(), role: user.role, fields: Object.keys(updatePayload) });
	const responseObject = createSuccessResponse('Profile updated successfully.', {
		user: buildUserSummary(user)
	});
	return res.status(responseObject.statusCode).json(responseObject);
};

export const refresh = async (req: Request, res: Response) => {
	const { refreshToken } = req.body;
	if (!refreshToken) {
		return sendError(res, 400, 'refreshToken is required.', Constants.ERROR_TYPES.BAD_REQUEST);
	}

	const refreshed = await rotateRefreshToken(refreshToken).catch((error) => {
		logger.warn('Refresh token rotation failed', { error: error instanceof Error ? error.message : String(error) });
		return undefined;
	});

	if (!refreshed?.valid) {
		return sendError(res, 401, refreshed?.message || 'Refresh token is invalid or expired.');
	}

	const responseObject = createSuccessResponse('Token refreshed successfully.', {
		token: refreshed.token,
		refreshToken: refreshed.refreshToken,
		sessionId: refreshed.session._id.toString()
	});
	return res.status(responseObject.statusCode).json(responseObject);
};

export const forgotPassword = async (req: Request, res: Response) => {
	const { email } = req.body;
	const normalizedEmail = normalizeEmail(email);
	const user = await User.findOne({ normalizedEmail, isDeleted: false, status: Constants.USER_STATUS.ACTIVE });

	if (user?.authProviders?.password) {
		const { resetToken } = await createPasswordResetSession({
			userId: user._id,
			role: user.role,
			schoolId: user.schoolId,
			ipAddress: req.ip,
			userAgent: req.get('user-agent')
		});

		// Mail delivery is intentionally left outside this controller; return token only outside production
		// so local learners can complete the flow without setting up SMTP.
		logger.info('Password reset requested', { userId: user._id.toString(), email: normalizedEmail });
		const data = process.env.NODE_ENV === 'production' ? undefined : { resetToken };
		const responseObject = createSuccessResponse('If the email exists, password reset instructions will be sent.', data);
		return res.status(responseObject.statusCode).json(responseObject);
	}

	logger.warn('Password reset requested for missing or non-password user', { email: normalizedEmail });
	const responseObject = createSuccessResponse('If the email exists, password reset instructions will be sent.');
	return res.status(responseObject.statusCode).json(responseObject);
};

export const resetPassword = async (req: Request, res: Response) => {
	const { token, password } = req.body;
	if (!Constants.REGEX.PASSWORD.test(password)) {
		return sendError(res, 400, Constants.RESPONSE_MESSAGES.PASSWORD_VALIDATION_FAILED, Constants.ERROR_TYPES.BAD_REQUEST);
	}

	const resetSession = await Session.findOne({
		token,
		type: Constants.SESSION_TYPES.FORGOT_PASSWORD,
		revokedAt: { $exists: false },
		expirationTime: { $gt: new Date() }
	});

	if (!resetSession) {
		return sendError(res, 401, 'Reset token is invalid or expired.');
	}

	const passwordHash = await bcrypt.hash(password, 10);
	await User.updateOne(
		{ _id: resetSession.userId, isDeleted: false },
		{
			$set: {
				passwordHash,
				'authProviders.password': true,
				status: Constants.USER_STATUS.ACTIVE
			}
		}
	);

	// Revoke reset token and all existing login sessions so old devices cannot stay logged in.
	await Session.updateMany(
		{
			userId: resetSession.userId,
			revokedAt: { $exists: false },
			type: { $in: [Constants.SESSION_TYPES.LOGIN, Constants.SESSION_TYPES.GOOGLE_LOGIN, Constants.SESSION_TYPES.FORGOT_PASSWORD] }
		},
		{ $set: { revokedAt: new Date() } }
	);

	logger.info('Password reset completed', { userId: resetSession.userId.toString() });
	const responseObject = createSuccessResponse('Password reset successfully.');
	return res.status(responseObject.statusCode).json(responseObject);
};
