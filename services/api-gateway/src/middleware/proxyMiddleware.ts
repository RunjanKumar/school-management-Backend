import { NextFunction, Request, Response } from 'express';
import { Constants, createErrorResponse } from '@school/common';
import { sendHttpRequest } from '../services/httpClient';
import { readRequestBody } from '../utils/requestBody';

type ProxyOptions = {
	target: string;
};

const hopByHopHeaders = new Set([
	'connection',
	'keep-alive',
	'proxy-authenticate',
	'proxy-authorization',
	'te',
	'trailer',
	'transfer-encoding',
	'upgrade',
	'host'
]);

const sanitizeRequestHeaders = (headers: Request['headers'], body: Buffer) => {
	const sanitized: Record<string, string | string[] | undefined> = {};

	for (const [ key, value ] of Object.entries(headers)) {
		if (hopByHopHeaders.has(key.toLowerCase())) continue;
		sanitized[key] = value;
	}

	if (body.length) {
		sanitized['content-length'] = String(body.length);
	} else {
		delete sanitized['content-length'];
	}

	return sanitized;
};

const copyResponseHeaders = (response: Response, headers: Record<string, string | string[] | number | undefined>) => {
	for (const [ key, value ] of Object.entries(headers)) {
		if (value === undefined || hopByHopHeaders.has(key.toLowerCase())) continue;
		response.setHeader(key, value as string | string[]);
	}
};

export function createProxyMiddleware(options: ProxyOptions) {
	return async (request: Request, response: Response, next: NextFunction) => {
		try {
			const body = await readRequestBody(request);
			const targetUrl = new URL(request.originalUrl, options.target);
			const proxiedResponse = await sendHttpRequest({
				method: request.method,
				url: targetUrl.toString(),
				headers: sanitizeRequestHeaders(request.headers, body),
				body
			});

			copyResponseHeaders(response, proxiedResponse.headers);
			return response.status(proxiedResponse.statusCode).send(proxiedResponse.body);
		} catch (error) {
			const responseObject = createErrorResponse(Constants.RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR, Constants.ERROR_TYPES.INTERNAL_SERVER_ERROR);

			if (!response.headersSent) {
				return response.status(502).json({
					...responseObject,
					statusCode: 502,
					message: 'Bad gateway'
				});
			}

			return next(error);
		}
	};
}

