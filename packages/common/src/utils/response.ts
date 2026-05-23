import { STATUS_CODES } from '../constants/status';
import { ApiResponse } from '../interfaces/api';

const RESPONSE = {
	ERROR: (type: string = '', message: string = '', data?: any): ApiResponse => {
		let obj: ApiResponse = {
			statusCode: STATUS_CODES[type as keyof typeof STATUS_CODES] || 500,
			status: false,
			message,
			type
		};
		if (data) {
			obj = { ...obj, data };
		}
		return obj;
	},
	SUCCESS: (msg: string = '', data?: any): ApiResponse => {
		let obj: ApiResponse = {
			statusCode: 200,
			status: true,
			message: msg,
			type: 'SUCCESS'
		};
		if (data) {
			obj = { ...obj, data };
		}
		return obj;
	}
};

/**
 * function to create a valid SUCCESS response object.
 * @param message message that has to be pass in the response object.
 * @param data optional data to be included in the response object.
 */
export function createSuccessResponse(message: string, data?: any): ApiResponse {
	message = message || 'Success';
	return RESPONSE.SUCCESS(message, data);
}

/**
 * function to create a valid ERROR response object.
 * @param message message that has to be pass in the response object.
 * @param errorType type of the error.
 * @param data optional data to be included in the response object.
 */
export function createErrorResponse(message: string, errorType: string, data?: any): ApiResponse {
	message = message || 'Error occurred';
	return RESPONSE.ERROR(errorType, message, data);
}
