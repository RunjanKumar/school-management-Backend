export const schoolSwaggerDocument = {
	openapi: '3.0.0',
	info: {
		title: 'School Service API',
		version: '1.0.0',
		description: 'School tenant CRUD and status endpoints'
	},
	paths: {
		'/v1/schools': {
			get: { summary: 'List schools' },
			post: { summary: 'Create school' }
		},
		'/v1/schools/{id}': {
			get: { summary: 'Get school by id' },
			put: { summary: 'Update school' }
		},
		'/v1/schools/{id}/status': {
			put: { summary: 'Update school status' }
		},
		'/v1/schools/code/{code}': {
			get: { summary: 'Get school by code' }
		},
		'/v1/internal/schools/{id}/status': {
			get: { summary: 'Internal school active status check' }
		}
	}
};
