import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';

/**
 * ═══════════════════════════════════════════════════════════════
 *  ZERO manual API/schema definitions here!
 *
 *  swagger-jsdoc scans all files matched by `apis` glob below
 *  and picks up every JSDoc block that starts with `@swagger`.
 *
 *  ➕ To add a new API:
 *     1. Write a `@swagger` JSDoc comment in your route file
 *     2. Restart the gateway
 *     3. It auto-appears in Swagger UI
 *
 *  ➕ To add a new schema:
 *     1. Write a `@swagger` JSDoc comment with `components:` in
 *        the relevant file (model, route, or a dedicated .ts file)
 *     2. Restart the gateway
 *     3. It auto-appears under "Schemas" in Swagger UI
 * ═══════════════════════════════════════════════════════════════
 */

const options: swaggerJsdoc.Options = {
	definition: {
		openapi: '3.0.3',
		info: {
			title: 'School Management API Gateway',
			version: '1.0.0',
			description:
				'Frontend-facing API gateway documentation. Frontend clients should call these URLs, not internal services directly.'
		},
		servers: [
			{
				url: 'http://localhost:3000',
				description: 'API gateway local URL'
			}
		],
		components: {
			securitySchemes: {
				bearerAuth: {
					type: 'http',
					scheme: 'bearer',
					bearerFormat: 'JWT'
				}
			}
		}
	},
	// Scan these files for @swagger annotations (endpoints + schemas)
	apis: [
		path.join(__dirname, '../app.ts'),
		path.join(__dirname, '../routes/*.ts'),
		path.join(__dirname, '../docs/schemas/*.ts')
	]
};

export const gatewaySwaggerDocument = swaggerJsdoc(options);
