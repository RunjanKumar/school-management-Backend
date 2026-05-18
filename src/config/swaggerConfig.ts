export const SWAGGER = {
	swagger: '2.0',
	info: {
		version: process.env.VERSION || '1.0.0',
		title: process.env.SERVICE_NAME || 'Admin Boilerplate',
		description: process.env.SERVICE_DESCRIPTION || 'API -V1',
		termsOfService: 'http://swagger.io/terms/',
		contact: {
			name: process.env.CONTACT_DETAILS || 'contact@chicmicstudios.com'
		},
		license: {
			name: 'MIT'
		}
	},
	paths: {},
	definitions: {},
	schemes: [ 'http', 'https' ],
	consumes: [ 'application/json' ],
	produces: [ 'application/json' ]
};
