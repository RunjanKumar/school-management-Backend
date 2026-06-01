import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Constants, createErrorResponse, createSuccessResponse } from '@school/common';
import schoolModel from '../models/schoolModel';
import { logger } from '../services/logger';

const getRequesterId = (request: Request) => {
	const userId = request.headers['x-user-id'];
	return Array.isArray(userId) ? userId[0] : userId;
};

const getRequesterRole = (request: Request) => {
	const role = request.headers['x-user-role'];
	return Array.isArray(role) ? role[0] : role;
};

const forbiddenResponse = (message: string) => createErrorResponse(message, Constants.ERROR_TYPES.FORBIDDEN);

const ensureRole = (request: Request, allowedRoles: string[]) => {
	const role = getRequesterRole(request);
	return role && allowedRoles.includes(role) ? role : undefined;
};

const getPagination = (request: Request) => {
	const page = Math.max(Number(request.query.page || 1), 1);
	const limit = Math.min(Math.max(Number(request.query.limit || 20), 1), 100);
	return { page, limit, skip: (page - 1) * limit };
};

const schoolNotFoundResponse = () => createErrorResponse('School not found.', Constants.ERROR_TYPES.DATA_NOT_FOUND);

export async function createSchool(request: Request, response: Response) {
	const createdBy = getRequesterId(request);
	const role = ensureRole(request, [ Constants.USER_ROLES.SCHOOL_ADMIN ]);

	if (!role) {
		const responseObject = forbiddenResponse('Only school admin can create schools.');
		return response.status(responseObject.statusCode).json(responseObject);
	}

	if (!createdBy || !mongoose.Types.ObjectId.isValid(createdBy)) {
		logger.warn('Create school rejected because gateway user header was missing or invalid', { createdBy });
		const responseObject = createErrorResponse(Constants.RESPONSE_MESSAGES.UNAUTHORIZED, Constants.ERROR_TYPES.UNAUTHORIZED);
		return response.status(responseObject.statusCode).json(responseObject);
	}

	const payload = {
		...request.body,
		code: request.body.code.toUpperCase(),
		createdBy
	};

	logger.info('Creating school', { code: payload.code, createdBy });

	try {
		const school = await schoolModel.create(payload);
		const responseObject = createSuccessResponse('School created successfully.', { school });
		logger.info('School created', { schoolId: school._id.toString(), code: school.code });
		return response.status(201).json(responseObject);
	} catch (error: any) {
		if (error?.code === 11000) {
			logger.warn('Create school rejected because code already exists', { code: payload.code });
			const responseObject = createErrorResponse('A school with this code already exists.', Constants.ERROR_TYPES.ALREADY_EXISTS);
			return response.status(responseObject.statusCode).json(responseObject);
		}

		throw error;
	}
}

export async function listSchools(request: Request, response: Response) {
	const requesterId = getRequesterId(request);
	const role = ensureRole(request, [ Constants.USER_ROLES.SUPER_ADMIN, Constants.USER_ROLES.SCHOOL_ADMIN ]);

	if (!role) {
		const responseObject = forbiddenResponse('You are not allowed to read schools.');
		return response.status(responseObject.statusCode).json(responseObject);
	}

	const { page, limit, skip } = getPagination(request);
	const filter: Record<string, unknown> = { isDeleted: false };

	if (role === Constants.USER_ROLES.SCHOOL_ADMIN) {
		if (!requesterId || !mongoose.Types.ObjectId.isValid(requesterId)) {
			const responseObject = createErrorResponse(Constants.RESPONSE_MESSAGES.UNAUTHORIZED, Constants.ERROR_TYPES.UNAUTHORIZED);
			return response.status(responseObject.statusCode).json(responseObject);
		}
		filter.createdBy = new mongoose.Types.ObjectId(requesterId);
	}

	if (request.query.status) {
		filter.status = request.query.status;
	}

	if (request.query.search) {
		filter.$or = [
			{ name: { $regex: request.query.search, $options: 'i' } },
			{ code: { $regex: request.query.search, $options: 'i' } }
		];
	}

	logger.info('Listing schools', { page, limit, filter });

	const [ schools, total ] = await Promise.all([
		schoolModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
		schoolModel.countDocuments(filter)
	]);

	const responseObject = createSuccessResponse('Schools fetched successfully.', {
		schools,
		pagination: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit)
		}
	});

	return response.status(responseObject.statusCode).json(responseObject);
}

export async function getSchoolById(request: Request, response: Response) {
	const { id } = request.params;
	const requesterId = getRequesterId(request);
	const role = ensureRole(request, [ Constants.USER_ROLES.SUPER_ADMIN, Constants.USER_ROLES.SCHOOL_ADMIN ]);

	if (!role) {
		const responseObject = forbiddenResponse('You are not allowed to read this school.');
		return response.status(responseObject.statusCode).json(responseObject);
	}

	if (!mongoose.Types.ObjectId.isValid(id)) {
		const responseObject = createErrorResponse('Invalid school id.', Constants.ERROR_TYPES.BAD_REQUEST);
		return response.status(responseObject.statusCode).json(responseObject);
	}

	logger.info('Fetching school by id', { schoolId: id });
	const filter: Record<string, unknown> = { _id: id, isDeleted: false };
	if (role === Constants.USER_ROLES.SCHOOL_ADMIN) {
		filter.createdBy = requesterId;
	}
	const school = await schoolModel.findOne(filter);

	if (!school) {
		const responseObject = schoolNotFoundResponse();
		return response.status(responseObject.statusCode).json(responseObject);
	}

	const responseObject = createSuccessResponse('School fetched successfully.', { school });
	return response.status(responseObject.statusCode).json(responseObject);
}

