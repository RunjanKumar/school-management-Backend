import mongoose, { Schema } from 'mongoose';
import { Constants } from '../commons/constants';
import { SessionInterface } from '../interfaces';

const sessionSchema: Schema<SessionInterface> = new Schema(
	{
		userId: {
			type: Schema.Types.ObjectId,
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
			required: true
		},
		expirationTime: {
			type: Date,
			required: true
		}
	},
	{
		timestamps: true,
		versionKey: false,
		collection: 'sessions'
	}
);

export default mongoose.model<SessionInterface>('sessions', sessionSchema);
