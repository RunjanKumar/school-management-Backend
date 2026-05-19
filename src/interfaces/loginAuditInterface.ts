import { Document, Types } from 'mongoose';

export interface LoginAuditInterface extends Document {
	_id: Types.ObjectId;
	createdAt: Date;
	userId?: Types.ObjectId;
	email: string;
	schoolId?: Types.ObjectId;
	role?: string;
	loginMethod: string;
	success: boolean;
	failureReason?: string;
	ipAddress?: string;
	userAgent?: string;
}
