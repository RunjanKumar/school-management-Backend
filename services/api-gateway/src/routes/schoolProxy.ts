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

	const schoolProxyMiddleware = createSchoolProxyMiddleware(schoolServiceUrl);
	const schoolReaders = roleGuard([ Constants.USER_ROLES.SUPER_ADMIN, Constants.USER_ROLES.SCHOOL_ADMIN ]);
	const schoolAdminOnly = roleGuard([ Constants.USER_ROLES.SCHOOL_ADMIN ]);

	router.route('/').get(authMiddleware, schoolReaders, schoolProxyMiddleware).post(authMiddleware, schoolAdminOnly, schoolProxyMiddleware);
	router
		.route('/*')
		.delete(authMiddleware, schoolAdminOnly, schoolProxyMiddleware)
		.get(authMiddleware, schoolReaders, schoolProxyMiddleware)
		.patch(authMiddleware, schoolAdminOnly, schoolProxyMiddleware)
		.post(authMiddleware, schoolAdminOnly, schoolProxyMiddleware)
		.put(authMiddleware, schoolAdminOnly, schoolProxyMiddleware);

	return router;
}

export default createSchoolProxyRouter();
