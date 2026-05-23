import { Router } from 'express';
import config from '../config';
import { createProxyMiddleware } from '../middleware/proxyMiddleware';

export function createAuthProxyRouter(authServiceUrl: string = config.AUTH_SERVICE_URL) {
	const router = Router();
	const proxyToAuthService = createProxyMiddleware({ target: authServiceUrl });

	router.route('/v1/auth/*').get(proxyToAuthService).post(proxyToAuthService).put(proxyToAuthService).patch(proxyToAuthService).delete(proxyToAuthService);

	return router;
}

export default createAuthProxyRouter;

