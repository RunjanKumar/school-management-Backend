import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../utils/logger';

const logger = createLogger('ErrorHandler');

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction): void => {
	logger.error(`${req.method} ${req.url} - ${err.message}`, { stack: err.stack });
	if (res && !res.headersSent) {
		res.status(500).json({
			statusCode: 500,
			status: false,
			message: 'Something went wrong!',
			type: 'INTERNAL_SERVER_ERROR'
		});
	} else {
        next(err);
    }
};
