import mongoose, { Schema } from 'mongoose';
import { AdminInterface } from '../interfaces';

const adminSchema: Schema<AdminInterface> = new Schema(
	{
		name: { type: String, required: true },
		email: { type: String, required: true },
		password: { type: String, required: true },
		isDeleted: { type: Boolean, default: false }
	},
	{
		timestamps: true,
		versionKey: false,
		collection: 'admins'
	}
);

export default mongoose.model<AdminInterface>('admins', adminSchema);
