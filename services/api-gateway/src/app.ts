import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import config from './config';
import { gatewaySwaggerDocument } from './docs/swagger';
import { createAuthProxyMiddleware } from './routes/authProxy';
import { createSchoolProxyMiddleware } from './routes/schoolProxy';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/authMiddleware';
import { roleGuard } from './middleware/roleGuard';
import { Constants } from '@school/common';

type GatewayAppOptions = {
	authServiceUrl?: string;
	schoolServiceUrl?: string;
	rateLimitWindowMs?: number;
	rateLimitMaxRequests?: number;
};

export function createGatewayApp(options: GatewayAppOptions = {}) {
	const app = express();

	app.use(cors());
	app.use(
		rateLimit({
			windowMs: options.rateLimitWindowMs || config.RATE_LIMIT_WINDOW_MS,
			max: options.rateLimitMaxRequests || config.RATE_LIMIT_MAX_REQUESTS,
			standardHeaders: true,
			legacyHeaders: false
		})
	);

	app.get('/swagger.json', (_request, response) => {
		response.status(200).json(gatewaySwaggerDocument);
	});
	app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(gatewaySwaggerDocument));

	app.get('/health', (_request, response) => {
		response.status(200).json({
			status: 'healthy',
			service: 'api-gateway',
			timestamp: new Date().toISOString(),
			uptime: process.uptime()
		});
	});

	const authProxyMiddleware = createAuthProxyMiddleware(options.authServiceUrl);
	const superAdminOnly = roleGuard([ Constants.USER_ROLES.SUPER_ADMIN ]);
	const schoolAdminOnly = roleGuard([ Constants.USER_ROLES.SCHOOL_ADMIN ]);
	const schoolReaders = roleGuard([ Constants.USER_ROLES.SUPER_ADMIN, Constants.USER_ROLES.SCHOOL_ADMIN ]);

	app.post('/v1/auth/school-admins', authMiddleware, superAdminOnly, authProxyMiddleware);
	app
		.route('/v1/auth/*')
		.delete(authProxyMiddleware)
		.get(authProxyMiddleware)
		.patch(authProxyMiddleware)
		.post(authProxyMiddleware)
		.put(authProxyMiddleware);

	const schoolProxyMiddleware = createSchoolProxyMiddleware(options.schoolServiceUrl);
	app
		.route('/v1/schools')
		.get(authMiddleware, schoolReaders, schoolProxyMiddleware)
		.post(authMiddleware, schoolAdminOnly, schoolProxyMiddleware);
	app
		.route('/v1/schools/*')
		.delete(authMiddleware, schoolAdminOnly, schoolProxyMiddleware)
		.get(authMiddleware, schoolReaders, schoolProxyMiddleware)
		.patch(authMiddleware, schoolAdminOnly, schoolProxyMiddleware)
		.post(authMiddleware, schoolAdminOnly, schoolProxyMiddleware)
		.put(authMiddleware, schoolAdminOnly, schoolProxyMiddleware);

	app.use(errorHandler);

	return app;
}

export default createGatewayApp;
