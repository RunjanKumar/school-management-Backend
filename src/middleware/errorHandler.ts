import { Request, Response } from 'express';
import { logger } from '../services/logger';

const errorHandler = (err: Error, req: Request, res: Response): void => {
	logger.error(`${req.method} ${req.url} - ${err.message}`);
	if (res?.status) {
		res.status(500).json({ message: 'Something went wrong!' });
	}
};

export default errorHandler;
