import { createLogger, format, transports } from 'winston';

export const logger = createLogger({
	levels: {
		error: 0,
		warn: 1,
		info: 2,
		http: 3,
		verbose: 4
	},
	format: format.combine(
		format.timestamp(),
		format.printf(({ timestamp, level, message }) => {
			return `${timestamp} ${level}: ${message}`;
		})
	),
	transports: [ new transports.Console(), new transports.File({ filename: 'logs/error.log', level: 'error' }), new transports.File({ filename: 'logs/warn.log', level: 'warn' }), new transports.File({ filename: 'logs/combined.log' }) ]
});
