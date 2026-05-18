import path from 'path';
import fs from 'fs';

const RESPONSE_MESSAGES = {
	UNAUTHORIZED: 'You are not authorized to perform this action.',
	ADMIN_NOT_FOUND: 'Admin not found.',
	ADMIN_PROFILE_FETCHED: 'Admin profile fetched successfully.',
	USER_ALREADY_EXISTS: 'A user with this email already exists.',
	INVALID_EMAIL_OR_PASSWORD: 'Invalid email or password.',
	LOGIN_SUCCESSFUL: 'You have logged in successfully.',
	LOGOUT_SUCCESSFUL: 'You have logged out successfully.',
	INTERNAL_SERVER_ERROR: 'An unexpected error occurred. Please try again later.',
	FORGOT_PASSWORD_MAIL_SENT_SUCCESSFUL: 'Forgot password mail sent successfully.',
	PASSWORD_RESET_SUCCESSFUL: 'Password reset successfully.',
	PASSWORD_VALIDATION_FAILED: 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character and be at least 8 characters long.',
	FILE_UPLOAD_TYPE_ERROR: 'Invalid file type. Please upload a valid file.',
	TOO_MANY_REQUESTS: 'Too many requests. Please try again later.',
	EMAIL_ALREADY_IN_USE: 'Email already in use.',
	USER_CREATED_SUCCESSFULLY: 'User created successfully.',
	USERS_FETCHED_SUCCESSFULLY: 'Users fetched successfully.',
	DASHBOARD_DATA_FETCHED: 'Dashboard data fetched successfully.',
	USER_UPDATED_SUCCESSFULLY: 'User updated successfully.',
	USER_DELETED_SUCCESSFULLY: 'User deleted successfully.',
	USERS_DELETED_SUCCESSFULLY: 'Users deleted successfully.',
	USER_NOT_FOUND: 'User not found.',
	USERS_NOT_FOUND: 'Users not found.',
	PAYMENT_METHOD_CREATED_SUCCESSFULLY: 'Payment method created successfully.',
	PAYMENT_METHODS_FETCHED_SUCCESSFULLY: 'Payment methods fetched successfully.',
	PAYMENT_METHOD_FETCHED_SUCCESSFULLY: 'Payment method fetched successfully.',
	PAYMENT_METHOD_UPDATED_SUCCESSFULLY: 'Payment method updated successfully.',
	PAYMENT_METHOD_DELETED_SUCCESSFULLY: 'Payment method deleted successfully.',
	PAYMENT_METHODS_DELETED_SUCCESSFULLY: 'Payment methods deleted successfully.',
	PAYMENT_METHOD_NOT_FOUND: 'Payment method not found.',
	PAYMENT_METHODS_NOT_FOUND: 'Payment methods not found.',
	LOGIN_TRACKING_FETCHED_SUCCESSFULLY: 'Login tracking fetched successfully.',
	SUBSCRIPTION_FETCHED_SUCCESSFULLY: 'Subscription fetched successfully.',
	SUBSCRIPTION_NOT_FOUND: 'Subscription not found.'
};

const ERROR_TYPES = {
	INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
	BAD_REQUEST: 'BAD_REQUEST',
	UNAUTHORIZED: 'UNAUTHORIZED',
	DATA_NOT_FOUND: 'DATA_NOT_FOUND',
	MONGO_EXCEPTION: 'MONGO_EXCEPTION',
	ALREADY_EXISTS: 'ALREADY_EXISTS',
	FORBIDDEN: 'FORBIDDEN',
	TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS'
};

const STATUS_CODES = {
	SUCCESS: 200,
	BAD_REQUEST: 400,
	UNAUTHORIZED: 401,
	DATA_NOT_FOUND: 404,
	ALREADY_EXISTS: 400,
	INTERNAL_SERVER_ERROR: 500,
	FORBIDDEN: 403,
	TOO_MANY_REQUESTS: 429
};

