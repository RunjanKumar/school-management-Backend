import { Document, Types } from 'mongoose';

export interface AdminInterface extends Document {
	_id: Types.ObjectId;
	createdAt: Date;
	updatedAt: Date;
	name: string;
	email: string;
	password: string;
	isDeleted: boolean;
}
