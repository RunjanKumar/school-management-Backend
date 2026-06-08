import { Router } from 'express';
import internalRoutes from './internalRoutes';
import schoolRoutes from './schoolRoutes';
import masterDataRoutes from './masterDataRoutes';

const router = Router();

router.use('/schools', schoolRoutes);
router.use('/master-data', masterDataRoutes);
router.use('/internal', internalRoutes);

export default router;
