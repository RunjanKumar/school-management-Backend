import { Router } from 'express';
import authProxy from './authProxy';
import schoolProxy from './schoolProxy';
import userProxy from './userProxy';
import academicProxy from './academicProxy';
import feeProxy from './feeProxy';
import notificationProxy from './notificationProxy';

const router = Router();

router.use('/v1/auth', authProxy);
router.use('/v1/schools', schoolProxy);
router.use('/v1/users', userProxy);
router.use('/v1/academics', academicProxy);
router.use('/v1/fees', feeProxy);
router.use('/v1/notifications', notificationProxy);

export default router;
