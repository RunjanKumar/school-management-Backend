import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 3001,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/school_auth_db',
  jwtSecret: process.env.JWT_SECRET || 'supersecret',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'supersecretrefresh',
  nodeEnv: process.env.NODE_ENV || 'development'
};
