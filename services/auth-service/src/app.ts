import express from 'express';
import authRoutes from './routes/authRoutes';
import { errorHandler } from './middleware/errorHandler';

export function createAuthApp() {
	const app = express();

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

	app.use(authRoutes);
	app.use(errorHandler);

	return app;
}

export default createAuthApp;
