import Joi from 'joi';
import path from 'path';
import multer from 'multer';
import { Request, Response, NextFunction, RequestHandler } from 'express';
import authService from '../services/authService';
import { createErrorResponse } from '../commons/responseHelpers';
import { convertErrorIntoReadableForm } from './commonFunctions';
import config from '../config';
import { Constants } from '../commons/constants';
import { swaggerDoc } from '../services/swaggerService';
import swaggerUI from 'swagger-ui-express';
import basicAuth from 'express-basic-auth';
import { SWAGGER } from '../config/swaggerConfig';
import rateLimitService from '../services/rateLimitService';

const SWAGGER_AUTH = config.SWAGGER_AUTH;
const uploadMiddleware = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 5 * 1024 * 1024 // 5 MB
	},
	fileFilter: (req, file, cb) => {
		const allowedMimeTypes = [ 'application/pdf', 'image/png', 'image/jpeg', 'application/msword' ];
		if (allowedMimeTypes.includes(file.mimetype)) {
			cb(null, true);
		} else {
			cb(new Error(Constants.RESPONSE_MESSAGES.FILE_UPLOAD_TYPE_ERROR));
		}
	}
});

const multerErrorHandler: any = (err: Error, req: Request, res: Response, next: NextFunction) => {
	if (err instanceof multer.MulterError || err?.message?.includes(Constants.RESPONSE_MESSAGES.FILE_UPLOAD_TYPE_ERROR)) {
		const responseObject = createErrorResponse(err.message || 'File upload error', Constants.ERROR_TYPES.BAD_REQUEST);
		return res.status(responseObject.statusCode).json(responseObject);
	}
	next(err);
};

const routeUtils: any = {
	route: async (app: any, routes: any = []) => {
		routes.forEach((route: any) => {
			const middlewares: RequestHandler[] = [];

			if (route.auth) {
				middlewares.push(authService.validateAuth(route.auth));
			}
			if (route.authWebhook) {
				middlewares.push(authService.webhookValidate(route.authWebhook));
			}
			if (route.joiSchemaForSwagger.formData) {
				const multerMiddleware: any = getMulterMiddleware(route.joiSchemaForSwagger.formData);
				middlewares.push(multerMiddleware, multerErrorHandler);
			}
			if (route.rateLimit) {
				middlewares.push(rateLimitService.limit());
			}

			middlewares.push(getValidatorMiddleware(route));

			app.route(route.path)[route.method.toLowerCase()](...middlewares, getHandlerMethod(route));
		});
		createSwaggerUIForRoutes(app, routes);
	}
};

/**
 * middleware to validate request body/params/query/headers with JOI.
 * @param {*} route
 */
const getValidatorMiddleware = (route: any) => {
	return (request: any, response: any, next: any) => {
		joiValidatorMethod(request, route)
			.then(() => {
				return next();
			})
			.catch((err) => {
				const error = convertErrorIntoReadableForm(err);
				const responseObject = createErrorResponse(error.message, Constants.ERROR_TYPES.BAD_REQUEST);
				return response.status(responseObject.statusCode).json(responseObject);
			});
	};
};

/**
 *  middleware to  to handle the multipart/form-data
 * @param {*} formData
 */
const getMulterMiddleware = (formData: any) => {
	// for multiple files
	if (formData.files && Object.keys(formData.files).length) {
		const fileFields: any = [];
		const keys = Object.keys(formData.files);
		keys.forEach((key) => {
			fileFields.push({ name: key, maxCount: formData.files[key] });
		});
		return uploadMiddleware.fields(fileFields);
	}
	//for single file
	if (formData.file && Object.keys(formData.file).length) {
		const fileField = Object.keys(formData.file)[0];
		return uploadMiddleware.single(fileField);
	}
	//for file array in single key
	if (formData.fileArray && Object.keys(formData.fileArray).length) {
		const fileField = Object.keys(formData.fileArray)[0];
		return uploadMiddleware.array(fileField, formData.fileArray[fileField].maxCount);
	}
};

/**
 * middleware
 * @param {*} handler
 */
