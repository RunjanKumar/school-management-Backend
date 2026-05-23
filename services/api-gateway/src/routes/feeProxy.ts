import { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { config } from '../config';
import { authMiddleware } from '../middleware/authMiddleware';

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
            error: (err, req, res) => {
                res.status(502).json({ error: 'Fee service is currently unavailable' });
            }
        }
    })
);

export default router;
