import admin from 'firebase-admin';
import { logger } from './logger';

export type GoogleTokenClaims = {
	sub: string;
	email: string;
	email_verified?: boolean;
	name?: string;
	picture?: string;
};

const initializeFirebaseAdmin = () => {
	if (admin.apps.length) {
		return;
	}

	// Firebase Admin uses GOOGLE_APPLICATION_CREDENTIALS or the hosting platform identity.
	admin.initializeApp({
		credential: admin.credential.applicationDefault()
	});
};

export const verifyGoogleToken = async (idToken: string): Promise<GoogleTokenClaims> => {
	try {
		initializeFirebaseAdmin();
		const decodedToken = await admin.auth().verifyIdToken(idToken);

		logger.info('Google ID token verified', { uid: decodedToken.uid, email: decodedToken.email });
		return {
			sub: decodedToken.uid,
			email: decodedToken.email || '',
			email_verified: decodedToken.email_verified,
			name: decodedToken.name,
			picture: decodedToken.picture
		};
	} catch (error) {
		if (process.env.NODE_ENV !== 'production' && idToken === 'dev-google-token') {
			// Local-only escape hatch for learning the backend flow without real Google credentials.
			logger.warn('Using development Google token fallback');
			return {
				sub: process.env.DEV_GOOGLE_SUB || 'google-sub-placeholder',
				email: process.env.DEV_GOOGLE_EMAIL || 'test@example.com',
				email_verified: true,
				name: process.env.DEV_GOOGLE_NAME || 'Test User'
			};
		}

		logger.warn('Google ID token verification failed', { error: error instanceof Error ? error.message : String(error) });
		throw error;
	}
};
