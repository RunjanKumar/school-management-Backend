import { logger } from '../services/logger';

export const log = (message: string): void => {
	logger.info(`[LOG]: ${message}`);
};
