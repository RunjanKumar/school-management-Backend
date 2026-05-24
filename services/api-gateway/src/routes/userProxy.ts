import { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { config } from '../config';
import { authMiddleware } from '../middleware/authMiddleware';
import { sendProxyError } from '../utils/proxyError';

const router = Router();

// Placeholder for User Service
// Proxies all requests to the User Service with path rewriting
router.use(
    '/',
    authMiddleware,
    createProxyMiddleware({
        target: config.services.user,
        changeOrigin: true,
        pathRewrite: {
            '^/v1/users': '/v1/users',
        },
        on: {
            error: (_err, _req, res) => {
                sendProxyError(res, 'User service is currently unavailable');
            }
        }
    })
);

export default router;
