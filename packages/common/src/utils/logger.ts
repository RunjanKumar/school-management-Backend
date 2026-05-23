import winston from 'winston';

/**
 * Factory function to create a Winston logger for a specific service.
 * @param serviceName Name of the service initializing the logger
 */
export function createLogger(serviceName: string): winston.Logger {
	return winston.createLogger({
		level: process.env.LOG_LEVEL || 'info',
		format: winston.format.combine(
			winston.format.timestamp(),
			winston.format.errors({ stack: true }),
			winston.format.json()
		),
		defaultMeta: { service: serviceName },
		transports: [
			new winston.transports.Console({
				format: winston.format.combine(
					winston.format.colorize(),
					winston.format.simple()
				)
			})
		]
	});
}
