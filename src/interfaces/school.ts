import { Document, Types } from 'mongoose';

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
