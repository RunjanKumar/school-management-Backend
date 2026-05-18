import dotenv from 'dotenv';
dotenv.config();
import http from 'http';
import express, { Application } from 'express';

import CONFIG from './config';
import app from './startup/app';
import { logger } from './services/logger';
import connectToDatabase from './startup/mongoStartup';

const application: Application = express();
const server = http.createServer(application);
const PORT = CONFIG.PORT || 3000;

const startServerInitSequence = async () => {
	await connectToDatabase();
	await app(application);
};

const startServer = async () => {
	try {
		logger.info('Running startup services');
		await startServerInitSequence();
		server
			.listen(PORT, () => {
				logger.info(`Server is running on port ${PORT}`);
				logger.info(`API documentation is available at http://localhost:${PORT}/documentation`);
			})
			.on('error', (error: any) => {
				logger.error(`Error occurred while starting the server: \n ${error}`);
				process.exit(1);
			});
	} catch (error: any) {
		logger.error(`Error occurred while starting the server: \n ${error}`);
		process.exit(1);
	}
};

void startServer();

process.on('unhandledRejection', (error: any) => {
	logger.error(`Error occurred while starting the server: \n ${error}`);
});
