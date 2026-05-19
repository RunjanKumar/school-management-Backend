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
			default: Constants.SESSIONS_REF_PATH.USER,
			index: true
		},
		type: {
			type: String,
			enum: Object.values(Constants.SESSION_TYPES),
			required: true
		},
		role: {
			type: String,
			enum: Object.values(Constants.USER_ROLES),
			required: true,
			index: true
		},
		schoolId: {
			type: Schema.Types.ObjectId,
			ref: 'schools',
			index: true
		},
		token: {
			type: String,
			unique: true,
			index: true,
			required: true
		},
		refreshTokenHash: {
			type: String,
			trim: true
		},
		deviceId: {
			type: String,
			trim: true,
			index: true
		},
		ipAddress: {
			type: String,
			trim: true
		},
		userAgent: {
			type: String,
			trim: true
		},
		expirationTime: {
			type: Date,
			index: true,
			required: true
		},
		revokedAt: {
			type: Date,
			index: true
		}
	},
	{
		timestamps: true,
		versionKey: false,
		collection: 'sessions'
	}
);

sessionSchema.index({ userId: 1, refPath: 1, type: 1 });
sessionSchema.index({ userId: 1, role: 1, schoolId: 1, type: 1 });

export default mongoose.model<SessionInterface>('sessions', sessionSchema);
