export interface ApiResponse<T = any> {
	statusCode: number;
	status: boolean;
	message: string;
	type: string;
	data?: T;
}

export interface PaginationQuery {
	page?: number;
	limit?: number;
	sortBy?: string;
	sortOrder?: 'asc' | 'desc';
	search?: string;
}

export interface PaginatedResponse<T> {
	items: T[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

export interface RouteConfig {
	path: string;
	method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
	handler: (payload: any) => Promise<any>;
	auth?: number;
	authWebhook?: number;
	joiSchemaForSwagger?: any;
	rateLimit?: boolean;
	notSendResponse?: boolean;
	getExactRequest?: boolean;
}
