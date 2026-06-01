import { Router } from 'express';
import { createSchoolAdmin, forgotPassword, googleAuth, login, logout, me, refresh, resetPassword, updateMe } from '../controllers/authController';
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

const forgotPasswordSchema = Joi.object({
	email: Joi.string().email().required()
});

const resetPasswordSchema = Joi.object({
	token: Joi.string().required(),
	password: Joi.string().required()
});

const refreshSchema = Joi.object({
	refreshToken: Joi.string().required()
});

const logoutSchema = Joi.object({
	token: Joi.string().optional(),
	refreshToken: Joi.string().optional()
});

const createSchoolAdminSchema = Joi.object({
	name: Joi.string().trim().min(2).max(100).optional(),
	email: Joi.string().email().required(),
	password: Joi.string().min(8).required()
});

const updateMeSchema = Joi.object({
	name: Joi.string().trim().min(2).max(100).required()
});

router.post('/login', validateBody(loginSchema), asyncHandler(login));
router.post('/google', validateBody(googleLoginSchema), asyncHandler(googleAuth));
router.post('/forgot-password', validateBody(forgotPasswordSchema), asyncHandler(forgotPassword));
router.post('/reset-password', validateBody(resetPasswordSchema), asyncHandler(resetPassword));
router.post('/refresh', validateBody(refreshSchema), asyncHandler(refresh));
router.post('/logout', validateBody(logoutSchema), asyncHandler(logout));
router.get('/me', asyncHandler(me));
router.put('/me', validateBody(updateMeSchema), asyncHandler(updateMe));
router.post('/school-admins', validateBody(createSchoolAdminSchema), asyncHandler(createSchoolAdmin));

export default router;
