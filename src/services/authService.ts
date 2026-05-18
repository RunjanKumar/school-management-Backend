import { Response, NextFunction } from 'express';
import { AuthenticatedRequestInterface } from '../interfaces';
import { createErrorResponse } from '../commons/responseHelpers';
import { Constants } from '../commons/constants';
import { Utils } from '../utils/utils';
import dbService from './databaseService';
import * as Models from '../models';

const authService: any = {};

/**
 * Validate auth
 * @param {number} auth - Auth type
 * @returns {Promise<boolean>} - True if auth is valid, false otherwise
 */
authService.validateAuth = (auth: number) => {
	switch (auth) {
	case Constants.AVAILABLE_AUTHS.ADMIN:
		return authService.adminValidate();
	case Constants.AVAILABLE_AUTHS.ADMIN_FORGOT_PASSWORD:
		return authService.adminForgotPasswordValidate();
	default:
		return (request: AuthenticatedRequestInterface, response: Response, next: NextFunction) => {
			next();
		};
	}
};

/**
 * Validate admin
 * @param {AuthenticatedRequestInterface} request - Request object
 * @returns {Promise<boolean>} - True if admin is valid, false otherwise
 */
authService.adminValidate = () => {
	return (request: AuthenticatedRequestInterface, response: Response, next: NextFunction) => {
		validateAdmin(request)
			.then((result) => {
				if (result) {
					return next();
				}

				const responseObject = createErrorResponse(Constants.RESPONSE_MESSAGES.UNAUTHORIZED, Constants.ERROR_TYPES.UNAUTHORIZED);
				return response.status(responseObject.statusCode).json(responseObject);
			})
			.catch(() => {
				const responseObject = createErrorResponse(Constants.RESPONSE_MESSAGES.UNAUTHORIZED, Constants.ERROR_TYPES.UNAUTHORIZED);
				return response.status(responseObject.statusCode).json(responseObject);
			});
	};
};

/**
 * Validate admin forgot password
 * @param {AuthenticatedRequestInterface} request - Request object
 * @returns {Promise<boolean>} - True if admin is valid, false otherwise
 */
authService.adminForgotPasswordValidate = () => {
	return (request: AuthenticatedRequestInterface, response: Response, next: NextFunction) => {
		validateAdminForgotPassword(request)
			.then((result) => {
				if (result) {
					return next();
				}

				const responseObject = createErrorResponse(Constants.RESPONSE_MESSAGES.UNAUTHORIZED, Constants.ERROR_TYPES.UNAUTHORIZED);
				return response.status(responseObject.statusCode).json(responseObject);
			})
			.catch(() => {
				const responseObject = createErrorResponse(Constants.RESPONSE_MESSAGES.UNAUTHORIZED, Constants.ERROR_TYPES.UNAUTHORIZED);
				return response.status(responseObject.statusCode).json(responseObject);
			});
	};
};

/**
 * Validate admin
 * @param {AuthenticatedRequestInterface} request - Request object
 * @returns {Promise<boolean>} - True if admin is valid, false otherwise
 */
const validateAdmin = async (request: AuthenticatedRequestInterface) => {
	const token = request.headers.authorization;

	if (!token) {
		return false;
	}

	const decoded = Utils.decryptJWTToken(token);

	if (!decoded) {
		return false;
	}

	const session = await dbService.findOne(Models.sessionModel, {
		token: token,
		refPath: Constants.SESSIONS_REF_PATH.ADMIN,
		type: Constants.SESSION.LOGIN,
		expirationTime: { $gt: new Date() }
	});

	if (!session) {
		return false;
	}

	const admin = await dbService.findOne(Models.adminModel, {
		_id: decoded.id,
		isDeleted: false
	});

	if (!admin) {
		return false;
	}

	request.admin = admin;
	return true;
};

/**
 * Validate admin forgot password
 * @param {AuthenticatedRequestInterface} request - Request object
 * @returns {Promise<boolean>} - True if admin is valid, false otherwise
 */
const validateAdminForgotPassword = async (request: AuthenticatedRequestInterface) => {
	const token = request.headers.authorization;

	if (!token) {
		return false;
	}

	const decoded = Utils.decryptJWTToken(token);

	if (!decoded) {
		return false;
	}

	const session = await dbService.findOne(Models.sessionModel, {
		token: token,
		refPath: Constants.SESSIONS_REF_PATH.ADMIN,
		type: Constants.SESSION.FORGOT_PASSWORD,
		expirationTime: { $gt: new Date() }
	});

	if (!session) {
		return false;
	}

	const admin = await dbService.findOne(Models.adminModel, {
		_id: session.userId,
		isDeleted: false
	});

	if (!admin) {
		return false;
	}

	request.admin = admin;
	return true;
};

export default authService;
