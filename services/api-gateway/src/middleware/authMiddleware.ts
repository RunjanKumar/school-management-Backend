import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { config } from '../config';
import { UnauthorizedError, logger } from '@school/common';

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

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
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
        const response = await axios.post(
            `${config.services.auth}/internal/auth/validate`,
            { token },
            {
                headers: {
                    'x-internal-key': config.internalApiKey,
                },
            }
        );

        if (!response.data || !response.data.valid) {
            throw new UnauthorizedError('Invalid token');
        }

        const { userId, role, schoolId, sessionId } = response.data.payload;

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
        next(new UnauthorizedError('Authentication failed'));
    }
};
