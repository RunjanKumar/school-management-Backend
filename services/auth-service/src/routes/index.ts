import { Router } from 'express';
import authRoutes from './authRoutes';
import internalRoutes from './internalRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/internal', internalRoutes);

export default router;
