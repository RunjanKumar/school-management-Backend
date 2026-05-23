import http from 'node:http';
import https from 'node:https';

export type HttpClientResponse = {
	statusCode: number;
	headers: http.IncomingHttpHeaders;
	body: Buffer;
};

export type HttpClientRequest = {
	method: string;
	url: string;
	headers?: Record<string, string | string[] | undefined>;
	body?: Buffer;
};

const getTransport = (url: URL) => {
	return url.protocol === 'https:' ? https : http;
};

export function sendHttpRequest(request: HttpClientRequest): Promise<HttpClientResponse> {
	const url = new URL(request.url);
	const transport = getTransport(url);

	return new Promise((resolve, reject) => {
		const outboundRequest = transport.request(
			url,
			{
				method: request.method,
				headers: request.headers
			},
			(outboundResponse) => {
				const chunks: Buffer[] = [];

				outboundResponse.on('data', (chunk) => {
					chunks.push(Buffer.from(chunk));
				});

				outboundResponse.on('end', () => {
					resolve({
						statusCode: outboundResponse.statusCode || 502,
						headers: outboundResponse.headers,
						body: Buffer.concat(chunks)
					});
				});
			}
		);

		outboundRequest.on('error', reject);

		if (request.body?.length) {
			outboundRequest.write(request.body);
		}

		outboundRequest.end();
	});
}

