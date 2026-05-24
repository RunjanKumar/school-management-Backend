import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { config } from '../config';
import { UnauthorizedError } from '@school/common';
import { logger } from '../services/logger';

interface TokenCacheEntry {
    data: {
        userId: string;
        role: string;
        schoolId: string | null;
        sessionId: string;
    };
    expiresAt: number;
}

const tokenCache: Record<string, TokenCacheEntry> = {};
const CACHE_TTL = 60 * 1000; // 60 seconds TTL

type AuthMiddlewareOptions = {
    authServiceUrl?: string;
    internalApiKey?: string;
    validateToken?: (token: string, internalApiKey: string) => Promise<any>;
};

const defaultValidateToken = async (token: string, internalApiKey: string, authServiceUrl = config.services.auth) => {
    const response = await axios.post(
        `${authServiceUrl}/internal/auth/validate`,
        { token },
        {
            headers: {
                'x-internal-key': internalApiKey,
            },
        }
    );

    return response.data;
};

export const createAuthMiddleware = (options: AuthMiddlewareOptions = {}) => async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedError('Missing or invalid authorization header');
        }

        const token = authHeader.split(' ')[1];
        const now = Date.now();

        // 1. Check in-memory cache
        if (tokenCache[token] && tokenCache[token].expiresAt > now) {
            const cachedData = tokenCache[token].data;
            req.headers['x-user-id'] = cachedData.userId;
            req.headers['x-user-role'] = cachedData.role;
            if (cachedData.schoolId) req.headers['x-school-id'] = cachedData.schoolId;
            req.headers['x-session-id'] = cachedData.sessionId;
            return next();
        }

        // Random cleanup of expired entries
        if (Math.random() < 0.05) {
            for (const key in tokenCache) {
                if (tokenCache[key].expiresAt <= now) {
                    delete tokenCache[key];
                }
            }
        }

        // 2. Validate token with Auth Service
        const internalApiKey = options.internalApiKey || config.internalApiKey;
        const authServiceUrl = options.authServiceUrl || config.services.auth;
        const validationResult = options.validateToken
            ? await options.validateToken(token, internalApiKey)
            : await defaultValidateToken(token, internalApiKey, authServiceUrl);

        if (!validationResult || !validationResult.valid) {
            throw new UnauthorizedError('Invalid token');
        }

        const { userId, role, schoolId, sessionId } = validationResult.payload || validationResult;

        // 3. Cache the valid token
        tokenCache[token] = {
            data: { userId, role, schoolId, sessionId },
            expiresAt: now + CACHE_TTL,
        };

        // 4. Set headers for downstream proxy
        req.headers['x-user-id'] = userId;
        req.headers['x-user-role'] = role;
        if (schoolId) req.headers['x-school-id'] = schoolId;
        req.headers['x-session-id'] = sessionId;

        next();
    } catch (error) {
        logger.error('Authentication failed', { error: error instanceof Error ? error.message : String(error) });
        if (res.headersSent) {
            return next(new UnauthorizedError('Authentication failed'));
        }

        return res.status(401).json({
            statusCode: 401,
            status: false,
            message: 'Authentication failed',
            type: 'UNAUTHORIZED'
        });
    }
};

export const authMiddleware = createAuthMiddleware();
