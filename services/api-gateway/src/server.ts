import { app } from './startup/app';
import { config } from './config';
import { logger } from './services/logger';

const startServer = async () => {
    try {
        app.listen(config.port, () => {
            logger.info(`API Gateway listening on port ${config.port} in ${config.nodeEnv} mode`);
        });
    } catch (error) {
        logger.error('Failed to start API Gateway', { error });
        process.exit(1);
    }
};

startServer();
