import mongoose, { Schema } from 'mongoose';
import { Constants } from '../commons/constants';
import { SessionInterface } from '../interfaces';

const sessionSchema: Schema<SessionInterface> = new Schema(
	{
		userId: {
			type: Schema.Types.ObjectId,
			index: true,
			required: true
		},
		refPath: {
			type: String,
			enum: Object.values(Constants.SESSIONS_REF_PATH),
			required: true
		},
		type: {
			type: Number,
			enum: Object.values(Constants.SESSION),
			required: true
		},
		token: {
			type: String,
			unique: true,
			index: true,
			required: true
		},
		expirationTime: {
			type: Date,
			index: true,
			required: true
		}
	},
	{
		timestamps: true,
		versionKey: false,
		collection: 'sessions'
	}
);

sessionSchema.index({ userId: 1, refPath: 1, type: 1 });

export default mongoose.model<SessionInterface>('sessions', sessionSchema);
