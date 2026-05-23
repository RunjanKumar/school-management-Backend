import { Constants } from '@school/common';
import config from '../config';
import { userModel } from '../models';
import { hashPassword, normalizeEmail } from './authUtils';

type InitialAdminCredentials = {
	NAME?: string;
	EMAIL?: string;
	PASSWORD?: string;
};

const validateInitialSuperAdminCredentials = (adminCredentials: InitialAdminCredentials) => {
	if (!adminCredentials.NAME || !adminCredentials.EMAIL || !adminCredentials.PASSWORD) {
		throw new Error('ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD are required for the initial super admin migration.');
	}
};

export const buildSuperAdminUserPayload = (adminCredentials: InitialAdminCredentials, passwordHash: string) => {
	validateInitialSuperAdminCredentials(adminCredentials);

	const normalizedEmail = normalizeEmail(adminCredentials.EMAIL as string);

	return {
		email: normalizedEmail,
		normalizedEmail,
		passwordHash,
		role: Constants.USER_ROLES.SUPER_ADMIN,
		authProviders: {
			password: true,
			google: false
		},
		emailVerified: true,
		status: Constants.USER_STATUS.ACTIVE,
		isDeleted: false
	};
};

export const seedInitialSuperAdmin = async () => {
	validateInitialSuperAdminCredentials(config.ADMIN_CRED);

	const passwordHash = await hashPassword(config.ADMIN_CRED.PASSWORD as string);
	const superAdminPayload = buildSuperAdminUserPayload(config.ADMIN_CRED, passwordHash);

	const existingUser = await userModel.findOne({
		normalizedEmail: superAdminPayload.normalizedEmail,
		isDeleted: false
	});

	if (existingUser) {
		if (existingUser.role !== Constants.USER_ROLES.SUPER_ADMIN) {
			throw new Error('ADMIN_EMAIL is already used by a non-super-admin user.');
		}
		return;
	}

	await userModel.create(superAdminPayload);
};

export default async function runMigrations() {
	await seedInitialSuperAdmin();
}

