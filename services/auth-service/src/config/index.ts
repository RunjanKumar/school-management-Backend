import dotenv from 'dotenv';

dotenv.config();

const config = {
	PORT: Number(process.env.AUTH_SERVICE_PORT || process.env.PORT || 3001),
	MONGODB_URI: process.env.AUTH_MONGODB_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/school_auth_db',
	JWT_SECRET: process.env.JWT_SECRET || '',
	INTERNAL_API_KEY: process.env.INTERNAL_API_KEY || '',
	ADMIN_CRED: {
		NAME: process.env.ADMIN_NAME,
		EMAIL: process.env.ADMIN_EMAIL,
		PASSWORD: process.env.ADMIN_PASSWORD
	}
};

export default config;
