import mongoose, { Schema } from 'mongoose';
import { Constants } from '@school/common';
import { LoginAuditInterface } from '../interfaces';

const MODEL_NAME = 'authServiceLoginAudits';

const loginAuditSchema: Schema<LoginAuditInterface> = new Schema(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: 'users',
			index: true
		},
		email: {
			type: String,
			required: true,
			lowercase: true,
			trim: true,
			index: true
		},
		schoolId: {
			type: Schema.Types.ObjectId,
			ref: 'schools',
			index: true
		},
		role: {
			type: String,
			enum: Object.values(Constants.USER_ROLES),
			index: true
		},
		loginMethod: {
			type: String,
			enum: Object.values(Constants.AUTH_PROVIDERS),
			required: true
		},
		success: {
			type: Boolean,
			required: true,
			index: true
		},
		failureReason: {
			type: String,
			trim: true
		},
		ipAddress: {
			type: String,
			trim: true
		},
		userAgent: {
			type: String,
			trim: true
		}
	},
	{
		timestamps: { createdAt: true, updatedAt: false },
		versionKey: false,
		collection: 'loginAudits'
	}
);

loginAuditSchema.index({ email: 1, createdAt: -1 });
loginAuditSchema.index({ userId: 1, createdAt: -1 });
loginAuditSchema.index({ schoolId: 1, role: 1, createdAt: -1 });

export default mongoose.models[MODEL_NAME] || mongoose.model<LoginAuditInterface>(MODEL_NAME, loginAuditSchema);

