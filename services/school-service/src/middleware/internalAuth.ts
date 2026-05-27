import { NextFunction, Request, Response } from 'express';
import { Constants, createErrorResponse } from '@school/common';
import config from '../config';

export function internalAuth(request: Request, response: Response, next: NextFunction) {
	const internalKey = request.headers['x-internal-key'];

	if (!config.internalApiKey || internalKey !== config.internalApiKey) {
		const responseObject = createErrorResponse(Constants.RESPONSE_MESSAGES.UNAUTHORIZED, Constants.ERROR_TYPES.FORBIDDEN);
		return response.status(responseObject.statusCode).json(responseObject);
	}

	return next();
}
