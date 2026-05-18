import mongoose from 'mongoose';
import config from '../config';
import { logger } from '../services/logger';

const redactConnectionString = (connectionString: string) => connectionString.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');

const connectToDatabase = async () => {
	try {
		const connectionString = config.DB.DATABASE_URI || 'mongodb://localhost:27017/test';
		logger.info(`Connecting to MongoDB at ${redactConnectionString(connectionString)}`);
		await mongoose.connect(connectionString, {
			serverSelectionTimeoutMS: 30000,
			socketTimeoutMS: 45000
		});

		logger.info('MongoDB connected successfully');
	} catch (error) {
		logger.error(`Error connecting to MongoDB: ${error}`);
		process.exit(1); // Exit the process if unable to connect
	}
};

export default connectToDatabase;
