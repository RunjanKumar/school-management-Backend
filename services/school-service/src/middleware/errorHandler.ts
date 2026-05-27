import { NextFunction, Request, Response } from 'express';
import { Constants, createErrorResponse } from '@school/common';
import { logger } from '../services/logger';

export function errorHandler(error: any, _request: Request, response: Response, _next: NextFunction) {
	const responseObject = error?.statusCode && error?.type
		? error
		: createErrorResponse(Constants.RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR, Constants.ERROR_TYPES.INTERNAL_SERVER_ERROR);

	if (!error?.statusCode) {
		logger.error('Unhandled school-service error', { error });
	}

	return response.status(responseObject.statusCode).json(responseObject);
}
