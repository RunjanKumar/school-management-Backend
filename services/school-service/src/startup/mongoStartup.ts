import mongoose from 'mongoose';
import { config } from '../config';
import { logger } from '../services/logger';

export const connectDB = async () => {
	try {
		await mongoose.connect(config.mongoUri);
		logger.info('MongoDB connected', { mongoUri: config.mongoUri });
	} catch (error) {
		logger.error('MongoDB connection error', { error });
		process.exit(1);
	}
};
