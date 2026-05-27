import { Router } from 'express';
import { getInternalSchoolStatus } from '../controllers/schoolController';
import { internalAuth } from '../middleware/internalAuth';
import { asyncHandler } from '../utils/routeUtils';

const router = Router();

router.get('/schools/:id/status', internalAuth, asyncHandler(getInternalSchoolStatus));

export default router;
