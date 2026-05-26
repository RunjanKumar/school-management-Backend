import jwt, { JwtPayload } from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { Types } from 'mongoose';
import { Constants } from '@school/common';
import { config } from '../config';
import { School, Session, User } from '../models';

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

const getLoginExpirationDate = () => {
	const expirationTime = new Date();
	expirationTime.setSeconds(expirationTime.getSeconds() + Constants.TOKEN_EXPIRATION_TIME.LOGIN);
	return expirationTime;
};

const signToken = (payload: AuthTokenPayload) => {
	return jwt.sign(payload, config.jwtSecret, {
		expiresIn: Constants.TOKEN_EXPIRATION_TIME.LOGIN
	});
};

export const createLoginSession = async (input: CreateLoginSessionInput) => {
	const expirationTime = getLoginExpirationDate();
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

	const payload: AuthTokenPayload = {
		userId: input.userId.toString(),
		role: input.role,
		sessionId: session._id.toString()
	};

	if (input.schoolId) {
		payload.schoolId = input.schoolId.toString();
	}

	const token = signToken(payload);
	session.token = token;
	await session.save();

	return { token, session };
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
		return { valid: false as const, message: 'Session is inactive or expired' };
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
