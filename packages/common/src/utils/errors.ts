export class HttpError extends Error {
	public readonly statusCode: number;
	public readonly type: string;

	constructor(message: string, statusCode = 500, type = 'INTERNAL_SERVER_ERROR') {
		super(message);
		this.name = new.target.name;
		this.statusCode = statusCode;
		this.type = type;
	}
}

export class UnauthorizedError extends HttpError {
	constructor(message = 'Unauthorized') {
		super(message, 401, 'UNAUTHORIZED');
	}
}
