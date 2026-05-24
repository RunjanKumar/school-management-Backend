import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../utils/errors';
import { createLogger } from '../utils/logger';

const logger = createLogger('ErrorHandler');

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction): void => {
	logger.error(`${req.method} ${req.url} - ${err.message}`, { stack: err.stack });
	if (res && !res.headersSent) {
		const statusCode = err instanceof HttpError ? err.statusCode : 500;
		res.status(statusCode).json({
			statusCode,
			status: false,
			message: err instanceof HttpError ? err.message : 'Something went wrong!',
			type: err instanceof HttpError ? err.type : 'INTERNAL_SERVER_ERROR'
		});
	} else {
        next(err);
    }
};
