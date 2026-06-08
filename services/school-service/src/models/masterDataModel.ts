import mongoose, { Schema } from 'mongoose';
import { MasterDataInterface } from '../interfaces/masterDataInterface';
import { MASTER_DATA } from '@common/constants/masterDataModel';
console.log('MASTER_DATA:', MASTER_DATA);

const masterDataSchema: Schema<MasterDataInterface> = new Schema(
	{
		type: {
			type: String,
			enum: Object.values(MASTER_DATA),
			required: true,
			index: true
		},
		value: {
			type: String,
			required: true,
			trim: true,
			lowercase: true
		},
		label: {
			type: String,
			required: true,
			trim: true
		},
		description: {
			type: String,
			trim: true
		},
		displayOrder: {
			type: Number,
			default: 0
		},
		isActive: {
			type: Boolean,
			default: true
		},
		isDefault: {
			type: Boolean,
			default: false
		},
		metadata: {
			type: Schema.Types.Mixed,
			default: {}
		},
		createdBy: {
			type: Schema.Types.ObjectId,
			ref: 'users'
		},
		isDeleted: {
			type: Boolean,
			default: false,
			index: true
		}
	},
	{
		timestamps: true,
		versionKey: false,
		collection: 'master_data'
	}
);

// Unique value per type (no duplicate 'cbse' under 'board')
masterDataSchema.index(
	{ type: 1, value: 1 },
	{ unique: true, partialFilterExpression: { isDeleted: false } }
);

export const masterDataModel = mongoose.model<MasterDataInterface>('master_data', masterDataSchema);
export default masterDataModel;