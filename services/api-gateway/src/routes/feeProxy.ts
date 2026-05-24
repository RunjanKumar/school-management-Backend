import { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { config } from '../config';
import { authMiddleware } from '../middleware/authMiddleware';
import { sendProxyError } from '../utils/proxyError';

const router = Router();

// Placeholder for Fee Service
// Proxies all requests to the Fee Service with path rewriting
router.use(
    '/',
    authMiddleware,
    createProxyMiddleware({
        target: config.services.fee,
        changeOrigin: true,
        pathRewrite: {
            '^/v1/fees': '/v1/fees',
        },
        on: {
            error: (_err, _req, res) => {
                sendProxyError(res, 'Fee service is currently unavailable');
            }
        }
    })
);

export default router;
