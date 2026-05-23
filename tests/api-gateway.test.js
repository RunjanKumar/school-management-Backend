require('ts-node/register');

const assert = require('node:assert/strict');
const http = require('node:http');
const test = require('node:test');

process.env.INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'test-internal-key';
process.env.AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service.test';

const { createGatewayApp } = require('../services/api-gateway/src/app');
const { createAuthMiddleware } = require('../services/api-gateway/src/middleware/authMiddleware');

function collectRoutes(app) {
	const registeredRoutes = [];

	const walk = (stack) => {
		for (const layer of stack) {
			if (layer.route) {
				registeredRoutes.push({
					path: layer.route.path,
					methods: Object.keys(layer.route.methods).sort()
				});
			}

			if (layer.name === 'router' && layer.handle?.stack) {
				walk(layer.handle.stack);
			}
		}
	};

	walk(app._router.stack);
	return registeredRoutes;
}

test('api-gateway exposes health and auth proxy catch-all routes', () => {
	const app = createGatewayApp();

	assert.deepEqual(collectRoutes(app), [
		{ path: '/health', methods: [ 'get' ] },
		{ path: '/v1/auth/*', methods: [ 'delete', 'get', 'patch', 'post', 'put' ] }
	]);
});

test('api-gateway auth middleware validates token and injects downstream headers', async () => {
	const middleware = createAuthMiddleware({
		authServiceUrl: 'http://auth-service.test',
		internalApiKey: 'test-internal-key',
		validateToken: async (token, internalKey) => {
			assert.equal(token, 'valid-token');
			assert.equal(internalKey, 'test-internal-key');
			return {
				valid: true,
				userId: 'user-1',
				role: 'teacher',
				schoolId: 'school-1',
				sessionId: 'session-1'
			};
		}
	});

	const request = {
		headers: {
			authorization: 'Bearer valid-token'
		}
	};
	let statusCode = 0;
	let responseBody;
	const response = {
		status(code) {
			statusCode = code;
			return this;
		},
		json(body) {
			responseBody = body;
			return this;
		}
	};

	let nextCalled = false;
	await middleware(request, response, () => {
		nextCalled = true;
	});

	assert.equal(nextCalled, true);
	assert.equal(statusCode, 0);
	assert.equal(responseBody, undefined);
	assert.equal(request.headers['x-user-id'], 'user-1');
	assert.equal(request.headers['x-user-role'], 'teacher');
	assert.equal(request.headers['x-school-id'], 'school-1');
	assert.equal(request.headers['x-session-id'], 'session-1');
});

test('api-gateway auth middleware rejects missing or invalid tokens', async () => {
	const middleware = createAuthMiddleware({
		authServiceUrl: 'http://auth-service.test',
		internalApiKey: 'test-internal-key',
		validateToken: async () => ({ valid: false })
	});

	const request = { headers: {} };
	let statusCode = 0;
	let responseBody;
	const response = {
		status(code) {
			statusCode = code;
			return this;
		},
		json(body) {
			responseBody = body;
			return this;
		}
	};

	await middleware(request, response, () => {
		throw new Error('next should not be called');
	});

	assert.equal(statusCode, 401);
	assert.equal(responseBody.status, false);
	assert.equal(responseBody.type, 'UNAUTHORIZED');
});

test('api-gateway proxies requests to the configured target service', async () => {
	const targetServer = http.createServer((request, response) => {
		assert.equal(request.method, 'POST');
		assert.equal(request.url, '/v1/auth/login');
		assert.equal(request.headers['content-type'], 'application/json');

		let body = '';
		request.on('data', (chunk) => {
			body += chunk.toString();
		});
		request.on('end', () => {
			assert.deepEqual(JSON.parse(body), { email: 'admin@example.com' });
			response.writeHead(201, { 'content-type': 'application/json' });
			response.end(JSON.stringify({ status: true, proxied: true }));
		});
	});

	await new Promise((resolve) => targetServer.listen(0, '127.0.0.1', resolve));
	const { port } = targetServer.address();

	try {
		const app = createGatewayApp({
			authServiceUrl: `http://127.0.0.1:${port}`
		});
		const gatewayServer = http.createServer(app);
		await new Promise((resolve) => gatewayServer.listen(0, '127.0.0.1', resolve));
		const gatewayPort = gatewayServer.address().port;

		try {
			const result = await fetch(`http://127.0.0.1:${gatewayPort}/v1/auth/login`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ email: 'admin@example.com' })
			});

			assert.equal(result.status, 201);
			assert.deepEqual(await result.json(), { status: true, proxied: true });
		} finally {
			await new Promise((resolve) => gatewayServer.close(resolve));
		}
	} finally {
		await new Promise((resolve) => targetServer.close(resolve));
	}
});

