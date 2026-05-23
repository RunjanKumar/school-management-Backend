require('ts-node/register');

const assert = require('node:assert/strict');
const test = require('node:test');

const common = require('@school/common');

test('@school/common exposes shared constants and response helpers', () => {
	assert.deepEqual(common.Constants.USER_ROLES, {
		SUPER_ADMIN: 'super_admin',
		SCHOOL_ADMIN: 'school_admin',
		SCHOOL_OPERATOR: 'school_operator',
		TEACHER: 'teacher',
		PARENT: 'parent',
		STUDENT: 'student',
		GUEST: 'guest'
	});

	assert.equal(common.Constants.AVAILABLE_AUTHS.SUPER_ADMIN, 1);
	assert.equal(common.Constants.AVAILABLE_AUTHS.ADMIN, common.Constants.AVAILABLE_AUTHS.SUPER_ADMIN);
	assert.equal(Object.prototype.propertyIsEnumerable.call(common.Constants.AVAILABLE_AUTHS, 'ADMIN_FORGOT_PASSWORD'), false);

	assert.deepEqual(common.createSuccessResponse('Done', { id: '1' }), {
		statusCode: 200,
		status: true,
		message: 'Done',
		type: 'SUCCESS',
		data: { id: '1' }
	});

	assert.deepEqual(common.createErrorResponse('No token', common.Constants.ERROR_TYPES.UNAUTHORIZED), {
		statusCode: 401,
		status: false,
		message: 'No token',
		type: 'UNAUTHORIZED'
	});
});
