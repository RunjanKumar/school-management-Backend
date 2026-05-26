import axios from 'axios';
import { Request, Response } from 'express';
import { config } from '../config';
import { logger } from '../services/logger';
import { createGatewayApp } from '../app';

export const app = createGatewayApp();

app.get('/services/health', async (_req: Request, res: Response) => {
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
