export * from './roles';
export * from './status';
export * from './messages';
export * from './auth';

export const Constants = {
    ...require('./roles'),
    ...require('./status'),
    ...require('./messages'),
    ...require('./auth')
};
