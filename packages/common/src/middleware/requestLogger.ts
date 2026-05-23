import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../utils/logger';

const logger = createLogger('RequestLogger');

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
    logger.info(`Incoming Request: ${req.method} ${req.originalUrl}`);
    next();
};
