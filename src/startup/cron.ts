import cron from 'node-cron';
import dbService from '../services/databaseService';
import * as Models from '../models';

/**
 * Run crons
 */
export default async function runCrons() {
	cron.schedule('0 0 * * *', deleteExpiredSessions);
}

/**
 * Delete expired sessions
 */
async function deleteExpiredSessions() {
	await dbService.deleteMany(Models.sessionModel, { expirationTime: { $lt: new Date() } });
}

deleteExpiredSessions();
