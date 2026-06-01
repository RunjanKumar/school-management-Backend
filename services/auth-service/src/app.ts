import cors from 'cors';
import express, { Request, Response } from 'express';
import Joi from 'joi';
import swaggerUi from 'swagger-ui-express';
import { createSchoolAdmin, forgotPassword, googleAuth, login, logout, me, refresh, resetPassword, updateMe } from './controllers/authController';
import { authSwaggerDocument } from './docs/swagger';
import { errorHandler } from './middleware/errorHandler';
import { internalAuth } from './middleware/internalAuth';
import { verifyTokenAndSession } from './services/tokenService';
import { asyncHandler, validateBody } from './utils/routeUtils';

const loginSchema = Joi.object({
	email: Joi.string().email().required(),
	password: Joi.string().required(),
	deviceId: Joi.string().optional()
});

const googleLoginSchema = Joi.object({
	idToken: Joi.string().required(),
	role: Joi.string().valid('parent', 'student', 'guest').optional(),
	schoolCode: Joi.string().optional(),
	deviceId: Joi.string().optional()
});

const forgotPasswordSchema = Joi.object({
	email: Joi.string().email().required()
});

const resetPasswordSchema = Joi.object({
	token: Joi.string().required(),
	password: Joi.string().required()
});

const refreshSchema = Joi.object({
	refreshToken: Joi.string().required()
});

const logoutSchema = Joi.object({
	token: Joi.string().optional(),
	refreshToken: Joi.string().optional()
});

const createSchoolAdminSchema = Joi.object({
	name: Joi.string().trim().min(2).max(100).optional(),
	email: Joi.string().email().required(),
	password: Joi.string().min(8).required()
});

const updateMeSchema = Joi.object({
	name: Joi.string().trim().min(2).max(100).required()
});

export function createAuthApp() {
	const app = express();

	app.use(cors());
	app.use(express.json({ limit: '1mb' }));
	app.use(express.urlencoded({ extended: true }));

	app.get('/swagger.json', (_request, response) => {
		response.status(200).json(authSwaggerDocument);
	});
	app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(authSwaggerDocument));

	app.get('/health', (_request, response) => {
		response.status(200).json({
			status: 'healthy',
			service: 'auth-service',
			timestamp: new Date().toISOString(),
			uptime: process.uptime()
		});
	});

	app.post('/v1/auth/login', validateBody(loginSchema), asyncHandler(login));
	app.post('/v1/auth/google', validateBody(googleLoginSchema), asyncHandler(googleAuth));
	app.post('/v1/auth/forgot-password', validateBody(forgotPasswordSchema), asyncHandler(forgotPassword));
	app.post('/v1/auth/reset-password', validateBody(resetPasswordSchema), asyncHandler(resetPassword));
	app.post('/v1/auth/refresh', validateBody(refreshSchema), asyncHandler(refresh));
	app.post('/v1/auth/logout', validateBody(logoutSchema), asyncHandler(logout));
	app.get('/v1/auth/me', asyncHandler(me));
	app.put('/v1/auth/me', validateBody(updateMeSchema), asyncHandler(updateMe));
	app.post('/v1/auth/school-admins', validateBody(createSchoolAdminSchema), asyncHandler(createSchoolAdmin));
	app.post(
		'/v1/internal/auth/validate',
		internalAuth,
		asyncHandler(async (req: Request, res: Response) => {
			const { token } = req.body;
			if (!token) {
				return res.status(401).json({ valid: false, message: 'No token provided' });
			}

			const validation = await verifyTokenAndSession(token);
			if (!validation.valid) {
				return res.status(401).json(validation);
			}

			return res.json(validation);
		})
	);
	app.use(errorHandler);

	return app;
}

export default createAuthApp;
