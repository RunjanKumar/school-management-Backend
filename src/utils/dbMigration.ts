import { Constants } from '../commons/constants';
import CONFIG from '../config';
import * as Models from '../models';
import { Utils } from '../utils/utils';

/**
 * Run migrations.
 */
export default async function runMigrations() {
	const dbVersion = await Models.dbVersionModel.findOne({});

	if (!dbVersion) {
		await Models.adminModel.create({
			name: CONFIG.ADMIN_CRED.NAME,
			email: CONFIG.ADMIN_CRED.EMAIL,
			password: await Utils.hashPassword(CONFIG.ADMIN_CRED.PASSWORD)
		});

		await Models.dbVersionModel.create({
			version: Constants.DATABASE_VERSIONS.ONE
		});
	}
}
