export interface ApiResponse<T = unknown> {
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
}

export interface PaginatedResponse<T = unknown> {
	items: T[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}
