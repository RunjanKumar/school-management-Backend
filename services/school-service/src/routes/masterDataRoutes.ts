import { Router } from 'express';
import Joi from 'joi';
import {
	getMasterData,
	createMasterData,
	updateMasterData,
	deleteMasterData,
	toggleMasterDataStatus
} from '../controllers/masterDataController';
import { asyncHandler, validateBody } from '../utils/routeUtils';

const router = Router();

const createSchema = Joi.object({
	type: Joi.string().valid('board', 'medium', 'ownership', 'category', 'module').required(),
	value: Joi.string().trim().min(1).max(50).required(),
	label: Joi.string().trim().min(1).max(100).required(),
	description: Joi.string().trim().max(300).optional(),
	displayOrder: Joi.number().integer().min(0).default(0).optional(),
	metadata: Joi.object().unknown(true).optional()
});

const updateSchema = Joi.object({
	value: Joi.string().trim().min(1).max(50).optional(),
	label: Joi.string().trim().min(1).max(100).optional(),
	description: Joi.string().trim().max(300).optional(),
	displayOrder: Joi.number().integer().min(0).optional(),
	metadata: Joi.object().unknown(true).optional(),
	isActive: Joi.boolean().optional()
}).min(1);

// Public route — School Admin uses this to fill dropdowns
router.get('/', asyncHandler(getMasterData));

// Super Admin only routes
router.post('/', validateBody(createSchema), asyncHandler(createMasterData));
router.put('/:id', validateBody(updateSchema), asyncHandler(updateMasterData));
router.delete('/:id', asyncHandler(deleteMasterData));
router.patch('/:id/toggle', asyncHandler(toggleMasterDataStatus));

export default router;