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
	connectToDatabase();
	await app(application);
};

server
	.listen(PORT, () => {
		console.clear();
		logger.info(`Server is running on port ${PORT}`);
		console.warn(`Server is running on: http://localhost:${PORT}/documentation`);
		logger.info('Running Startup services');
		startServerInitSequence();
	})
	.on('error', (error: any) => {
		logger.error(`Error occurred while starting the server: \n ${error}`);
		process.exit(1);
	});

process.on('unhandledRejection', (error: any) => {
	logger.error(`Error occurred while starting the server: \n ${error}`);
	console.log(error.message);
});
