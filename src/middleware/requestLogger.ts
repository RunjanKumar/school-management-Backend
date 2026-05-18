import { Request, Response, NextFunction } from 'express';
import { logger } from '../services/logger';

export const requestLogger = (request: Request, response: Response, next: NextFunction): void => {
	const start = process.hrtime.bigint();

	response.on('finish', () => {
		const end = process.hrtime.bigint();
		const seconds = Number(end - start) / 1000000000;
		const message = `${request.method} ${response.statusCode} ${request.originalUrl} took ${seconds} seconds`;

		if (response.statusCode >= 200 && response.statusCode <= 299) {
			logger.info(message);
		} else if (response.statusCode >= 400) {
			logger.error(message);
		} else {
			logger.info(message);
		}
	});
	next();
};
