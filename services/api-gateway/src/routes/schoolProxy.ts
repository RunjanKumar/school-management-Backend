import { Router } from 'express';
import { createProxyMiddleware, RequestHandler } from 'http-proxy-middleware';
import { Constants } from '@school/common';
import { config } from '../config';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleGuard } from '../middleware/roleGuard';
import { sendProxyError } from '../utils/proxyError';

export function createSchoolProxyMiddleware(schoolServiceUrl = config.services.school): RequestHandler {
	return createProxyMiddleware({
		target: schoolServiceUrl,
		changeOrigin: true,
		pathRewrite: {
			'^/v1/schools': '/v1/schools'
		},
		on: {
			error: (_err, _req, res) => {
				sendProxyError(res, 'School service is currently unavailable');
			}
		}
	});
}

export function createSchoolProxyRouter(schoolServiceUrl = config.services.school) {
	const router = Router();

	// School routes are protected at the gateway; the service trusts these forwarded identity headers.
	router.use(
		'/',
		authMiddleware,
		roleGuard([ Constants.USER_ROLES.SUPER_ADMIN ]),
		createSchoolProxyMiddleware(schoolServiceUrl)
	);

	return router;
}

export default createSchoolProxyRouter();
