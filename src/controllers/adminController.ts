import dbService from '../services/databaseService';
import { createErrorResponse, createSuccessResponse } from '../commons/responseHelpers';
import { adminModel, sessionModel } from '../models';
import { Constants } from '../commons/constants';
import { Utils } from '../utils/utils';
import { AdminInterface } from '../interfaces';
import { sendEmail } from '../utils/commonFunctions';
import config from '../config';

/**
 * Login admin
 * @param {Object} payload - Request Payload
 * @param {string} payload.email - email of the admin
 * @param {string} payload.password - password of the admin
 * @returns {Object} - token and admin data
 */
async function loginAdmin(payload: any) {
	// fetch admin
	const admin: AdminInterface | null = await dbService.findOne(adminModel, {
		email: payload.email,
		isDeleted: false
	});

	if (!admin) {
		throw createErrorResponse(Constants.RESPONSE_MESSAGES.ADMIN_NOT_FOUND, Constants.ERROR_TYPES.BAD_REQUEST);
	}

	// check password
	if (!(await Utils.comparePassword(payload.password, admin.password))) {
		throw createErrorResponse(Constants.RESPONSE_MESSAGES.ADMIN_NOT_FOUND, Constants.ERROR_TYPES.BAD_REQUEST);
	}

	// generate token
	const token = Utils.generateJWTToken(admin._id.toString(), Constants.TOKEN_EXPIRATION_TIME.LOGIN);

	// create session
	await dbService.create(sessionModel, {
		userId: admin._id,
		refPath: Constants.SESSIONS_REF_PATH.ADMIN,
		type: Constants.SESSION.LOGIN,
		token: token.token,
		expirationTime: new Date(Date.now() + Constants.TOKEN_EXPIRATION_TIME.LOGIN * 1000)
	});

	return createSuccessResponse(Constants.RESPONSE_MESSAGES.LOGIN_SUCCESSFUL, { token: token.token });
}

/**
 * Get admin profile
 * @param {Object} payload - Request Payload
 * @param {Object} payload.admin - Admin data
 * @returns {Object} - Success message and admin data
 */
async function getAdminProfile(payload: any) {
	return createSuccessResponse(Constants.RESPONSE_MESSAGES.ADMIN_PROFILE_FETCHED, {
		admin: {
			_id: payload.admin._id,
			name: payload.admin.name,
			email: payload.admin.email
		}
	});
}

/**
 * Logout admin
 * @param {Object} payload - Request Payload
 * @param {Object} payload.admin - Admin data
 * @returns {Object} - Success message
 */
async function logoutAdmin(payload: any) {
	await dbService.deleteOne(sessionModel, { token: payload.authToken });

	return createSuccessResponse(Constants.RESPONSE_MESSAGES.LOGOUT_SUCCESSFUL);
}

/**
 * Forgot admin password
 * @param {Object} payload - Request Payload
 * @param {string} payload.email - email of the admin
 * @returns {Object} - Success message
 */
async function forgotAdminPassword(payload: any) {
	const admin: AdminInterface | null = await dbService.findOne(adminModel, { email: payload.email });

	if (!admin) {
		throw createErrorResponse(Constants.RESPONSE_MESSAGES.ADMIN_NOT_FOUND, Constants.ERROR_TYPES.BAD_REQUEST);
	}

	const forgotPasswordToken = Utils.generateJWTToken(admin._id.toString(), Constants.TOKEN_EXPIRATION_TIME.FORGOT_PASSWORD);

	await dbService.create(sessionModel, {
		userId: admin._id,
		refPath: Constants.SESSIONS_REF_PATH.ADMIN,
		type: Constants.SESSION.FORGOT_PASSWORD,
		token: forgotPasswordToken.token,
		expirationTime: new Date(Date.now() + Constants.TOKEN_EXPIRATION_TIME.FORGOT_PASSWORD * 1000)
	});

	await sendEmail(
		{
			email: admin.email,
			firstName: Utils.capitalizeFirstLetter(admin.name.split(' ')[0]),
			resetUrl: `${config.SERVER_URL}/reset-password?token=${forgotPasswordToken.token}`
		},
		Constants.EMAIL_TYPES.FORGOT_PASSWORD
	);

	return createSuccessResponse(Constants.RESPONSE_MESSAGES.FORGOT_PASSWORD_MAIL_SENT_SUCCESSFUL);
}

/**
 * Reset admin password
 * @param {Object} payload - Request Payload
 * @param {Object} payload.admin - Admin data
 * @param {string} payload.password - New password of the admin
 * @returns {Object} - Success message
 */
async function resetAdminPassword(payload: any) {
	await dbService.updateOne(adminModel, { _id: payload.admin._id }, { password: await Utils.hashPassword(payload.password) });

	await dbService.deleteOne(sessionModel, { token: payload.authToken });

	return createSuccessResponse(Constants.RESPONSE_MESSAGES.PASSWORD_RESET_SUCCESSFUL);
}

export const adminController = {
	loginAdmin,
	getAdminProfile,
	logoutAdmin,
	forgotAdminPassword,
	resetAdminPassword
};
