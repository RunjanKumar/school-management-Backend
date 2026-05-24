import { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { config } from '../config';
import { authMiddleware } from '../middleware/authMiddleware';
import { sendProxyError } from '../utils/proxyError';

const router = Router();

// Placeholder for Academic Service
// Proxies all requests to the Academic Service with path rewriting
router.use(
    '/',
    authMiddleware,
    createProxyMiddleware({
        target: config.services.academic,
        changeOrigin: true,
        pathRewrite: {
            '^/v1/academics': '/v1/academics',
        },
        on: {
            error: (_err, _req, res) => {
                sendProxyError(res, 'Academic service is currently unavailable');
            }
        }
    })
);

export default router;
