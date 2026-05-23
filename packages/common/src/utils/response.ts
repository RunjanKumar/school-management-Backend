import { Constants } from '../constants';
import type { ApiResponse } from '../interfaces';

const RESPONSE = {
	ERROR: <T = unknown>(type: string = '', message: string = '', data?: T): ApiResponse<T> => {
		const response: ApiResponse<T> = {
			statusCode: Constants.STATUS_CODES[type as keyof typeof Constants.STATUS_CODES],
			status: false,
			message,
			type
		};

		if (data !== undefined) {
			response.data = data;
		}

		return response;
	},
	SUCCESS: <T = unknown>(message: string = '', data?: T): ApiResponse<T> => {
		const response: ApiResponse<T> = {
			statusCode: Constants.STATUS_CODES.SUCCESS,
			status: true,
			message,
			type: 'SUCCESS'
		};

		if (data !== undefined) {
			response.data = data;
		}

		return response;
	}
};

export function createSuccessResponse<T = unknown>(message: string = '', data?: T): ApiResponse<T> {
	return RESPONSE.SUCCESS(message || 'Success', data);
}

export function createErrorResponse<T = unknown>(message: string = '', errorType: string, data?: T): ApiResponse<T> {
	return RESPONSE.ERROR(errorType, message || 'Error occurred', data);
}
