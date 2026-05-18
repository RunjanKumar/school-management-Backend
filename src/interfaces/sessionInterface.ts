import { Types, Document } from 'mongoose';

export interface SessionInterface extends Document {
	_id: Types.ObjectId;
	createdAt: Date;
	updatedAt: Date;
	userId: Types.ObjectId;
	refPath: string;
	type: number;
	token: string;
	expirationTime: Date;
}
