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
