import { Router } from 'express';
import Joi from 'joi';
import { Constants } from '@school/common';
import {
	createSchool,
	getSchoolByCode,
	getSchoolById,
	listSchools,
	updateSchool,
	updateSchoolStatus
} from '../controllers/schoolController';
import { asyncHandler, validateBody } from '../utils/routeUtils';

const router = Router();

const schoolPayloadSchema = Joi.object({
	name: Joi.string().trim().min(2).max(150).required(),
	code: Joi.string().trim().alphanum().min(2).max(30).required(),
	address: Joi.object().unknown(true).optional(),
	contactEmail: Joi.string().email().optional(),
	contactPhone: Joi.string().trim().min(7).max(20).optional(),
	status: Joi.string().valid(...Object.values(Constants.SCHOOL_STATUS)).optional()
});

const schoolUpdateSchema = schoolPayloadSchema.fork([ 'name', 'code' ], (schema) => schema.optional()).min(1);

const statusUpdateSchema = Joi.object({
	status: Joi.string().valid(...Object.values(Constants.SCHOOL_STATUS)).required()
});

router.post('/', validateBody(schoolPayloadSchema), asyncHandler(createSchool));
router.get('/', asyncHandler(listSchools));
router.get('/code/:code', asyncHandler(getSchoolByCode));
router.get('/:id', asyncHandler(getSchoolById));
router.put('/:id', validateBody(schoolUpdateSchema), asyncHandler(updateSchool));
router.put('/:id/status', validateBody(statusUpdateSchema), asyncHandler(updateSchoolStatus));

export default router;
