import { Request } from 'express';

export function readRequestBody(request: Request): Promise<Buffer> {
	const existingBody = (request as Request & { body?: unknown }).body;

	if (existingBody && Buffer.isBuffer(existingBody)) {
		return Promise.resolve(existingBody);
	}

	return new Promise((resolve, reject) => {
		const chunks: Buffer[] = [];

		request.on('data', (chunk) => {
			chunks.push(Buffer.from(chunk));
		});

		request.on('end', () => {
			resolve(Buffer.concat(chunks));
		});

		request.on('error', reject);
	});
}