export async function getSchoolByCode(request: Request, response: Response) {
	const code = request.params.code.toUpperCase();
	const requesterId = getRequesterId(request);
	const role = ensureRole(request, [ Constants.USER_ROLES.SUPER_ADMIN, Constants.USER_ROLES.SCHOOL_ADMIN ]);

	if (!role) {
		const responseObject = forbiddenResponse('You are not allowed to read this school.');
		return response.status(responseObject.statusCode).json(responseObject);
	}

	logger.info('Fetching school by code', { code });
	const filter: Record<string, unknown> = { code, isDeleted: false };
	if (role === Constants.USER_ROLES.SCHOOL_ADMIN) {
		filter.createdBy = requesterId;
	}
	const school = await schoolModel.findOne(filter);

	if (!school) {
		const responseObject = schoolNotFoundResponse();
		return response.status(responseObject.statusCode).json(responseObject);
	}

	const responseObject = createSuccessResponse('School fetched successfully.', { school });
	return response.status(responseObject.statusCode).json(responseObject);
}

export async function updateSchool(request: Request, response: Response) {
	const { id } = request.params;
	const requesterId = getRequesterId(request);
	const role = ensureRole(request, [ Constants.USER_ROLES.SCHOOL_ADMIN ]);

	if (!role) {
		const responseObject = forbiddenResponse('Only school admin can update schools.');
		return response.status(responseObject.statusCode).json(responseObject);
	}

	if (!mongoose.Types.ObjectId.isValid(id)) {
		const responseObject = createErrorResponse('Invalid school id.', Constants.ERROR_TYPES.BAD_REQUEST);
		return response.status(responseObject.statusCode).json(responseObject);
	}

	const updatePayload = {
		...request.body,
		...(request.body.code ? { code: request.body.code.toUpperCase() } : {})
	};

	logger.info('Updating school', { schoolId: id, fields: Object.keys(updatePayload) });

	try {
		const school = await schoolModel.findOneAndUpdate(
			{ _id: id, isDeleted: false, createdBy: requesterId },
			{ $set: updatePayload },
			{ new: true, runValidators: true }
		);

		if (!school) {
			const responseObject = schoolNotFoundResponse();
			return response.status(responseObject.statusCode).json(responseObject);
		}

		const responseObject = createSuccessResponse('School updated successfully.', { school });
		return response.status(responseObject.statusCode).json(responseObject);
	} catch (error: any) {
		if (error?.code === 11000) {
			logger.warn('Update school rejected because code already exists', { schoolId: id, code: updatePayload.code });
			const responseObject = createErrorResponse('A school with this code already exists.', Constants.ERROR_TYPES.ALREADY_EXISTS);
			return response.status(responseObject.statusCode).json(responseObject);
		}

		throw error;
	}
}

export async function updateSchoolStatus(request: Request, response: Response) {
	const { id } = request.params;
	const { status } = request.body;
	const requesterId = getRequesterId(request);
	const role = ensureRole(request, [ Constants.USER_ROLES.SCHOOL_ADMIN ]);

	if (!role) {
		const responseObject = forbiddenResponse('Only school admin can update school status.');
		return response.status(responseObject.statusCode).json(responseObject);
	}

	if (!mongoose.Types.ObjectId.isValid(id)) {
		const responseObject = createErrorResponse('Invalid school id.', Constants.ERROR_TYPES.BAD_REQUEST);
		return response.status(responseObject.statusCode).json(responseObject);
	}

	logger.info('Updating school status', { schoolId: id, status });
	const school = await schoolModel.findOneAndUpdate(
		{ _id: id, isDeleted: false, createdBy: requesterId },
		{ $set: { status } },
		{ new: true, runValidators: true }
	);

	if (!school) {
		const responseObject = schoolNotFoundResponse();
		return response.status(responseObject.statusCode).json(responseObject);
	}

	const responseObject = createSuccessResponse('School status updated successfully.', { school });
	return response.status(responseObject.statusCode).json(responseObject);
}

export async function getInternalSchoolStatus(request: Request, response: Response) {
	const { id } = request.params;

	if (!mongoose.Types.ObjectId.isValid(id)) {
		return response.status(400).json({
			valid: false,
			active: false,
			status: null,
			message: 'Invalid school id.'
		});
	}

	logger.info('Checking school status for internal caller', { schoolId: id });
	const school = await schoolModel.findOne({ _id: id, isDeleted: false }).select('_id code status');

	if (!school) {
		return response.status(404).json({
			valid: false,
			active: false,
			status: null,
			message: 'School not found.'
		});
	}

	return response.status(200).json({
		valid: true,
		active: school.status === Constants.SCHOOL_STATUS.ACTIVE,
		status: school.status,
		schoolId: school._id.toString(),
		code: school.code
	});
}
