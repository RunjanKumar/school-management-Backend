import mongoose from 'mongoose';
import config from '../config';

const connectToDatabase = async () => {
	try {
		const connectionString = config.DB.DATABASE_URI || 'mongodb://localhost:27017/test';
		console.log('Connecting to MongoDB...', connectionString);
		await mongoose.connect(connectionString, {
			serverSelectionTimeoutMS: 30000,
			socketTimeoutMS: 45000
		});

		// Run migrations
		console.log('MongoDB connected successfully');
	} catch (error) {
		console.error('Error connecting to MongoDB:', error);
		process.exit(1); // Exit the process if unable to connect
	}
};

export default connectToDatabase;
