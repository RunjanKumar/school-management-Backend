import { Constants } from '../../../commons/constants';
import { adminController } from '../../../controllers';
import joiUtils from '../../../utils/joiUtils';

const Joi = joiUtils.Joi;

const routes: any = [
	{
		method: 'POST',
		path: '/v1/admin/login',
		joiSchemaForSwagger: {
			body: {
				email: Joi.string().email().lowercase().required().description('Email of the admin'),
				password: Joi.string().required().description('Password of the admin')
			},
			group: 'Admin',
			description: 'API to login as a admin.',
			model: 'AdminLogin'
		},
		handler: adminController.loginAdmin
	},
	{
		method: 'GET',
		path: '/v1/admin/getProfile',
		joiSchemaForSwagger: {
			headers: {
				authorization: Joi.string().required().description('Admin\'s JWT token')
			},
			group: 'Admin',
			description: 'API to get admin profile.',
			model: 'AdminProfile'
		},
		auth: Constants.AVAILABLE_AUTHS.ADMIN,
		handler: adminController.getAdminProfile
	},
	{
		method: 'POST',
		path: '/v1/admin/logout',
		joiSchemaForSwagger: {
			headers: {
				authorization: Joi.string().required().description('Admin\'s JWT token')
			},
			group: 'Admin',
			description: 'API to logout admin.',
			model: 'AdminLogout'
		},
		auth: Constants.AVAILABLE_AUTHS.ADMIN,
		handler: adminController.logoutAdmin
	},
	{
		method: 'POST',
		path: '/v1/admin/forgotPassword',
		joiSchemaForSwagger: {
			body: {
				email: Joi.string().email().lowercase().required().description('Email of the admin')
			},
			group: 'Admin',
			description: 'API to forgot password of the admin.',
			model: 'AdminForgotPassword'
		},
		handler: adminController.forgotAdminPassword
	},
	{
		method: 'POST',
		path: '/v1/admin/resetPassword',
		joiSchemaForSwagger: {
			headers: {
				authorization: Joi.string().required().description('Admin\'s JWT token')
			},
			body: {
				password: Joi.string().password().required().description('New password of the admin')
			},
			group: 'Admin',
			description: 'API to reset password of the admin.',
			model: 'AdminResetPassword'
		},
		auth: Constants.AVAILABLE_AUTHS.ADMIN_FORGOT_PASSWORD,
		handler: adminController.resetAdminPassword
	}
];

export default routes;
