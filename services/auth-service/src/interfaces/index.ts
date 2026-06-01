import { Document, Types } from 'mongoose';

export interface UserAuthProviders {
	password: boolean;
	google: boolean;
}

export interface UserInterface extends Document {
	_id: Types.ObjectId;
	createdAt: Date;
	updatedAt: Date;
	email: string;
	normalizedEmail: string;
	name?: string;
	passwordHash?: string;
	role: string;
	schoolId?: Types.ObjectId;
	profileRef?: Types.ObjectId;
	profileModel?: string;
	authProviders: UserAuthProviders;
	googleSub?: string;
	emailVerified: boolean;
	status: string;
	lastLoginAt?: Date;
	isDeleted: boolean;
}

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

export interface SchoolInterface extends Document {
	_id: Types.ObjectId;
	createdAt: Date;
	updatedAt: Date;
	name: string;
	code: string;
	status: string;
	address?: Record<string, unknown>;
	contactEmail?: string;
	contactPhone?: string;
	createdBy: Types.ObjectId;
	isDeleted: boolean;
}
