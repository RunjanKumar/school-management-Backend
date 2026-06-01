export const schoolSwaggerDocument = {
	openapi: '3.0.0',
	info: {
		title: 'School Service API',
		version: '1.0.0',
		description: 'School tenant read and management endpoints. Super admin has read-only access; school admin creates and manages schools they created.'
	},
	paths: {
		'/v1/schools': {
			get: { summary: 'List schools. Super admin reads all; school admin reads own schools.' },
			post: { summary: 'Create school as school admin' }
		},
		'/v1/schools/{id}': {
			get: { summary: 'Get school by id. Super admin read-only; school admin own school.' },
			put: { summary: 'Update own school as school admin' }
		},
		'/v1/schools/{id}/status': {
			put: { summary: 'Update own school status as school admin' }
		},
		'/v1/schools/code/{code}': {
			get: { summary: 'Get school by code' }
		},
		'/v1/internal/schools/{id}/status': {
			get: { summary: 'Internal school active status check' }
		}
	}
};