const UPLOAD_FILE_TYPE = {
	KYC_PASSPORT: 1,
	KYC_DRIVING_LICENSE: 2,
	KYC_OTHER_GOVERNMENT_ID: 3,
	PROFILE_IMAGE: 4
};

const KYC_TYPE = {
	PASSPORT: 1,
	DRIVING_LICENSE: 2,
	OTHER_GOVERNMENT_ID: 3
};

const EMAIL_TYPES = {
	FORGOT_PASSWORD: 1
};

const DATABASE_VERSIONS = {
	ONE: 1
};

const GENDERS = {
	MALE: 1,
	FEMALE: 2,
	NON_BINARY: 3
};

const EMAIL_SUBJECTS = {
	FORGOT_PASSWORD: 'Reset your password'
};

const EMAIL_CONTENTS = {
	FORGOT_PASSWORD: fs.readFileSync(path.join(__dirname, '../../public/templates/forgotPassword.html'), 'utf8')
};

const SPECIAL_CHARACTERS = [ '~', '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '-', '_', '+', '=', '{', '}', '[', ']', '|', '/', ':', ';', '"', '\'', '<', '>', ',', '.', '?' ];

const REGEX = {
	PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[ !"#$%&'()*+,/:;<=>?@[\]^_`{|}~÷°¬±µ‰¤ƒ¥€£¢ß¿¡©®™§†‡—¶])(?=.{8,})/,
	TIME: /^([01]\d|2[0-3]):([0-5]\d)$/
};

const USER_TYPE = {
	USER: 1,
	VENDOR: 2
};

const USER_VALIDATION_CHECK = { isDeleted: { $ne: true } };

const AVAILABLE_AUTHS = {
	ADMIN: 1,
	ADMIN_FORGOT_PASSWORD: 2
};

const KYC_STATUS = {
	PENDING: 1,
	APPROVED: 2,
	REJECTED: 3
};

const SESSION = {
	LOGIN: 1,
	FORGOT_PASSWORD: 2
};

const EXPIRATION_TIME = {
	LOGIN_EXPIRATION: () => Date.now() + 24 * 60 * 60 * 1000, // 24 hours
	OTP_EXPIRATION: () => Date.now() + 5 * 60 * 1000 // 5 minutes
};

const RESET_PASSWORD_TOKEN_LIMIT = 3;

const NOTIFICATION_TYPES = {
	KYC_APPROVED: 1,
	KYC_DISAPPROVED: 2
};

const VENDOR_PERFORMANCE_SCORE = {
	EXCELLENT: 1,
	GOOD: 2,
	AVERAGE: 3,
	POOR: 4
};

const RATE_LIMIT_CONFIG = {
	RATE_LIMIT: 1,
	WINDOW_MS: 15 * 60 * 1000, // 15 minutes
	MAX_REQUESTS: 5
};

const NOTIFICATION_TEMPLATES = {
	[NOTIFICATION_TYPES.KYC_APPROVED]: {
		title: 'KYC Approved',
		body: 'Hello {{name}}, your KYC has been approved.'
	},
	[NOTIFICATION_TYPES.KYC_DISAPPROVED]: {
		title: 'KYC Disapproved',
		body: 'Hello {{name}}, your KYC has been disapproved.'
	}
};

const TRANSACTION_STATUS = {
	PENDING: 1,
	COMPLETED: 2,
	CANCELLED: 3
};

const FIAT_CURRENCY = {
	USD: 1,
	EUR: 2,
	NGN: 3,
	INR: 4
};

const TRANSACTION_TYPE = {
	FIAT_TO_ESPEES: 1,
	ESPEES_TO_FIAT: 2
};

const MATHEMATICAL = {
	SECONDS_IN_A_DAY: 86400, // 24 * 60 * 60
	SECONDS_IN_A_MINUTE: 60
};

const TOKEN_EXPIRATION_TIME = {
	LOGIN: MATHEMATICAL.SECONDS_IN_A_DAY * 7, // 7 days
	FORGOT_PASSWORD: MATHEMATICAL.SECONDS_IN_A_MINUTE * 30 // 30 minutes
};

const SESSIONS_REF_PATH = {
	ADMIN: 'admins',
	USER: 'users'
};

const USER_ROLES = {
	SUBSCRIBER: 1,
	EDITOR: 2,
	MAINTAINER: 3,
	AUTHOR: 4,
	ADMIN: 5
};

const COUNTRIES = {
	INDIA: 1,
	USA: 2,
	UK: 3,
	AUSTRALIA: 4,
	NEW_ZEALAND: 5
};

const USER_STATUS = {
	PENDING: 1,
	ACTIVE: 2,
	INACTIVE: 3
};

const CARD_TYPES = {
	VISA: 1,
	MASTERCARD: 2,
	AMEX: 3,
	DISCOVER: 4,
	RUPAY: 5
};

const ADDRESS_TYPES = {
	HOME: 1,
	WORK: 2
};

const CONNECTED_ACCOUNTS = {
	GOOGLE: 1,
	SLACK: 2,
	ASANA: 3,
	MAILCHIMP: 4,
	GITHUB: 5
};

const SOCIAL_ACCOUNTS = {
	FACEBOOK: 1,
	TWITTER: 2,
	LINKEDIN: 3,
	DRIBBLE: 4,
	BEHANCE: 5
};

const NOTIFICATION_PREFERENCES = {
	NEW_FOR_YOU: 1,
	ACCOUNT_ACTIVITY: 2,
	NEW_BROWSER_SIGN_IN: 3,
	NEW_DEVICE_LINKED: 4
};

const NOTIFICATION_AVAILABILITY = {
	EMAIL: 1,
	BROWSER: 2,
	APP: 3
};

const BROWSER_TYPE = {
	CHROME_ON_WINDOWS: 1,
	CHROME_ON_ANDROID: 2,
	CHROME_ON_IOS: 3,
	CHROME_ON_MAC: 4,
	FIREFOX_ON_WINDOWS: 5,
	EDGE_ON_WINDOWS: 6
};

const SUBSCRIPTION_STATUS = {
	ACTIVE: 1,
	CANCELLED: 2,
	EXPIRED: 3
};

const SUBSCRIPTION_PLAN_TYPE = {
	STANDARD: 1,
	EXCLUSIVE: 2,
	ENTERPRISE: 3
};

export const Constants = {
	RESPONSE_MESSAGES,
	ERROR_TYPES,
	STATUS_CODES,
	UPLOAD_FILE_TYPE,
	EMAIL_TYPES,
	DATABASE_VERSIONS,
	GENDERS,
	EMAIL_SUBJECTS,
	EMAIL_CONTENTS,
	SPECIAL_CHARACTERS,
	REGEX,
	USER_VALIDATION_CHECK,
	AVAILABLE_AUTHS,
	KYC_STATUS,
	SESSION,
	KYC_TYPE,
	USER_TYPE,
	EXPIRATION_TIME,
	RESET_PASSWORD_TOKEN_LIMIT,
	NOTIFICATION_TYPES,
	VENDOR_PERFORMANCE_SCORE,
	RATE_LIMIT_CONFIG,
	NOTIFICATION_TEMPLATES,
	TRANSACTION_STATUS,
	FIAT_CURRENCY,
	TRANSACTION_TYPE,
	MATHEMATICAL,
	TOKEN_EXPIRATION_TIME,
	SESSIONS_REF_PATH,
	USER_ROLES,
	COUNTRIES,
	USER_STATUS,
	CARD_TYPES,
	ADDRESS_TYPES,
	CONNECTED_ACCOUNTS,
	SOCIAL_ACCOUNTS,
	NOTIFICATION_PREFERENCES,
	NOTIFICATION_AVAILABILITY,
	BROWSER_TYPE,
	SUBSCRIPTION_STATUS,
	SUBSCRIPTION_PLAN_TYPE
};
