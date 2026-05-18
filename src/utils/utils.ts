import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Constants } from '../commons/constants';
import mongoose from 'mongoose';
import { SignedToken } from '../commons/interfaces';

/**
 * Replaces all occurrences of specified substrings in a string with their corresponding replacements.
 *
 * @param str - The original string where replacements are to be made.
 * @param replacementArr - An array of objects containing 'base' strings to be replaced and their corresponding 'replacement' strings.
 * @returns The modified string with all specified replacements applied.
 */

const parseTemplate = (str: string, replacementArray: Array<{ base: string; replacement: string }>) => {
	if (!replacementArray || !replacementArray.length) {
		return str;
	}
	let result = str;
	for (const replacer of replacementArray) {
		result = result.replace(new RegExp(replacer.base, 'g'), replacer.replacement);
	}
	return result;
};

/**
 * Hashes a plain text password using bcrypt.
 *
 * @param password - The plain text password to hash.
 * @returns A promise that resolves to the hashed password.
 */
const hashPassword = async (password: string): Promise<string> => {
	return await bcrypt.hash(password, 10);
};

/**
 * Hashes an OTP using bcrypt.
 *
 * @param otp - OTP (One Time Password) as a number.
 * @returns A promise that resolves to the hashed OTP.
 */
const hashOTP = async (otp: number): Promise<string> => {
	return await bcrypt.hash(otp.toString(), 10);
};

/**
 * Compares a plain text password with a hashed password using bcrypt.
 *
 * @param password - The plain text password to compare.
 * @param hashedPassword - The hashed password to compare against.
 * @returns A promise that resolves to a boolean indicating whether the passwords match.
 */
const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
	return await bcrypt.compare(password, hashedPassword);
};

/**
 * Compares a plain OTP (number) with a hashed OTP using bcrypt.
 *
 * @param otp - The plain OTP as a number.
 * @param hashedOtp - The hashed OTP to compare against.
 * @returns A promise that resolves to a boolean indicating whether the OTPs match.
 */
const compareOTP = async (otp: number, hashedOtp: string): Promise<boolean> => {
	return await bcrypt.compare(otp.toString(), hashedOtp);
};

/**
 * Generates a JSON Web Token (JWT) for a given user ID.
 *
 * @param userId - The ID of the user for whom to generate the token.
 * @returns A JWT as a string.
 */

const generateJWTToken = (userId: string, expirationTime: number): SignedToken => {
	const sessionKey = crypto.randomBytes(16).toString('hex') + userId; // 32-char random session key

	const payload = {
		id: userId,
		timestamp: Date.now(),
		sessionKey // special session key to maintain session
	};

	return { sessionKey, token: jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: expirationTime }) };
};

/**
 * Generates a JSON Web Token (JWT) for a given user ID with a short expiration time of 1 minute.
 *
 * @param field - can be any field for whom to generate the token.
 * @returns A JWT as a string.
 */
const generateSecuredToken = (field: string): string => {
	const payload = {
		timestamp: Date.now(),
		field: field
	};

	return jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
};

/**
 * Verifies a JSON Web Token (JWT) and returns the decoded payload.
 *
 * @param token - The JWT to verify.
 * @returns The decoded payload.
 * @throws An error if the token is invalid or verification fails.
 */
const decryptJWTToken = (token: string): any => {
	return jwt.verify(token, process.env.JWT_SECRET || ('secret' as string));
};

/**
 * Function to make special searching.
 */
const makeRegexForSpecialCharacter = (searchQuery = '') => {
	let searchStringForRegex = '';

	for (let i = 0; i < searchQuery.length; i++) {
		if (Constants.SPECIAL_CHARACTERS.includes(searchQuery[i])) searchStringForRegex += '\\';
		searchStringForRegex += searchQuery[i];
	}
	return new RegExp(searchStringForRegex);
};

/**
 * Generates a secure numeric OTP of the given length.
 *
 * @param length - The length of the OTP to generate. Default is 6.
 * @returns A numeric OTP.
 */
const generateSecureOTP = (length: number = 6): number => {
	return crypto.randomInt(10 ** (length - 1), 10 ** length);
};

/**
 * Safely converts a value to a Mongoose ObjectId.
 * Returns null if the value is not a valid ObjectId.
 */
const convertIdToMongooseId = (id: string | mongoose.Types.ObjectId | null | undefined): mongoose.Types.ObjectId | null => {
	if (!id) return null;

	// If already an ObjectId
	if (id instanceof mongoose.Types.ObjectId) return id;

	// If it's a valid ObjectId string
	if (mongoose.Types.ObjectId.isValid(id)) {
		return new mongoose.Types.ObjectId(id);
	}

	return null;
};

/**
 * Capitalizes the first letter of a string.
 *
 * @param {string} str - The string to capitalize.
 * @returns {string} The string with the first letter capitalized.
 */
const capitalizeFirstLetter = (str: string) => {
	return str.charAt(0).toUpperCase() + str.slice(1);
};

export const Utils = {
	parseTemplate,
	hashPassword,
	comparePassword,
	generateJWTToken,
	generateSecuredToken,
	decryptJWTToken,
	makeRegexForSpecialCharacter,
	generateSecureOTP,
	convertIdToMongooseId,
	hashOTP,
	compareOTP,
	capitalizeFirstLetter
};
