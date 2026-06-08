import mongoose from 'mongoose';
import { config } from '../config';
import { logger } from '../services/logger';
import { seedMasterData } from '../seeders/seedMasterData';

export const connectDB = async () => {
	 try {
		 await mongoose.connect(config.mongoUri);
		 logger.info('MongoDB connected', { mongoUri: config.mongoUri });
		 await seedMasterData();
	} catch (error) {
		logger.error('MongoDB connection error', { error });
		process.exit(1);
	}
};
