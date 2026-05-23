import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { SignedToken } from '@school/common';
import config from '../config';

const getJwtSecret = () => {
	if (!config.JWT_SECRET) {
		throw new Error('JWT_SECRET environment variable is required.');
	}
	return config.JWT_SECRET;
};

export const hashPassword = async (password: string): Promise<string> => {
	return bcrypt.hash(password, 10);
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
	return bcrypt.compare(password, hashedPassword);
};

export const generateJWTToken = (userId: string, expirationTime: number): SignedToken => {
	const sessionKey = crypto.randomBytes(16).toString('hex') + userId;
	const payload = {
		id: userId,
		timestamp: Date.now(),
		sessionKey
	};

	return {
		sessionKey,
		token: jwt.sign(payload, getJwtSecret(), { expiresIn: expirationTime })
	};
};

export const verifyJWTToken = (token: string): any => {
	return jwt.verify(token, getJwtSecret());
};

export const normalizeEmail = (email: string) => email.trim().toLowerCase();