const getHandlerMethod = (route: any) => {
	const handler = route.handler;
	return (request: any, response: any) => {
		const payload = {
			...((request.body || {}).value || {}),
			...((request.params || {}).value || {}),
			...((request.query || {}).value || {}),
			...((request.formData || {}).value || {}),
			user: request.user ? request.user : {},
			admin: request.admin ? request.admin : {},
			userSession: request.userSession ? request.userSession : {},
			authToken: request.headers.authorization || '',
			key: !!request.headers['x-api-key'],
			file: request.file || {},
			files: request.files || []
		};
		// request handler/controller
		if (route.getExactRequest) {
			request.payload = payload;
			payload.request = request;
			payload.response = response;
		}
		handler(payload)
			?.then((result: any) => {
				if (!route.notSendResponse) {
					if (result?.filePath) {
						const filePath = path.join(__dirname, '/../../', result?.filePath);
						return response.status(result?.statusCode).sendFile(filePath);
					}
					response.status(result?.statusCode).json(result);
				}
			})
			?.catch((err: any) => {
				if (!err.statusCode && !err.status) {
					console.log('[INTERNAL_SERVER_ERROR]', err);
					err = createErrorResponse(Constants.RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR, Constants.ERROR_TYPES.INTERNAL_SERVER_ERROR);
				}
				response.status(err.statusCode).json(err);
			});
	};
};

/**
 * function to check the error of all joi validations
 * @param {*} joiValidatedObject
 */
const checkJoiValidationError = (joiValidatedObject: any) => {
	if (joiValidatedObject.error) throw joiValidatedObject.error;
};

const joiValidatorMethod = async (request: any, route: any) => {
	if (route.joiSchemaForSwagger.params && Object.keys(route.joiSchemaForSwagger.params).length) {
		request.params = Joi.object(route.joiSchemaForSwagger.params).validate(request.params);
		checkJoiValidationError(request.params);
	}
	if (route.joiSchemaForSwagger.body && Object.keys(route.joiSchemaForSwagger.body).length) {
		request.body = Joi.object(route.joiSchemaForSwagger.body).validate(request.body);
		checkJoiValidationError(request.body);
	}
	if (route.joiSchemaForSwagger.query && Object.keys(route.joiSchemaForSwagger.query).length) {
		request.query = Joi.object(route.joiSchemaForSwagger.query).validate(request.query);
		checkJoiValidationError(request.query);
	}
	if (route.joiSchemaForSwagger.headers && Object.keys(route.joiSchemaForSwagger.headers).length) {
		const headersObject = Joi.object(route.joiSchemaForSwagger.headers).unknown(true).validate(request.headers);
		checkJoiValidationError(headersObject);
		request.headers.authorization = ((headersObject || {}).value || {}).authorization;
	}
	if (route.joiSchemaForSwagger?.formData?.body && Object.keys(route.joiSchemaForSwagger.formData?.body).length) {
		const formDataObject = Joi.object(route.joiSchemaForSwagger.formData?.body).validate(request.body);
		checkJoiValidationError(formDataObject);
		request.formData = formDataObject;
	}
};

/**
 * function to create Swagger UI for the available routes of the application.
 * @param {*} app Express instance.
 * @param {*} routes Available routes.
 */

const createSwaggerUIForRoutes = async (app: any, routes: any[] = []) => {
	try {
		const swaggerInfo = SWAGGER.info;
		const swJson: any = swaggerDoc;
		swJson.createJsonDoc(swaggerInfo);

		// Add routes dynamically to the Swagger JSON
		routes.forEach((route) => {
			swJson.addNewRoute(route.joiSchemaForSwagger, route.path, route.method.toLowerCase());
		});

		// Setup Basic Auth for Swagger UI
		const swaggerAuthUsers: { [key: string]: string } = {};
		swaggerAuthUsers[SWAGGER_AUTH.USERNAME] = SWAGGER_AUTH.PASSWORD;

		const swaggerOptions = {
			customSiteTitle: process.env.SWAGGER_TITLE || 'Admin Boilerplate Backend API Documentation'
		};

		// Resolve path to Swagger JSON
		const swaggerFilePath = path.resolve(__dirname, '../../swagger.json');
		const swaggerDocument = await import(swaggerFilePath);

		// Serve Swagger UI with Basic Auth
		app.use(
			'/documentation',
			basicAuth({
				users: swaggerAuthUsers,
				challenge: true
			}),
			swaggerUI.serve,
			swaggerUI.setup(swaggerDocument, swaggerOptions)
		);
	} catch (err) {
		console.error('Error setting up Swagger UI:', err);
		throw new Error('Failed to set up Swagger UI');
	}
};

export default routeUtils;
