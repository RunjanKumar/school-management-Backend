import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';

export interface SignedToken {
	sessionKey: string;
	token: string;
}

/**
 * Hashes a plain text password using bcrypt.
 *
 * @param password - The plain text password to hash.
 * @returns A promise that resolves to the hashed password.
 */
export const hashPassword = async (password: string): Promise<string> => {
	return await bcrypt.hash(password, 10);
};

/**
 * Compares a plain text password with a hashed password using bcrypt.
 *
 * @param password - The plain text password to compare.
 * @param hashedPassword - The hashed password to compare against.
 * @returns A promise that resolves to a boolean indicating whether the passwords match.
 */
export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
	return await bcrypt.compare(password, hashedPassword);
};

const getJwtSecret = (): string => {
	if (!process.env.JWT_SECRET) {
		throw new Error('JWT_SECRET environment variable is required.');
	}
	return process.env.JWT_SECRET;
};

/**
 * Generates a JSON Web Token (JWT) for a given user ID.
 *
 * @param userId - The ID of the user for whom to generate the token.
 * @param expirationTime - Expiration time in seconds or a string describing a time span.
 * @returns A signed token object containing sessionKey and token.
 */
export const generateJWTToken = (userId: string, expirationTime: SignOptions['expiresIn']): SignedToken => {
	const sessionKey = crypto.randomBytes(16).toString('hex') + userId;

	const payload = {
		id: userId,
		timestamp: Date.now(),
		sessionKey
	};

	return { sessionKey, token: jwt.sign(payload, getJwtSecret(), { expiresIn: expirationTime }) };
};

/**
 * Verifies a JSON Web Token (JWT) and returns the decoded payload.
 *
 * @param token - The JWT to verify.
 * @returns The decoded payload.
 */
export const verifyJWTToken = (token: string): any => {
	return jwt.verify(token, getJwtSecret());
};
