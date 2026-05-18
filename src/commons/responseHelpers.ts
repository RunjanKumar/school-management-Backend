import { Constants } from './constants';

type ResponseObject = {
	statusCode: number;
	status: boolean;
	message: string;
	type: string;
	data?: any;
};

const RESPONSE: any = {
	ERROR: (type: string = '', message: string = '', data?: any): ResponseObject => {
		let obj: ResponseObject = {
			statusCode: Constants.STATUS_CODES[type as keyof typeof Constants.STATUS_CODES],
			status: false,
			message,
			type
		};
		if (data) {
			obj = { ...obj, data };
		}
		return obj;
	},
	SUCCESS: (msg: string = '', data?: any): ResponseObject => {
		let obj: ResponseObject = {
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
function createSuccessResponse(message: string, data?: any): ResponseObject {
	message = message || 'Success';
	return RESPONSE.SUCCESS(message, data);
}

/**
 * function to create a valid ERROR response object.
 * @param message message that has to be pass in the response object.
 * @param errorType type of the error.
 * @param data optional data to be included in the response object.
 */
function createErrorResponse(message: string, errorType: any, data?: any): ResponseObject {
	message = message || 'Error occurred';
	return RESPONSE.ERROR(errorType, message, data);
}

export { createErrorResponse, createSuccessResponse };
