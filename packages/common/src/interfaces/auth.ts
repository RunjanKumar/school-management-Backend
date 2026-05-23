export interface AuthContext {
	userId: string;
	role: string;
	schoolId?: string;
	sessionId?: string;
}

export interface JwtPayload extends AuthContext {
	iat?: number;
	exp?: number;
}

export interface InternalAuthValidationResult extends Partial<AuthContext> {
	valid: boolean;
}
