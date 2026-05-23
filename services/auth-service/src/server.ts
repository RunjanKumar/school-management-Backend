import config from './config';
import createAuthApp from './app';
import { connectToDatabase } from './startup/mongoStartup';
import runMigrations from './utils/dbMigration';
import { logger } from './services/logger';

async function startServer() {
	await connectToDatabase();
	await runMigrations();

	const app = createAuthApp();
	app.listen(config.PORT, () => {
		logger.info(`Auth service running on port ${config.PORT}`);
	});
}

startServer().catch((error) => {
	logger.error(error);
	process.exit(1);
});
