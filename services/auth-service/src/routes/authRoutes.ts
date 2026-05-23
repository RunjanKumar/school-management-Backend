import { Router, Request, Response, NextFunction } from 'express';
import * as authController from '../controllers/authController';
import { internalAuth } from '../middleware/internalAuth';

const router = Router();

const send = (handler: (request: Request) => Promise<any>) => {
	return (request: Request, response: Response, next: NextFunction) => {
		handler(request)
			.then((responseObject) => response.status(responseObject.statusCode || 200).json(responseObject))
			.catch(next);
	};
};

router.post('/v1/auth/login', send(authController.login));
router.post('/v1/auth/logout', send(authController.logout));
router.get('/v1/auth/me', send(authController.me));
router.post('/v1/internal/auth/validate', internalAuth, send(authController.validate));

export default router;

