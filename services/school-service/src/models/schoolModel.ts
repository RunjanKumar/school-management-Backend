import mongoose, { Schema } from 'mongoose';
import { Constants } from '@school/common';
import { SchoolInterface } from '../interfaces/schoolInterface';

const schoolSchema: Schema<SchoolInterface> = new Schema(
	{
		name: { type: String, required: true, trim: true },
		code: { type: String, required: true, uppercase: true, trim: true },
		status: {
			type: String,
			enum: Object.values(Constants.SCHOOL_STATUS),
			default: Constants.SCHOOL_STATUS.ACTIVE,
			index: true
		},
		address: { type: Schema.Types.Mixed, default: {} },
		contactEmail: { type: String, lowercase: true, trim: true },
		contactPhone: { type: String, trim: true },
		createdBy: { type: Schema.Types.ObjectId, ref: 'users', required: true, index: true },
		isDeleted: { type: Boolean, default: false, index: true }
	},
	{
		timestamps: true,
		versionKey: false,
		collection: 'schools'
	}
);

schoolSchema.index({ code: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });

export const schoolModel = mongoose.model<SchoolInterface>('schools', schoolSchema);
export default schoolModel;
