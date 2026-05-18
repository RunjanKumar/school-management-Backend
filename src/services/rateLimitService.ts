import { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { Constants } from '../commons/constants';
import { createErrorResponse } from '../commons/responseHelpers';

const rateLimitService: any = {};

/**
 * Middleware to limit repeated requests from same IP.
 */
rateLimitService.limit = () => {
	return rateLimit({
		windowMs: Constants.RATE_LIMIT_CONFIG.WINDOW_MS,
		max: Constants.RATE_LIMIT_CONFIG.MAX_REQUESTS,
		standardHeaders: true,
		legacyHeaders: false,
		handler: (_req: Request, res: Response) => {
			const error = createErrorResponse(Constants.RESPONSE_MESSAGES.TOO_MANY_REQUESTS, Constants.ERROR_TYPES.TOO_MANY_REQUESTS);
			return res.status(error.statusCode).json(error);
		}
	});
};

export default rateLimitService;
