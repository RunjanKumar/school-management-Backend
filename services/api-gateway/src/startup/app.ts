import express, { Request, Response } from 'express';
import cors from 'cors';
import axios from 'axios';
import { config } from '../config';
import { errorHandler } from '@school/common';
import { logger } from '../services/logger';
import { globalRateLimiter } from '../middleware/rateLimiter';
import routes from '../routes';

const app = express();

// Middleware
app.use(cors());
app.use(globalRateLimiter);

// Note: Body parsing is generally omitted in the API gateway for proxied routes
// because http-proxy-middleware forwards the raw stream.

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
	const healthStatus: Record<string, string> = {
		gateway: 'up'
	};

	try {
		// Check downstream Auth Service
		const authCheck = await axios.get(`${config.services.auth}/health`, { timeout: 2000 }).catch(() => null);
		healthStatus.auth = authCheck?.status === 200 ? 'up' : 'down';

		// Additional service checks can be added here once they are running
	} catch (error) {
		logger.error('Health check failed for some services', { error });
	}

	const isAllUp = Object.values(healthStatus).every((status) => status === 'up');
	res.status(isAllUp ? 200 : 503).json({
		status: isAllUp ? 'healthy' : 'degraded',
		services: healthStatus,
		timestamp: new Date().toISOString()
	});
});

// Setup proxy routes
app.use('/', routes);

// Global Error Handler
app.use(errorHandler);

export { app };
