import { Document, Types } from 'mongoose';

export interface SchoolInterface extends Document {
	_id: Types.ObjectId;
	createdAt: Date;
	updatedAt: Date;
	name: string;
	website?: string;
	email: string;
	contactNumber: string;
	address: {
		city: string;
		state: string;
		zipcode: string;
		address: string;
		landmark?: string;
	};
	schoolOwnerId: Types.ObjectId;
	isDeleted: boolean;
}
