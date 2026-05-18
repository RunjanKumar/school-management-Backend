import { Constants } from '../commons/constants';

interface CardDetails {
	cardNumber: string;
	cardHolderName: string;
	cardExpiryMonth: number;
	cardExpiryYear: number;
	cvv: string;
}

interface PaymentGatewayResponse {
	token: string;
	last4Digits: string;
	cardType: number;
}

/**
 * Store card details in payment gateway and return token
 * @param {CardDetails} cardDetails - Full card details
 * @returns {Promise<PaymentGatewayResponse>} - Token and extracted card info
 */
async function storeCardInGateway(cardDetails: CardDetails): Promise<PaymentGatewayResponse> {
	// Extract last 4 digits
	const last4Digits = cardDetails.cardNumber.slice(-4);

	// Determine card type based on card number
	const cardType = determineCardType(cardDetails.cardNumber);

	// Generate a random token (in real implementation, this would be from payment gateway)
	const token = generateRandomToken();

	// In a real implementation, you would send the card details to your payment gateway here
	// For now, we'll just simulate the process
	await simulatePaymentGatewayCall(cardDetails);

	return {
		token,
		last4Digits,
		cardType
	};
}

/**
 * Determine card type based on card number
 * @param {string} cardNumber - Card number
 * @returns {number} - Card type constant
 */
function determineCardType(cardNumber: string): number {
	const cleanNumber = cardNumber.replace(/\s+/g, '').replace(/-/g, '');

	// Visa: starts with 4
	if (/^4/.test(cleanNumber)) {
		return Constants.CARD_TYPES.VISA;
	}

	// Mastercard: starts with 51-55 or 2221-2720
	if (/^5[1-5]/.test(cleanNumber) || /^2[2-7][2-9][0-9]/.test(cleanNumber)) {
		return Constants.CARD_TYPES.MASTERCARD;
	}

	// American Express: starts with 34 or 37
	if (/^3[47]/.test(cleanNumber)) {
		return Constants.CARD_TYPES.AMEX;
	}

	// Discover: starts with 6011, 622126-622925, 644-649, 65
	if (/^6(?:011|5)/.test(cleanNumber) || /^622(?:12[6-9]|1[3-9][0-9]|[2-8][0-9][0-9]|9[0-1][0-9]|92[0-5])/.test(cleanNumber) || /^64[4-9]/.test(cleanNumber)) {
		return Constants.CARD_TYPES.DISCOVER;
	}

	// RuPay: starts with 6 (simplified check)
	if (/^6/.test(cleanNumber)) {
		return Constants.CARD_TYPES.RUPAY;
	}

	// Default to VISA if unknown
	return Constants.CARD_TYPES.VISA;
}

/**
 * Generate a random token (simulates payment gateway token)
 * @returns {string} - Random token
 */
function generateRandomToken(): string {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let result = 'tok_';
	for (let i = 0; i < 24; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
}

/**
 * Simulate payment gateway API call
 * @param {CardDetails} cardDetails - Card details to send
 * @returns {Promise<void>} - Simulated API call
 */
async function simulatePaymentGatewayCall(cardDetails: CardDetails): Promise<void> {
	// Simulate network delay
	await new Promise((resolve) => setTimeout(resolve, 100));
}

export const paymentGatewayService = {
	storeCardInGateway
};
