export interface DbConfig {
	PROTOCOL: string;
	HOST: string;
	PORT: number | string;
	NAME: string;
	USER: string;
	PASSWORD: string;
	DATABASE_URI: string;
}

export interface UserUpdateData {
	name: string;
	dob: Date | string;
	gender: number;
	sessions?: string;
	token?: string;
}

export interface SignedToken {
	sessionKey: string;
	token: string;
}
