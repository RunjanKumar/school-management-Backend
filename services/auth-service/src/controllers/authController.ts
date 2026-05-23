import { Request } from 'express';
import { Constants, createErrorResponse, createSuccessResponse } from '@school/common';
import { loginAuditModel, sessionModel, userModel } from '../models';
import { comparePassword, generateJWTToken, normalizeEmail, verifyJWTToken } from '../utils/authUtils';

const getBearerToken = (authorizationHeader?: string) => {
	if (!authorizationHeader) return '';
	return authorizationHeader.startsWith('Bearer ') ? authorizationHeader.slice(7) : authorizationHeader;
};

const getRequestMeta = (request: Request) => ({
	ipAddress: request.ip,
	userAgent: request.headers['user-agent']
});

const recordLoginAudit = async (payload: {
	userId?: unknown;
	email: string;
	schoolId?: unknown;
	role?: string;
	loginMethod: string;
	success: boolean;
	failureReason?: string;
	ipAddress?: string;
	userAgent?: string;
}) => {
	await loginAuditModel.create(payload);
};

export async function login(request: Request) {
	const { email, password } = request.body || {};
	const normalizedEmail = normalizeEmail(email || '');
	const requestMeta = getRequestMeta(request);

	const user = await userModel.findOne({
		normalizedEmail,
		isDeleted: false
	}).select('+passwordHash');

	if (!user || user.status !== Constants.USER_STATUS.ACTIVE || !user.passwordHash || !(await comparePassword(password || '', user.passwordHash))) {
		await recordLoginAudit({
			email: normalizedEmail || email || '',
			loginMethod: Constants.AUTH_PROVIDERS.PASSWORD,
			success: false,
			failureReason: Constants.RESPONSE_MESSAGES.INVALID_EMAIL_OR_PASSWORD,
			...requestMeta
		});
		throw createErrorResponse(Constants.RESPONSE_MESSAGES.INVALID_EMAIL_OR_PASSWORD, Constants.ERROR_TYPES.BAD_REQUEST);
	}

	const signedToken = generateJWTToken(user._id.toString(), Constants.TOKEN_EXPIRATION_TIME.LOGIN);

	await sessionModel.create({
		userId: user._id,
		refPath: Constants.SESSIONS_REF_PATH.USER,
		type: Constants.SESSION_TYPES.LOGIN,
		role: user.role,
		schoolId: user.schoolId,
		token: signedToken.token,
		ipAddress: requestMeta.ipAddress,
		userAgent: requestMeta.userAgent,
		expirationTime: new Date(Date.now() + Constants.TOKEN_EXPIRATION_TIME.LOGIN * 1000)
	});

	await userModel.updateOne({ _id: user._id }, { lastLoginAt: new Date() });
	await recordLoginAudit({
		userId: user._id,
		email: user.normalizedEmail,
		schoolId: user.schoolId,
		role: user.role,
		loginMethod: Constants.AUTH_PROVIDERS.PASSWORD,
		success: true,
		...requestMeta
	});

	return createSuccessResponse(Constants.RESPONSE_MESSAGES.LOGIN_SUCCESSFUL, {
		token: signedToken.token,
		user: {
			id: user._id,
			email: user.email,
			role: user.role,
			schoolId: user.schoolId,
			status: user.status
		}
	});
}

export async function logout(request: Request) {
	const token = getBearerToken(request.headers.authorization);

	if (!token) {
		throw createErrorResponse(Constants.RESPONSE_MESSAGES.UNAUTHORIZED, Constants.ERROR_TYPES.UNAUTHORIZED);
	}

	await sessionModel.updateOne(
		{
			token,
			revokedAt: { $exists: false }
		},
		{ revokedAt: new Date() }
	);

	return createSuccessResponse(Constants.RESPONSE_MESSAGES.LOGOUT_SUCCESSFUL);
}

export async function me(request: Request) {
	const validation = await validateToken(getBearerToken(request.headers.authorization));

	if (!validation.valid) {
		throw createErrorResponse(Constants.RESPONSE_MESSAGES.UNAUTHORIZED, Constants.ERROR_TYPES.UNAUTHORIZED);
	}

	return createSuccessResponse(Constants.RESPONSE_MESSAGES.ADMIN_PROFILE_FETCHED, {
		user: validation
	});
}

export async function validate(request: Request) {
	const token = request.body?.token || getBearerToken(request.headers.authorization);
	return validateToken(token);
}

export async function validateToken(token: string) {
	if (!token) {
		return { valid: false };
	}

	try {
		const decoded = verifyJWTToken(token);
		const session = await sessionModel.findOne({
			token,
			type: Constants.SESSION_TYPES.LOGIN,
			expirationTime: { $gt: new Date() },
			revokedAt: { $exists: false }
		});

		if (!session) {
			return { valid: false };
		}

		const user = await userModel.findOne({
			_id: session.userId,
			isDeleted: false,
			status: Constants.USER_STATUS.ACTIVE
		});

		if (!user) {
			return { valid: false };
		}

		return {
			valid: true,
			userId: user._id.toString(),
			role: user.role,
			schoolId: user.schoolId?.toString(),
			sessionId: session._id.toString(),
			tokenId: decoded.sessionKey
		};
	} catch (_error) {
		return { valid: false };
	}
}
