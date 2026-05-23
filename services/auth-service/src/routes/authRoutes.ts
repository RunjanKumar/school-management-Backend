import { Router } from 'express';
import { login, googleAuth, forgotPassword, resetPassword, logout, me } from '../controllers/authController';
import { asyncHandler, validateBody } from '../utils/routeUtils';
import Joi from 'joi';

const router = Router();

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

router.post('/login', validateBody(loginSchema), asyncHandler(login));
router.post('/google', asyncHandler(googleAuth));
router.post('/forgot-password', asyncHandler(forgotPassword));
router.post('/reset-password', asyncHandler(resetPassword));
router.post('/logout', asyncHandler(logout));
router.get('/me', asyncHandler(me));

export default router;
