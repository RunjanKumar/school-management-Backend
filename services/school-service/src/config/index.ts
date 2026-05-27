import dotenv from 'dotenv';
import path from 'path';

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

export const config = {
	port: process.env.PORT || 3002,
	mongoUri: process.env.MONGO_URI || process.env.DATABASE_URI || 'mongodb://localhost:27017/school_school_db',
	nodeEnv: process.env.NODE_ENV || 'development',
	internalApiKey: process.env.INTERNAL_API_KEY || 'your_internal_api_key_here'
};

export default config;
