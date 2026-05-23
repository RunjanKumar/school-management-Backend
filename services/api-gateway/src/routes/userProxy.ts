import { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { config } from '../config';
import { authMiddleware } from '../middleware/authMiddleware';

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
            error: (err, req, res) => {
                res.status(502).json({ error: 'User service is currently unavailable' });
            }
        }
    })
);

export default router;
