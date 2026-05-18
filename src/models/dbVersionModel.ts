import mongoose, { Schema } from 'mongoose';
import { DBVersionInterface } from '../interfaces';

const DBVersionSchema: Schema<DBVersionInterface> = new Schema(
	{
		version: { type: Schema.Types.Number }
	},
	{
		timestamps: true,
		versionKey: false,
		collection: 'dbVersion'
	}
);

export default mongoose.model<DBVersionInterface>('dbVersion', DBVersionSchema);
