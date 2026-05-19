import { Types, Document } from 'mongoose';

export interface SessionInterface extends Document {
	_id: Types.ObjectId;
	createdAt: Date;
	updatedAt: Date;
	userId: Types.ObjectId;
	refPath?: string;
	schoolId?: Types.ObjectId;
	role: string;
	type: string;
	token: string;
	refreshTokenHash?: string;
	deviceId?: string;
	ipAddress?: string;
	userAgent?: string;
	expirationTime: Date;
	revokedAt?: Date;
}
