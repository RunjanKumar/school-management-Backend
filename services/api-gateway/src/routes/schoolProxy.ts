import { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { config } from '../config';
import { authMiddleware } from '../middleware/authMiddleware';

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
            error: (err, req, res) => {
                res.status(502).json({ error: 'School service is currently unavailable' });
            }
        }
    })
);

export default router;
