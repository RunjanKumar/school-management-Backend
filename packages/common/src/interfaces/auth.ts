import { Request } from 'express';
import { IAdmin, IUser } from './models';

export interface AuthContext {
	userId: string;
	role: string;
	schoolId?: string;
	sessionId?: string;
}

export interface JwtPayload {
	id: string;
	timestamp: number;
	sessionKey: string;
}

export interface AuthenticatedRequest extends Request {
	user?: IUser;
	admin?: IAdmin;
	userSession?: any;
	authToken?: string;
	key?: boolean;
}
