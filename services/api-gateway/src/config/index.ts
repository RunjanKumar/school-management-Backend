import dotenv from 'dotenv';
dotenv.config();

export const config = {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    internalApiKey: process.env.INTERNAL_API_KEY || 'your_internal_api_key_here',
    RATE_LIMIT_WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
    RATE_LIMIT_MAX_REQUESTS: Number(process.env.RATE_LIMIT_MAX_REQUESTS || 100),
    services: {
        auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
        school: process.env.SCHOOL_SERVICE_URL || 'http://localhost:3002',
        user: process.env.USER_SERVICE_URL || 'http://localhost:3003',
        academic: process.env.ACADEMIC_SERVICE_URL || 'http://localhost:3004',
        fee: process.env.FEE_SERVICE_URL || 'http://localhost:3005',
        notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3006',
    }
};

export default config;
