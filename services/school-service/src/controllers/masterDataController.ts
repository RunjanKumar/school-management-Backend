import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Constants, createErrorResponse, createSuccessResponse } from '@school/common';
import masterDataModel from '../models/masterDataModel';
import { logger } from '../services/logger';
import { MASTER_DATA } from '@common/constants/masterDataModel';
console.log('MASTER_DATA:', MASTER_DATA);
const VALID_TYPES = Object.values(MASTER_DATA);

//
//  GET ALL MASTER DATA BY TYPE
//  Used by School Admin when filling the "Add School" form
//  Example: GET /master-data?type=board
//  Example: GET /master-data?type=medium
//  Example: GET /master-data  (returns ALL types grouped)
//

export async function getMasterData(req: Request, res: Response) {
	const { type } = req.query;

	const filter: Record<string, unknown> = { isDeleted: false, isActive: true };
	if (type && Object.values(MASTER_DATA).includes(type as string)) {
		filter.type = type;
	}

	const data = await masterDataModel
		.find(filter)
		.sort({ type: 1, displayOrder: 1, label: 1 })
		.select('type value label description displayOrder metadata isDefault')
		.lean();

	// Group by type for convenience
	const grouped: Record<string, any[]> = {};
	for (const item of data) {
		if (!grouped[item.type]) grouped[item.type] = [];
		grouped[item.type].push(item);
	}

	const r = createSuccessResponse('Master data fetched successfully.', {
		masterData: type ? data : grouped
	});
	return res.status(r.statusCode).json(r);
}

//  CREATE MASTER DATA (Super Admin only)
//

export async function createMasterData(req: Request, res: Response) {
	const { type, value, label, description, displayOrder, metadata } = req.body;

	if (!VALID_TYPES.includes(type)) {
		const r = createErrorResponse(`Invalid type. Must be one of: ${VALID_TYPES.join(', ')}`, Constants.ERROR_TYPES.BAD_REQUEST);
		return res.status(r.statusCode).json(r);
	}

	const createdBy = req.headers['x-user-id'];

	try {
		const item = await masterDataModel.create({
			type,
			value: value.toLowerCase().trim(),
			label: label.trim(),
			description,
			displayOrder: displayOrder || 0,
			metadata: metadata || {},
			createdBy,
			isDefault: false
		});

		const r = createSuccessResponse('Master data created successfully.', { item });
		return res.status(201).json(r);
	} catch (error: any) {
		if (error?.code === 11000) {
			const r = createErrorResponse(
				`A ${type} with value '${value}' already exists.`,
				Constants.ERROR_TYPES.ALREADY_EXISTS
			);
			return res.status(r.statusCode).json(r);
		}
		throw error;
	}
}

//
//  UPDATE MASTER DATA (Super Admin only)
//

export async function updateMasterData(req: Request, res: Response) {
	const { id } = req.params;

	if (!mongoose.Types.ObjectId.isValid(id)) {
		const r = createErrorResponse('Invalid master data id.', Constants.ERROR_TYPES.BAD_REQUEST);
		return res.status(r.statusCode).json(r);
	}

	const updatePayload = { ...req.body };
	// Don't allow changing type or value of default items
	delete updatePayload.type;
	delete updatePayload.isDefault;

	const item = await masterDataModel.findOneAndUpdate(
		{ _id: id, isDeleted: false },
		{ $set: updatePayload },
		{ new: true, runValidators: true }
	);

	if (!item) {
		const r = createErrorResponse('Master data not found.', Constants.ERROR_TYPES.DATA_NOT_FOUND);
		return res.status(r.statusCode).json(r);
	}

	const r = createSuccessResponse('Master data updated successfully.', { item });
	return res.status(r.statusCode).json(r);
}

//
//  DELETE MASTER DATA (Super Admin only)
//  Cannot delete default (seeded) items
//

export async function deleteMasterData(req: Request, res: Response) {
	const { id } = req.params;

	if (!mongoose.Types.ObjectId.isValid(id)) {
		const r = createErrorResponse('Invalid master data id.', Constants.ERROR_TYPES.BAD_REQUEST);
		return res.status(r.statusCode).json(r);
	}

	const item = await masterDataModel.findOne({ _id: id, isDeleted: false });

	if (!item) {
		const r = createErrorResponse('Master data not found.', Constants.ERROR_TYPES.DATA_NOT_FOUND);
		return res.status(r.statusCode).json(r);
	}

	if (item.isDefault) {
		const r = createErrorResponse(
			'Cannot delete default master data. You can deactivate it instead.',
			Constants.ERROR_TYPES.FORBIDDEN
		);
		return res.status(r.statusCode).json(r);
	}

	await masterDataModel.updateOne({ _id: id }, { $set: { isDeleted: true } });

	const r = createSuccessResponse('Master data deleted successfully.');
	return res.status(r.statusCode).json(r);
}

//
//  TOGGLE ACTIVE/INACTIVE (Super Admin)
//

export async function toggleMasterDataStatus(req: Request, res: Response) {
	const { id } = req.params;

	if (!mongoose.Types.ObjectId.isValid(id)) {
		const r = createErrorResponse('Invalid master data id.', Constants.ERROR_TYPES.BAD_REQUEST);
		return res.status(r.statusCode).json(r);
	}

	const item = await masterDataModel.findOne({ _id: id, isDeleted: false });
	if (!item) {
		const r = createErrorResponse('Master data not found.', Constants.ERROR_TYPES.DATA_NOT_FOUND);
		return res.status(r.statusCode).json(r);
	}

	item.isActive = !item.isActive;
	await item.save();

	const r = createSuccessResponse(
		`Master data ${item.isActive ? 'activated' : 'deactivated'} successfully.`,
		{ item }
	);
	return res.status(r.statusCode).json(r);
}
