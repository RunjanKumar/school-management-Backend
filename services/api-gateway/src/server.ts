import config from './config';
import createGatewayApp from './app';
import { logger } from './services/logger';

const app = createGatewayApp();

app.listen(config.PORT, () => {
	logger.info(`API gateway running on port ${config.PORT}`);
});

