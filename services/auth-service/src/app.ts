import express, { Request, Response } from 'express';
import { login, logout, me } from './controllers/authController';
import { errorHandler } from './middleware/errorHandler';
import { internalAuth } from './middleware/internalAuth';
import { verifyToken } from './services/tokenService';
import { asyncHandler, validateBody } from './utils/routeUtils';
import Joi from 'joi';

export function createAuthApp() {
	const app = express();
	const loginSchema = Joi.object({
		email: Joi.string().email().required(),
		password: Joi.string().required()
	});

	app.use(express.json({ limit: '1mb' }));
	app.use(express.urlencoded({ extended: true }));

	app.get('/health', (_request, response) => {
		response.status(200).json({
			status: 'healthy',
			service: 'auth-service',
			timestamp: new Date().toISOString(),
			uptime: process.uptime()
		});
	});

	app.post('/v1/auth/login', validateBody(loginSchema), asyncHandler(login));
	app.post('/v1/auth/logout', asyncHandler(logout));
	app.get('/v1/auth/me', asyncHandler(me));
	app.post('/v1/internal/auth/validate', internalAuth, asyncHandler(async (req: Request, res: Response) => {
		const { token } = req.body;
		if (!token) {
			return res.status(401).json({ valid: false, message: 'No token provided' });
		}

		try {
			const decoded = verifyToken(token);
			return res.json({ valid: true, decoded });
		} catch (error) {
			return res.status(401).json({ valid: false, message: 'Invalid token' });
		}
	}));
	app.use(errorHandler);

	return app;
}

export default createAuthApp;
