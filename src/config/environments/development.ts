type Config = {
	PORT: number | string;
	JWT_SECRET: string | undefined;
	SMTP: any;
	ADMIN_CRED: any;
	DB: any;
	HOST: string;
	PROTOCOL: string;
	SERVER_URL: string;
	SWAGGER_AUTH: any;
	CLIENT_EMAIL: string;
	PATH_TO_UPLOAD_FILES_ON_LOCAL_SERVER: string;
};

const config: Config = {
	JWT_SECRET: process.env.JWT_SECRET,

	PROTOCOL: process.env.SERVER_PROTOCOL || 'http',
	HOST: process.env.SERVER_HOST || '0.0.0.0',
	PORT: process.env.PORT || 3000,
	PATH_TO_UPLOAD_FILES_ON_LOCAL_SERVER: process.env.PATH_TO_UPLOAD_FILES_ON_LOCAL_SERVER || 'uploads/',
	get SERVER_URL() {
		return process.env.SERVER_URL || `${this.PROTOCOL}://${this.HOST}:${this.PORT}`;
	},
	SMTP: {
		TRANSPORT: {
			host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
			port: process.env.SMTP_PORT || 587,
			secure: false,
			auth: {
				user: process.env.SMTP_USER || '',
				pass: process.env.SMTP_PASSWORD || ''
			},
			tls: { rejectUnauthorized: false }
		},
		SENDER: process.env.SENDER_EMAIL || ''
	},
	ADMIN_CRED: {
		NAME: process.env.ADMIN_NAME || '',
		EMAIL: process.env.ADMIN_EMAIL || '',
		PASSWORD: process.env.ADMIN_PASSWORD || ''
	},
	SWAGGER_AUTH: {
		USERNAME: process.env.SWAGGER_AUTH_USERNAME || '',
		PASSWORD: process.env.SWAGGER_AUTH_PASSWORD || ''
	},
	DB: {
		PROTOCOL: process.env.DB_PROTOCOL || '',
		HOST: process.env.DB_HOST || '',
		PORT: process.env.DB_PORT,
		NAME: process.env.DB_NAME || '',
		USER: process.env.DB_USER || '',
		PASSWORD: process.env.DB_PASSWD || '',
		get DATABASE_URI() {
			return process.env.DATABASE_URI || `${this.PROTOCOL}://${this.HOST}:${this.PORT}/${this.NAME}`;
		}
	},
	CLIENT_EMAIL: process.env.CLIENT_EMAIL || ''
};

export default config;
