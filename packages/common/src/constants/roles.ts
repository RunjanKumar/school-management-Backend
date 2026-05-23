export const USER_ROLES = {
	SUPER_ADMIN: 'super_admin',
	SCHOOL_ADMIN: 'school_admin',
	SCHOOL_OPERATOR: 'school_operator',
	TEACHER: 'teacher',
	PARENT: 'parent',
	STUDENT: 'student',
	GUEST: 'guest'
};

export const AVAILABLE_AUTHS: Record<string, number> = {
	SUPER_ADMIN: 1,
	SCHOOL_ADMIN: 2,
	SCHOOL_OPERATOR: 3,
	TEACHER: 4,
	PARENT: 5,
	STUDENT: 6,
	GUEST: 7,
	ANY_LOGGED_IN_USER: 8
};

Object.defineProperties(AVAILABLE_AUTHS, {
	ADMIN: { value: AVAILABLE_AUTHS.SUPER_ADMIN, enumerable: false },
	ADMIN_FORGOT_PASSWORD: { value: 9, enumerable: false }
});
