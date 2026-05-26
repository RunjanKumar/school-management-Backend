import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { Constants, createErrorResponse, createSuccessResponse } from '@school/common';
import { LoginAudit, School, Session, User } from '../models';
import { createLoginSession, verifyTokenAndSession } from '../services/tokenService';
import { verifyGoogleToken } from '../services/googleAuthService';

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

	const { token, session } = await createLoginSession({
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

	const responseObject = createSuccessResponse('Login successful.', {
		token,
		sessionId: session._id.toString(),
		user: buildUserSummary(user)
	});
	return res.status(responseObject.statusCode).json(responseObject);
};

export const googleAuth = async (req: Request, res: Response) => {
	const { idToken, role, schoolCode, deviceId } = req.body;
	const claims = await verifyGoogleToken(idToken);

	if (!claims.email || claims.email_verified === false) {
		return sendError(res, 401, 'Google email must be verified.');
	}

	const normalizedEmail = normalizeEmail(claims.email);
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
			return sendError(res, 401, statusFailure);
		}

		if (!user.googleSub) {
			user.googleSub = claims.sub;
		}
		user.authProviders = { ...user.authProviders, google: true };
		user.emailVerified = true;
	}

	const { token, session } = await createLoginSession({
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

	const responseObject = createSuccessResponse('Login successful.', {
		token,
		sessionId: session._id.toString(),
		user: buildUserSummary(user)
	});
	return res.status(responseObject.statusCode).json(responseObject);
};

export const logout = async (req: Request, res: Response) => {
	const token = getBearerToken(req) || req.body.token;

	if (token) {
		await Session.updateOne({ token, revokedAt: { $exists: false } }, { $set: { revokedAt: new Date() } });
	}

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

export const refresh = async (_req: Request, res: Response) => {
	return sendError(res, 501, 'Refresh token flow is not implemented yet.', Constants.ERROR_TYPES.INTERNAL_SERVER_ERROR);
};

export const forgotPassword = async (_req: Request, res: Response) => {
	const responseObject = createSuccessResponse('If the email exists, password reset instructions will be sent.');
	return res.status(responseObject.statusCode).json(responseObject);
};

export const resetPassword = async (_req: Request, res: Response) => {
	return sendError(res, 501, 'Password reset flow is not implemented yet.', Constants.ERROR_TYPES.INTERNAL_SERVER_ERROR);
};
