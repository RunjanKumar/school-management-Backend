require('ts-node/register');

const assert = require('node:assert/strict');
const test = require('node:test');
const mongoose = require('mongoose');

const { Constants } = require('../src/commons/constants');
const { buildSuperAdminUserPayload } = require('../src/utils/dbMigration');
const { userModel, schoolModel, sessionModel, loginAuditModel } = require('../src/models');

const roleValues = Object.values(Constants.USER_ROLES);

function hasIndex(schema, expectedFields, predicate = () => true) {
	return schema.indexes().some(([fields, options]) => {
		return JSON.stringify(fields) === JSON.stringify(expectedFields) && predicate(options || {});
	});
}

test('Day 2 constants expose production auth roles, statuses, providers, and auth levels', () => {
	assert.deepEqual(Constants.USER_ROLES, {
		SUPER_ADMIN: 'super_admin',
		SCHOOL_ADMIN: 'school_admin',
		SCHOOL_OPERATOR: 'school_operator',
		TEACHER: 'teacher',
		PARENT: 'parent',
		STUDENT: 'student',
		GUEST: 'guest'
	});

	assert.equal(Constants.AVAILABLE_AUTHS.SUPER_ADMIN, 1);
	assert.equal(Constants.AVAILABLE_AUTHS.SCHOOL_ADMIN, 2);
	assert.equal(Constants.AVAILABLE_AUTHS.SCHOOL_OPERATOR, 3);
	assert.equal(Constants.AVAILABLE_AUTHS.TEACHER, 4);
	assert.equal(Constants.AVAILABLE_AUTHS.PARENT, 5);
	assert.equal(Constants.AVAILABLE_AUTHS.STUDENT, 6);
	assert.equal(Constants.AVAILABLE_AUTHS.GUEST, 7);
	assert.equal(Constants.AVAILABLE_AUTHS.ANY_LOGGED_IN_USER, 8);
	assert.equal(new Set(Object.values(Constants.AVAILABLE_AUTHS).filter(Number.isInteger)).size, 8);
	assert.equal(Constants.AVAILABLE_AUTHS.ADMIN, Constants.AVAILABLE_AUTHS.SUPER_ADMIN);
	assert.notEqual(Constants.AVAILABLE_AUTHS.ADMIN_FORGOT_PASSWORD, Constants.AVAILABLE_AUTHS.ANY_LOGGED_IN_USER);
	assert.equal(Object.prototype.propertyIsEnumerable.call(Constants.AVAILABLE_AUTHS, 'ADMIN_FORGOT_PASSWORD'), false);

	assert.deepEqual(Constants.USER_STATUS, {
		PENDING: 'pending',
		ACTIVE: 'active',
		INACTIVE: 'inactive',
		BLOCKED: 'blocked'
	});
	assert.deepEqual(Constants.SCHOOL_STATUS, {
		ACTIVE: 'active',
		INACTIVE: 'inactive',
		SUSPENDED: 'suspended'
	});
	assert.deepEqual(Constants.AUTH_PROVIDERS, {
		PASSWORD: 'password',
		GOOGLE: 'google'
	});
	assert.deepEqual(Constants.SESSION_TYPES, {
		LOGIN: 'login',
		FORGOT_PASSWORD: 'forgot_password',
		GOOGLE_LOGIN: 'google_login',
		REFRESH_TOKEN: 'refresh_token'
	});
});

