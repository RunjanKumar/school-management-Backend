import jwt, { JwtPayload } from 'jsonwebtoken';
import { createHash, randomUUID } from 'node:crypto';
import { Types } from 'mongoose';
import { Constants } from '@school/common';
import { config } from '../config';
import { School, Session, User } from '../models';
import { logger } from './logger';

export type AuthTokenPayload = JwtPayload & {
	userId: string;
	role: string;
	schoolId?: string;
	sessionId: string;
};

type CreateLoginSessionInput = {
	userId: Types.ObjectId;
	role: string;
	schoolId?: Types.ObjectId;
	type?: string;
	deviceId?: string;
	ipAddress?: string;
	userAgent?: string;
};

type RefreshTokenPayload = JwtPayload & {
	userId: string;
	sessionId: string;
	tokenId: string;
};

const REFRESH_TOKEN_EXPIRATION_SECONDS = 86400 * 7;

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

const getExpirationDate = (seconds: number) => {
	const expirationTime = new Date();
	expirationTime.setSeconds(expirationTime.getSeconds() + seconds);
	return expirationTime;
};

const buildAccessPayload = (input: { userId: Types.ObjectId | string; role: string; sessionId: Types.ObjectId | string; schoolId?: Types.ObjectId | string }) => {
	const payload: AuthTokenPayload = {
		userId: input.userId.toString(),
		role: input.role,
		sessionId: input.sessionId.toString()
	};

	if (input.schoolId) {
		payload.schoolId = input.schoolId.toString();
	}

	return payload;
};

const signAccessToken = (payload: AuthTokenPayload) => {
	return jwt.sign(payload, config.jwtSecret, {
		expiresIn: Constants.TOKEN_EXPIRATION_TIME.LOGIN
	});
};

const signRefreshToken = (payload: RefreshTokenPayload) => {
	return jwt.sign(payload, config.jwtRefreshSecret, {
		expiresIn: REFRESH_TOKEN_EXPIRATION_SECONDS
	});
};

export const createLoginSession = async (input: CreateLoginSessionInput) => {
	const expirationTime = getExpirationDate(REFRESH_TOKEN_EXPIRATION_SECONDS);
	const session = await Session.create({
		userId: input.userId,
		role: input.role,
		schoolId: input.schoolId,
		type: input.type || Constants.SESSION_TYPES.LOGIN,
		token: randomUUID(),
		deviceId: input.deviceId,
		ipAddress: input.ipAddress,
		userAgent: input.userAgent,
		expirationTime
	});

	// The session id is embedded in both tokens, but the database session remains the source of truth.
	const accessToken = signAccessToken(
		buildAccessPayload({
			userId: input.userId,
			role: input.role,
			schoolId: input.schoolId,
			sessionId: session._id
		})
	);
	const refreshToken = signRefreshToken({
		userId: input.userId.toString(),
		sessionId: session._id.toString(),
		tokenId: randomUUID()
	});

	session.token = accessToken;
	session.refreshTokenHash = hashToken(refreshToken);
	await session.save();

	logger.info('Login session created', {
		userId: input.userId.toString(),
		role: input.role,
		schoolId: input.schoolId?.toString(),
		sessionId: session._id.toString()
	});

	return { token: accessToken, refreshToken, session };
};

export const createPasswordResetSession = async (input: { userId: Types.ObjectId; role: string; schoolId?: Types.ObjectId; ipAddress?: string; userAgent?: string }) => {
	const resetToken = randomUUID();
	const session = await Session.create({
		userId: input.userId,
		role: input.role,
		schoolId: input.schoolId,
		type: Constants.SESSION_TYPES.FORGOT_PASSWORD,
		token: resetToken,
		ipAddress: input.ipAddress,
		userAgent: input.userAgent,
		expirationTime: getExpirationDate(Constants.TOKEN_EXPIRATION_TIME.FORGOT_PASSWORD)
	});

	logger.info('Password reset session created', {
		userId: input.userId.toString(),
		sessionId: session._id.toString()
	});

	return { resetToken, session };
};

export const verifyToken = (token: string) => jwt.verify(token, config.jwtSecret) as AuthTokenPayload;

