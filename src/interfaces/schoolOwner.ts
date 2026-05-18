import { Document, Types } from 'mongoose';

export interface SchoolOwnerInterface extends Document {
	_id: Types.ObjectId;
	createdAt: Date;
	updatedAt: Date;
	name: string;
	email: string;
	contactNumber: string;
	alternateContactNumber?: string;
	password: string;
	isDeleted: boolean;
}
