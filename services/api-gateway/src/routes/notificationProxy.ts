import { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { config } from '../config';
import { authMiddleware } from '../middleware/authMiddleware';
import { sendProxyError } from '../utils/proxyError';

const router = Router();

// Placeholder for Notification Service
// Proxies all requests to the Notification Service with path rewriting
// Messages/events from async queues might be handled differently, 
// but direct API calls route here.
router.use(
    '/',
    authMiddleware,
    createProxyMiddleware({
        target: config.services.notification,
        changeOrigin: true,
        pathRewrite: {
            '^/v1/notifications': '/v1/notifications',
        },
        on: {
            error: (_err, _req, res) => {
                sendProxyError(res, 'Notification service is currently unavailable');
            }
        }
    })
);

export default router;
