import { app } from './startup/app';
import { config } from './config';
import { logger } from './services/logger';

const startServer = async () => {
    try {
        app.listen(config.port, () => {
            const baseUrl = `http://localhost:${config.port}`;
            logger.info(`API Gateway listening on port ${config.port} in ${config.nodeEnv} mode`);
            logger.info(`API Gateway URL: ${baseUrl}`);
            logger.info(`API Gateway Swagger UI: ${baseUrl}/api-docs`);
            logger.info(`API Gateway Swagger JSON: ${baseUrl}/swagger.json`);
        });
    } catch (error) {
        logger.error('Failed to start API Gateway', { error });
        process.exit(1);
    }
};

startServer();
