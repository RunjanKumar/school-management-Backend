import { Router } from 'express';
import internalRoutes from './internalRoutes';
import schoolRoutes from './schoolRoutes';

const router = Router();

router.use('/schools', schoolRoutes);
router.use('/internal', internalRoutes);

export default router;
