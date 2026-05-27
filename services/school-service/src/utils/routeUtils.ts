import { NextFunction, Request, Response } from 'express';
import Joi from 'joi';

export const asyncHandler = (fn: Function) => (request: Request, response: Response, next: NextFunction) => {
	return Promise.resolve(fn(request, response, next)).catch(next);
};

export const validateBody = (schema: Joi.ObjectSchema) => (request: Request, response: Response, next: NextFunction) => {
	const { error, value } = schema.validate(request.body, {
		abortEarly: false,
		stripUnknown: true
	});

	if (error) {
		return response.status(400).json({
			statusCode: 400,
			status: false,
			message: error.details.map((detail) => detail.message).join(', '),
			type: 'BAD_REQUEST'
		});
	}

	request.body = value;
	return next();
};
