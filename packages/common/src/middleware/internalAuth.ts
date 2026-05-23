import { Request, Response, NextFunction } from 'express';
import { createErrorResponse } from '../utils/response';
import { STATUS_CODES } from '../constants/status';

/**
 * Middleware for validating internal service-to-service calls.
 * Checks the 'x-internal-key' header against the INTERNAL_API_KEY environment variable.
 */
export const internalAuth = (req: Request, res: Response, next: NextFunction): void | Response => {
    const internalKey = req.headers['x-internal-key'];
    
    if (!process.env.INTERNAL_API_KEY) {
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json(
            createErrorResponse('Internal API key is not configured.', 'INTERNAL_SERVER_ERROR')
        );
    }

    if (!internalKey || internalKey !== process.env.INTERNAL_API_KEY) {
        return res.status(STATUS_CODES.UNAUTHORIZED).json(
            createErrorResponse('Unauthorized internal access.', 'UNAUTHORIZED')
        );
    }

    next();
};
