import { Router } from 'express';
import { createProxyMiddleware, RequestHandler } from 'http-proxy-middleware';
import { config } from '../config';
import { sendProxyError } from '../utils/proxyError';

export function createAuthProxyMiddleware(authServiceUrl = config.services.auth): RequestHandler {
	return createProxyMiddleware({
		target: authServiceUrl,
		changeOrigin: true,
		pathRewrite: {
			'^/v1/auth': '/v1/auth'
		},
		on: {
			error: (_err, _req, res) => {
				sendProxyError(res, 'Auth service is currently unavailable');
			}
		}
	});
}

export function createAuthProxyRouter(authServiceUrl = config.services.auth) {
	const router = Router();

	// Auth routes are public entry points or validate their own bearer token in auth-service.
	router.use('/', createAuthProxyMiddleware(authServiceUrl));

	return router;
}

export default createAuthProxyRouter();
