import { app } from './startup/app';
import { connectDB } from './startup/mongoStartup';
import { config } from './config';
import { logger } from './services/logger';

const startServer = async () => {
	try {
		await connectDB();

		app.listen(config.port, () => {
			const baseUrl = `http://localhost:${config.port}`;
			logger.info('School Service listening', { port: config.port, baseUrl });
			console.log(`School Service listening on port ${config.port}`);
			console.log(`School Service URL: ${baseUrl}`);
			console.log(`School Service Swagger UI: ${baseUrl}/api-docs`);
			console.log(`School Service Swagger JSON: ${baseUrl}/swagger.json`);
		});
	} catch (error) {
		logger.error('Failed to start school service', { error });
		process.exit(1);
	}
};

startServer();
