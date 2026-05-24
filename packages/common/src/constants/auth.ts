export const AUTH_PROVIDERS = {
	PASSWORD: 'password',
	GOOGLE: 'google'
};

export const SESSION_TYPES = {
	LOGIN: 'login',
	FORGOT_PASSWORD: 'forgot_password',
	GOOGLE_LOGIN: 'google_login',
	REFRESH_TOKEN: 'refresh_token'
};

export const SESSIONS_REF_PATH = {
	USER: 'users',
	ADMIN: 'admins'
};

export const TOKEN_EXPIRATION_TIME = {
	LOGIN: 86400 * 7, // 7 days (seconds in a day * 7)
	FORGOT_PASSWORD: 60 * 30 // 30 minutes (seconds in a minute * 30)
};

export const REGEX = {
	PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s])(?=.{8,})/,
	TIME: /^([01]\d|2[0-3]):([0-5]\d)$/
};
