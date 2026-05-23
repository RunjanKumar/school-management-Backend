export const convertErrorIntoReadableForm = <T extends { message: string }>(error: T): T => {
	let errorMessage = '';

	if (error.message.indexOf('[') > -1) {
		errorMessage = error.message.substring(error.message.indexOf('['));
	} else {
		errorMessage = error.message;
	}

	errorMessage = errorMessage.replace(/"/g, '');
	errorMessage = errorMessage.replace('[', '');
	errorMessage = errorMessage.replace(']', '');
	error.message = errorMessage;

	return error;
};

