import { Router } from 'express';
import { createProxyMiddleware, RequestHandler } from 'http-proxy-middleware';
import { Constants } from '@school/common';
import { config } from '../config';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleGuard } from '../middleware/roleGuard';
import { sendProxyError } from '../utils/proxyError';

/**
 * Creates a proxy middleware that forwards /v1/master-data requests
 * to the school-service (which hosts master data internally).
 */
export function createMasterDataProxyMiddleware(schoolServiceUrl = config.services.school): RequestHandler {
	return createProxyMiddleware({
		target: schoolServiceUrl,
		changeOrigin: true,
		pathRewrite: {
			'^/v1/master-data': '/v1/master-data'
		},
		on: {
			error: (_err, _req, res) => {
				sendProxyError(res, 'Master data service is currently unavailable');
			}
		}
	});
}

/**
 * Router-based alternative (mirrors createSchoolProxyRouter pattern).
 * Currently NOT used by app.ts — kept for reference / future refactor.
 */
export function createMasterDataProxyRouter(schoolServiceUrl = config.services.school) {
	const router = Router();

	const masterDataProxy = createMasterDataProxyMiddleware(schoolServiceUrl);
	const superAdminOnly = roleGuard([ Constants.USER_ROLES.SUPER_ADMIN ]);
	const masterDataReaders = roleGuard([ Constants.USER_ROLES.SUPER_ADMIN, Constants.USER_ROLES.SCHOOL_ADMIN ]);

	// GET /  — School Admin + Super Admin can read (for dropdowns)
	// POST / — Super Admin only can create
	router
		.route('/')
		.get(authMiddleware, masterDataReaders, masterDataProxy)
		.post(authMiddleware, superAdminOnly, masterDataProxy);

	// PUT/DELETE/PATCH /:id — Super Admin only
	router
		.route('/*')
		.delete(authMiddleware, superAdminOnly, masterDataProxy)
		.get(authMiddleware, masterDataReaders, masterDataProxy)
		.patch(authMiddleware, superAdminOnly, masterDataProxy)
		.put(authMiddleware, superAdminOnly, masterDataProxy);

	return router;
}

export default createMasterDataProxyRouter();
