import { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { config } from '../config';
import { authMiddleware } from '../middleware/authMiddleware';
import { sendProxyError } from '../utils/proxyError';

const router = Router();

// Placeholder for School Service
// Proxies all requests to the School Service with path rewriting
router.use(
    '/',
    authMiddleware,
    createProxyMiddleware({
        target: config.services.school,
        changeOrigin: true,
        pathRewrite: {
            '^/v1/schools': '/v1/schools',
        },
        on: {
            error: (_err, _req, res) => {
                sendProxyError(res, 'School service is currently unavailable');
            }
        }
    })
);

export default router;
