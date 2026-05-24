import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import config from './config';
import { createAuthProxyMiddleware } from './routes/authProxy';
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

	const authProxyMiddleware = createAuthProxyMiddleware(options.authServiceUrl);
	app
		.route('/v1/auth/*')
		.delete(authProxyMiddleware)
		.get(authProxyMiddleware)
		.patch(authProxyMiddleware)
		.post(authProxyMiddleware)
		.put(authProxyMiddleware);
	app.use(errorHandler);

	return app;
}

export default createGatewayApp;