test('user model normalizes email and enforces role, provider, and tenant edge cases', async () => {
	const superAdmin = new userModel({
		email: ' Root.Admin@Example.COM ',
		passwordHash: 'hashed-password',
		role: Constants.USER_ROLES.SUPER_ADMIN
	});
	await superAdmin.validate();

	assert.equal(superAdmin.email, 'root.admin@example.com');
	assert.equal(superAdmin.normalizedEmail, 'root.admin@example.com');
	assert.equal(superAdmin.authProviders.password, true);
	assert.equal(superAdmin.authProviders.google, false);
	assert.equal(superAdmin.status, Constants.USER_STATUS.PENDING);
	assert.equal(superAdmin.isDeleted, false);

	await assert.rejects(
		new userModel({
			email: 'teacher@example.com',
			passwordHash: 'hashed-password',
			role: Constants.USER_ROLES.TEACHER
		}).validate(),
		/schoolId is required/i
	);

	await assert.rejects(
		new userModel({
			email: 'root.with.school@example.com',
			passwordHash: 'hashed-password',
			role: Constants.USER_ROLES.SUPER_ADMIN,
			schoolId: new mongoose.Types.ObjectId()
		}).validate(),
		/super admin must not have a schoolId/i
	);

	await assert.rejects(
		new userModel({
			email: 'no-password@example.com',
			role: Constants.USER_ROLES.SUPER_ADMIN
		}).validate(),
		/passwordHash is required/i
	);

	const googleParent = new userModel({
		email: 'parent@example.com',
		role: Constants.USER_ROLES.PARENT,
		schoolId: new mongoose.Types.ObjectId(),
		authProviders: { password: false, google: true },
		googleSub: 'google-sub-123'
	});
	await googleParent.validate();

	assert.equal(googleParent.passwordHash, undefined);
	assert.equal(googleParent.authProviders.google, true);

	assert.equal(hasIndex(userModel.schema, { normalizedEmail: 1 }, (options) => options.unique === true), true);
	assert.equal(hasIndex(userModel.schema, { googleSub: 1 }, (options) => options.sparse === true), true);
});

test('school model normalizes tenant data and defines a unique school code index', async () => {
	const school = new schoolModel({
		name: ' Green Valley School ',
		code: ' gvs001 ',
		createdBy: new mongoose.Types.ObjectId(),
		contactEmail: ' OFFICE@GVS.EDU ',
		contactPhone: ' +91 99999 99999 '
	});

	await school.validate();

	assert.equal(school.name, 'Green Valley School');
	assert.equal(school.code, 'GVS001');
	assert.equal(school.contactEmail, 'office@gvs.edu');
	assert.equal(school.contactPhone, '+91 99999 99999');
	assert.equal(school.status, Constants.SCHOOL_STATUS.ACTIVE);
	assert.equal(school.isDeleted, false);
	assert.equal(hasIndex(schoolModel.schema, { code: 1 }, (options) => options.unique === true), true);
});

test('session model supports role-aware login sessions, refresh metadata, and revocation', () => {
	const schema = sessionModel.schema;

	assert.equal(schema.path('role').options.required, true);
	assert.deepEqual([...schema.path('role').enumValues].sort(), [...roleValues].sort());
	assert.equal(schema.path('type').enumValues.includes(Constants.SESSION_TYPES.LOGIN), true);
	assert.equal(schema.path('type').enumValues.includes(Constants.SESSION_TYPES.FORGOT_PASSWORD), true);
	assert.ok(schema.path('schoolId'));
	assert.ok(schema.path('refreshTokenHash'));
	assert.ok(schema.path('deviceId'));
	assert.ok(schema.path('ipAddress'));
	assert.ok(schema.path('userAgent'));
	assert.ok(schema.path('revokedAt'));
});

test('login audit model records normalized security events for password and Google login', async () => {
	const failedLogin = new loginAuditModel({
		email: ' USER@Example.COM ',
		loginMethod: Constants.AUTH_PROVIDERS.PASSWORD,
		success: false,
		failureReason: 'Invalid credentials',
		ipAddress: '127.0.0.1',
		userAgent: 'node-test'
	});

	await failedLogin.validate();

	assert.equal(failedLogin.email, 'user@example.com');
	assert.equal(failedLogin.success, false);
	assert.equal(failedLogin.loginMethod, Constants.AUTH_PROVIDERS.PASSWORD);
	assert.equal(loginAuditModel.schema.path('schoolId').options.ref, 'schools');
	assert.equal(loginAuditModel.schema.path('userId').options.ref, 'users');
});

test('super admin migration payload seeds the central users collection without a school scope', () => {
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

	assert.throws(
		() => buildSuperAdminUserPayload({ NAME: 'Root Admin', EMAIL: '', PASSWORD: 'PlainText#123' }, 'hashed-password'),
		/ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD are required/i
	);
});
