import { NextFunction, Request, Response } from 'express';
import { Constants, InternalAuthValidationResult, createErrorResponse } from '@school/common';
import config from '../config';
import { sendHttpRequest } from '../services/httpClient';

type AuthMiddlewareOptions = {
	authServiceUrl?: string;
	internalApiKey?: string;
	validateToken?: (token: string, internalApiKey: string) => Promise<InternalAuthValidationResult>;
};

const getBearerToken = (authorizationHeader?: string) => {
	if (!authorizationHeader) return '';
	return authorizationHeader.startsWith('Bearer ') ? authorizationHeader.slice(7) : authorizationHeader;
};

async function defaultValidateToken(token: string, internalApiKey: string, authServiceUrl: string): Promise<InternalAuthValidationResult> {
	const body = Buffer.from(JSON.stringify({ token }));
	const response = await sendHttpRequest({
		method: 'POST',
		url: `${authServiceUrl.replace(/\/$/, '')}/v1/internal/auth/validate`,
		headers: {
			'content-type': 'application/json',
			'content-length': String(body.length),
			'x-internal-key': internalApiKey
		},
		body
	});

	if (!response.body.length) {
		return { valid: false };
	}

	return JSON.parse(response.body.toString()) as InternalAuthValidationResult;
}

export function createAuthMiddleware(options: AuthMiddlewareOptions = {}) {
	const authServiceUrl = options.authServiceUrl || config.AUTH_SERVICE_URL;
	const internalApiKey = options.internalApiKey || config.INTERNAL_API_KEY;
	const validateToken = options.validateToken || ((token: string, key: string) => defaultValidateToken(token, key, authServiceUrl));

	return async (request: Request, response: Response, next: NextFunction) => {
		const token = getBearerToken(request.headers.authorization);

		if (!token) {
			const responseObject = createErrorResponse(Constants.RESPONSE_MESSAGES.UNAUTHORIZED, Constants.ERROR_TYPES.UNAUTHORIZED);
			return response.status(responseObject.statusCode).json(responseObject);
		}

		try {
			const validation = await validateToken(token, internalApiKey);

			if (!validation.valid || !validation.userId || !validation.role) {
				const responseObject = createErrorResponse(Constants.RESPONSE_MESSAGES.UNAUTHORIZED, Constants.ERROR_TYPES.UNAUTHORIZED);
				return response.status(responseObject.statusCode).json(responseObject);
			}

			request.headers['x-user-id'] = validation.userId;
			request.headers['x-user-role'] = validation.role;
			request.headers['x-school-id'] = validation.schoolId || '';
			request.headers['x-session-id'] = validation.sessionId || '';

			return next();
		} catch (_error) {
			const responseObject = createErrorResponse(Constants.RESPONSE_MESSAGES.UNAUTHORIZED, Constants.ERROR_TYPES.UNAUTHORIZED);
			return response.status(responseObject.statusCode).json(responseObject);
		}
	};
}

export const authMiddleware = createAuthMiddleware();

