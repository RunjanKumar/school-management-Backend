require('ts-node/register');

const assert = require('node:assert/strict');
const test = require('node:test');
const mongoose = require('mongoose');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'test-internal-key';

const { Constants } = require('@school/common');
const { userModel, sessionModel, loginAuditModel } = require('../services/auth-service/src/models');
const { buildSuperAdminUserPayload } = require('../services/auth-service/src/utils/dbMigration');
const { createAuthApp } = require('../services/auth-service/src/app');

test('auth-service owns login identity, session, and audit collections', async () => {
	assert.equal(userModel.collection.collectionName, 'users');
	assert.equal(sessionModel.collection.collectionName, 'sessions');
	assert.equal(loginAuditModel.collection.collectionName, 'loginAudits');

	const schoolScopedUser = new userModel({
		email: ' Teacher@Example.COM ',
		passwordHash: 'hashed-password',
		role: Constants.USER_ROLES.TEACHER,
		schoolId: new mongoose.Types.ObjectId()
	});
	await schoolScopedUser.validate();

	assert.equal(schoolScopedUser.email, 'teacher@example.com');
	assert.equal(schoolScopedUser.normalizedEmail, 'teacher@example.com');
	assert.equal(schoolScopedUser.status, Constants.USER_STATUS.PENDING);

	await assert.rejects(
		new userModel({
			email: 'teacher-without-school@example.com',
			passwordHash: 'hashed-password',
			role: Constants.USER_ROLES.TEACHER
		}).validate(),
		/schoolId is required/i
	);

	assert.equal(sessionModel.schema.path('type').enumValues.includes(Constants.SESSION_TYPES.LOGIN), true);
	assert.equal(sessionModel.schema.path('revokedAt').options.index, true);
	assert.equal(loginAuditModel.schema.path('loginMethod').enumValues.includes(Constants.AUTH_PROVIDERS.PASSWORD), true);
});

test('auth-service seeds super admin credentials without school scope', () => {
	const payload = buildSuperAdminUserPayload(
		{
			NAME: 'Root Admin',
			EMAIL: ' Root.Admin@Example.COM ',
			PASSWORD: 'PlainText#123'
		},
		'hashed-password'
	);

	assert.deepEqual(payload, {
		email: 'root.admin@example.com',
		normalizedEmail: 'root.admin@example.com',
		passwordHash: 'hashed-password',
		role: Constants.USER_ROLES.SUPER_ADMIN,
		authProviders: {
			password: true,
			google: false
		},
		emailVerified: true,
		status: Constants.USER_STATUS.ACTIVE,
		isDeleted: false
	});
});

test('auth-service app exposes public auth routes and internal validation route', () => {
	const app = createAuthApp();
	const registeredRoutes = [];

	const collectRoutes = (stack) => {
		for (const layer of stack) {
			if (layer.route) {
				registeredRoutes.push({
					path: layer.route.path,
					methods: Object.keys(layer.route.methods).sort()
				});
			}

			if (layer.name === 'router' && layer.handle?.stack) {
				collectRoutes(layer.handle.stack);
			}
		}
	};

	collectRoutes(app._router.stack);

	assert.deepEqual(registeredRoutes, [
		{ path: '/health', methods: [ 'get' ] },
		{ path: '/v1/auth/login', methods: [ 'post' ] },
		{ path: '/v1/auth/logout', methods: [ 'post' ] },
		{ path: '/v1/auth/me', methods: [ 'get' ] },
		{ path: '/v1/internal/auth/validate', methods: [ 'post' ] }
	]);
});
