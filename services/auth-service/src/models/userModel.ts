import mongoose, { Schema } from 'mongoose';
import { Constants } from '@school/common';
import { UserInterface } from '../interfaces';

const PROFILE_MODELS = [ 'superAdmins', 'schoolAdmins', 'schoolOperators', 'teachers', 'parents', 'students', 'guests' ];

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const authProvidersSchema = new Schema(
	{
		password: { type: Boolean, default: true },
		google: { type: Boolean, default: false }
	},
	{
		_id: false
	}
);

const userSchema: Schema<UserInterface> = new Schema(
	{
		email: {
			type: String,
			required: true,
			lowercase: true,
			trim: true
		},
		normalizedEmail: {
			type: String,
			required: true,
			lowercase: true,
			trim: true
		},
		passwordHash: {
			type: String,
			select: false
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
		profileRef: {
			type: Schema.Types.ObjectId,
			refPath: 'profileModel'
		},
		profileModel: {
			type: String,
			enum: PROFILE_MODELS
		},
		authProviders: {
			type: authProvidersSchema,
			required: true,
			default: () => ({ password: true, google: false })
		},
		googleSub: {
			type: String,
			trim: true
		},
		emailVerified: {
			type: Boolean,
			default: false
		},
		status: {
			type: String,
			enum: Object.values(Constants.USER_STATUS),
			default: Constants.USER_STATUS.PENDING,
			index: true
		},
		lastLoginAt: {
			type: Date
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
		collection: 'users'
	}
);

// because arrow functions do NOT have their own this.
userSchema.pre('validate', function validateUser(next) {
	if (this.email) {
		const normalizedEmail = normalizeEmail(this.email);
		this.email = normalizedEmail;
		this.normalizedEmail = normalizedEmail;
	}

	if (this.googleSub) {
		this.googleSub = this.googleSub.trim();
	}

	if (this.role === Constants.USER_ROLES.SUPER_ADMIN && this.schoolId) {
		this.invalidate('schoolId', 'Super admin must not have a schoolId.');
	}

	if (this.role && this.role !== Constants.USER_ROLES.SUPER_ADMIN && this.role !== Constants.USER_ROLES.GUEST && !this.schoolId) {
		this.invalidate('schoolId', 'schoolId is required for school-scoped users.');
	}

	const authProviders = this.authProviders || { password: false, google: false };

	if (!authProviders.password && !authProviders.google) {
		this.invalidate('authProviders', 'At least one auth provider is required.');
	}

	if (authProviders.password && !this.passwordHash) {
		this.invalidate('passwordHash', 'passwordHash is required when password auth provider is enabled.');
	}

	if (authProviders.google && !this.googleSub) {
		this.invalidate('googleSub', 'googleSub is required when Google auth provider is enabled.');
	}

	next();
});

userSchema.index({ normalizedEmail: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
userSchema.index({ googleSub: 1 }, { unique: true, sparse: true });
userSchema.index({ schoolId: 1, role: 1, status: 1 });

export default mongoose.model<UserInterface>('users', userSchema);
