import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 3001,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/school_auth_db',
  jwtSecret: process.env.JWT_SECRET || 'supersecret',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'supersecretrefresh',
  nodeEnv: process.env.NODE_ENV || 'development',
  INTERNAL_API_KEY: process.env.INTERNAL_API_KEY || 'your_internal_api_key_here',
  JWT_SECRET: process.env.JWT_SECRET || 'supersecret'
};

export default config;
