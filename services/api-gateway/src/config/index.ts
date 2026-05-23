import dotenv from 'dotenv';

dotenv.config();

const config = {
	PORT: Number(process.env.API_GATEWAY_PORT || process.env.PORT || 3000),
	AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
	SCHOOL_SERVICE_URL: process.env.SCHOOL_SERVICE_URL || 'http://localhost:3002',
	USER_SERVICE_URL: process.env.USER_SERVICE_URL || 'http://localhost:3003',
	ACADEMIC_SERVICE_URL: process.env.ACADEMIC_SERVICE_URL || 'http://localhost:3004',
	FEE_SERVICE_URL: process.env.FEE_SERVICE_URL || 'http://localhost:3005',
	INTERNAL_API_KEY: process.env.INTERNAL_API_KEY || '',
	RATE_LIMIT_WINDOW_MS: Number(process.env.API_GATEWAY_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
	RATE_LIMIT_MAX_REQUESTS: Number(process.env.API_GATEWAY_RATE_LIMIT_MAX_REQUESTS || 100)
};

export default config;

