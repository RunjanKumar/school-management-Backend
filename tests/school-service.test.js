require('ts-node/register');

const assert = require('node:assert/strict');
const test = require('node:test');
const mongoose = require('mongoose');

process.env.INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'test-internal-key';

const { Constants } = require('@school/common');
const { schoolModel } = require('../services/school-service/src/models');
const { createSchoolApp } = require('../services/school-service/src/app');

function collectRoutes(app) {
	const registeredRoutes = [];

	const walk = (stack) => {
		for (const layer of stack) {
			if (layer.route) {
				registeredRoutes.push({
					path: layer.route.path,
					methods: Object.keys(layer.route.methods).sort()
				});
			}

			if (layer.name === 'router' && layer.handle?.stack) {
				walk(layer.handle.stack);
			}
		}
	};

	walk(app._router.stack);
	return registeredRoutes;
}

test('school-service owns the schools collection and normalizes tenant data', async () => {
	assert.equal(schoolModel.collection.collectionName, 'schools');

	const school = new schoolModel({
		name: 'Green Valley School',
		code: ' gvs ',
		contactEmail: ' ADMIN@GVS.EXAMPLE ',
		contactPhone: '9876543210',
		createdBy: new mongoose.Types.ObjectId()
	});

	await school.validate();

	assert.equal(school.code, 'GVS');
	assert.equal(school.contactEmail, 'admin@gvs.example');
	assert.equal(school.status, Constants.SCHOOL_STATUS.ACTIVE);
	assert.equal(school.isDeleted, false);
	assert.equal(schoolModel.schema.path('status').enumValues.includes(Constants.SCHOOL_STATUS.SUSPENDED), true);
});

test('school-service app exposes CRUD, status, and internal status routes', () => {
	const app = createSchoolApp();

	assert.deepEqual(collectRoutes(app), [
		{ path: '/swagger.json', methods: [ 'get' ] },
		{ path: '/health', methods: [ 'get' ] },
		{ path: '/', methods: [ 'post' ] },
		{ path: '/', methods: [ 'get' ] },
		{ path: '/code/:code', methods: [ 'get' ] },
		{ path: '/:id', methods: [ 'get' ] },
		{ path: '/:id', methods: [ 'put' ] },
		{ path: '/:id/status', methods: [ 'put' ] },
		{ path: '/schools/:id/status', methods: [ 'get' ] }
	]);
});
