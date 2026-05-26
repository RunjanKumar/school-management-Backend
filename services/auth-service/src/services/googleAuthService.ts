export type GoogleTokenClaims = {
	sub: string;
	email: string;
	email_verified?: boolean;
	name?: string;
	picture?: string;
};

export const verifyGoogleToken = async (_idToken: string): Promise<GoogleTokenClaims> => {
	// TODO: Replace this with google-auth-library or Firebase Admin verification.
	// The controller treats this as a verified contract and enforces verified email.
	return {
		sub: 'google-sub-placeholder',
		email: 'test@example.com',
		email_verified: true
	};
};
