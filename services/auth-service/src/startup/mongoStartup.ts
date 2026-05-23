import mongoose from 'mongoose';
import config from '../config';
import { logger } from '../services/logger';

const redactConnectionString = (connectionString: string) => connectionString.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');

export const connectToDatabase = async () => {
	try {
		logger.info(`Connecting to MongoDB at ${redactConnectionString(config.MONGODB_URI)}`);
		await mongoose.connect(config.MONGODB_URI, {
			serverSelectionTimeoutMS: 30000,
			socketTimeoutMS: 45000
		});
		logger.info('MongoDB connected successfully');
	} catch (error) {
		logger.error(`Error connecting to MongoDB: ${error}`);
		process.exit(1);
	}
};

