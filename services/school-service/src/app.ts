import cors from 'cors';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { schoolSwaggerDocument } from './docs/swagger';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes';
import { logger } from './services/logger';

export function createSchoolApp() {
	const app = express();

	app.use(cors());
	app.use(express.json({ limit: '1mb' }));
	app.use(express.urlencoded({ extended: true }));

	app.get('/swagger.json', (_request, response) => {
		response.status(200).json(schoolSwaggerDocument);
	});
	app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(schoolSwaggerDocument));

	app.get('/health', (_request, response) => {
		response.status(200).json({
			status: 'healthy',
			service: 'school-service',
			timestamp: new Date().toISOString(),
			uptime: process.uptime()
		});
	});

	// School Service owns tenant data and exposes both public gateway routes and internal service checks.
	app.use('/v1', routes);

	app.use(errorHandler);

	logger.info('School app initialized');
	return app;
}

export default createSchoolApp;
