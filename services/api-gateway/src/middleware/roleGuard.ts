import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '@school/common';

export const roleGuard = (allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const userRole = req.headers['x-user-role'] as string;

        if (!userRole) {
            return next(new UnauthorizedError('No user role found in request'));
        }

        if (!allowedRoles.includes(userRole)) {
            return next(new UnauthorizedError('User role not authorized for this resource'));
        }

        next();
    };
};