export const verifyTokenAndSession = async (token: string) => {
	const decoded = verifyToken(token);
	const session = await Session.findOne({
		_id: decoded.sessionId,
		userId: decoded.userId,
		token,
		type: { $in: [Constants.SESSION_TYPES.LOGIN, Constants.SESSION_TYPES.GOOGLE_LOGIN] },
		revokedAt: { $exists: false },
		expirationTime: { $gt: new Date() }
	});

	if (!session) {
		logger.warn('Token rejected because session is inactive', { sessionId: decoded.sessionId, userId: decoded.userId });
		return { valid: false as const, message: 'Session is inactive or expired' };
	}

	const user = await User.findOne({
		_id: session.userId,
		isDeleted: false,
		status: Constants.USER_STATUS.ACTIVE
	});

	if (!user) {
		logger.warn('Token rejected because user is inactive', { sessionId: session._id.toString(), userId: session.userId.toString() });
		return { valid: false as const, message: 'User is inactive or not found' };
	}

	if (user.schoolId) {
		const school = await School.findOne({
			_id: user.schoolId,
			isDeleted: false,
			status: Constants.SCHOOL_STATUS.ACTIVE
		});

		if (!school) {
			logger.warn('Token rejected because school is inactive', { sessionId: session._id.toString(), schoolId: user.schoolId.toString() });
			return { valid: false as const, message: 'School is inactive or suspended' };
		}
	}

	return {
		valid: true as const,
		payload: {
			userId: user._id.toString(),
			role: user.role,
			schoolId: user.schoolId?.toString() || null,
			sessionId: session._id.toString()
		}
	};
};

export const rotateRefreshToken = async (refreshToken: string) => {
	const decoded = jwt.verify(refreshToken, config.jwtRefreshSecret) as RefreshTokenPayload;
	const session = await Session.findOne({
		_id: decoded.sessionId,
		userId: decoded.userId,
		refreshTokenHash: hashToken(refreshToken),
		type: { $in: [Constants.SESSION_TYPES.LOGIN, Constants.SESSION_TYPES.GOOGLE_LOGIN] },
		revokedAt: { $exists: false },
		expirationTime: { $gt: new Date() }
	});

	if (!session) {
		logger.warn('Refresh token rejected because session/hash did not match', { sessionId: decoded.sessionId, userId: decoded.userId });
		return { valid: false as const, message: 'Refresh token is invalid or expired' };
	}

	const user = await User.findOne({
		_id: session.userId,
		isDeleted: false,
		status: Constants.USER_STATUS.ACTIVE
	});

	if (!user) {
		return { valid: false as const, message: 'User is inactive or not found' };
	}

	if (user.schoolId) {
		const school = await School.findOne({
			_id: user.schoolId,
			isDeleted: false,
			status: Constants.SCHOOL_STATUS.ACTIVE
		});

		if (!school) {
			return { valid: false as const, message: 'School is inactive or suspended' };
		}
	}

	const newAccessToken = signAccessToken(
		buildAccessPayload({
			userId: user._id,
			role: user.role,
			schoolId: user.schoolId,
			sessionId: session._id
		})
	);
	const newRefreshToken = signRefreshToken({
		userId: user._id.toString(),
		sessionId: session._id.toString(),
		tokenId: randomUUID()
	});

	session.token = newAccessToken;
	session.refreshTokenHash = hashToken(newRefreshToken);
	session.expirationTime = getExpirationDate(REFRESH_TOKEN_EXPIRATION_SECONDS);
	await session.save();

	logger.info('Refresh token rotated', { userId: user._id.toString(), sessionId: session._id.toString() });

	return {
		valid: true as const,
		token: newAccessToken,
		refreshToken: newRefreshToken,
		session
	};
};

export const revokeSessionByRefreshToken = async (refreshToken: string) => {
	const decoded = jwt.verify(refreshToken, config.jwtRefreshSecret) as RefreshTokenPayload;
	const session = await Session.findOne({
		_id: decoded.sessionId,
		userId: decoded.userId,
		refreshTokenHash: hashToken(refreshToken),
		revokedAt: { $exists: false }
	});

	if (!session) {
		return { revoked: false as const };
	}

	session.revokedAt = new Date();
	await session.save();
	logger.info('Session revoked by refresh token', { userId: decoded.userId, sessionId: decoded.sessionId });
	return { revoked: true as const, session };
};
