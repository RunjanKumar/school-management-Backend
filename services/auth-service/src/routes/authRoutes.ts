import { Router } from 'express';
import { forgotPassword, googleAuth, login, logout, me, refresh, resetPassword } from '../controllers/authController';
import { asyncHandler, validateBody } from '../utils/routeUtils';
import Joi from 'joi';

const router = Router();

const loginSchema = Joi.object({
	email: Joi.string().email().required(),
	password: Joi.string().required(),
	deviceId: Joi.string().optional()
});

const googleLoginSchema = Joi.object({
	idToken: Joi.string().required(),
	role: Joi.string().valid('parent', 'student', 'guest').optional(),
	schoolCode: Joi.string().optional(),
	deviceId: Joi.string().optional()
});

router.post('/login', validateBody(loginSchema), asyncHandler(login));
router.post('/google', validateBody(googleLoginSchema), asyncHandler(googleAuth));
router.post('/forgot-password', asyncHandler(forgotPassword));
router.post('/reset-password', asyncHandler(resetPassword));
router.post('/refresh', asyncHandler(refresh));
router.post('/logout', asyncHandler(logout));
router.get('/me', asyncHandler(me));

export default router;
