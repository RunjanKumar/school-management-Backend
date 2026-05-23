import { Constants } from '@school/common';
import CONFIG from '../config';
import * as Models from '../models';
import { Utils } from '../utils/utils';

type InitialAdminCredentials = {
	NAME?: string;
	EMAIL?: string;
	PASSWORD?: string;
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

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

const seedInitialSuperAdmin = async () => {
	validateInitialSuperAdminCredentials(CONFIG.ADMIN_CRED);

	const passwordHash = await Utils.hashPassword(CONFIG.ADMIN_CRED.PASSWORD);
	const superAdminPayload = buildSuperAdminUserPayload(CONFIG.ADMIN_CRED, passwordHash);

	const existingUser = await Models.userModel.findOne({
		normalizedEmail: superAdminPayload.normalizedEmail,
		isDeleted: false
	});

	if (existingUser) {
		if (existingUser.role !== Constants.USER_ROLES.SUPER_ADMIN) {
			throw new Error('ADMIN_EMAIL is already used by a non-super-admin user.');
		}
		return;
	}

	await Models.userModel.create(superAdminPayload);
};

/**
 * Run migrations.
 */
export default async function runMigrations() {
	const dbVersion = await Models.dbVersionModel.findOne({});
	const currentVersion = dbVersion?.version || 0;

	if (currentVersion < Constants.DATABASE_VERSIONS.TWO) {
		await seedInitialSuperAdmin();
	}

	if (!dbVersion) {
		await Models.dbVersionModel.create({
			version: Constants.DATABASE_VERSIONS.TWO
		});
		return;
	}

	if (dbVersion.version !== Constants.DATABASE_VERSIONS.TWO) {
		await Models.dbVersionModel.updateOne({ _id: dbVersion._id }, { version: Constants.DATABASE_VERSIONS.TWO });
	}
}
