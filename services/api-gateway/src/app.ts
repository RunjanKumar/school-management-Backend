import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import config from './config';
import { createAuthProxyRouter } from './routes/authProxy';
import { errorHandler } from './middleware/errorHandler';

type GatewayAppOptions = {
	authServiceUrl?: string;
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

	app.get('/health', (_request, response) => {
		response.status(200).json({
			status: 'healthy',
			service: 'api-gateway',
			timestamp: new Date().toISOString(),
			uptime: process.uptime()
		});
	});

	app.use(createAuthProxyRouter(options.authServiceUrl));
	app.use(errorHandler);

	return app;
}

export default createGatewayApp;

