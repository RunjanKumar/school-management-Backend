export const gatewaySwaggerDocument = {
	openapi: '3.0.3',
	info: {
		title: 'School Management API Gateway',
		version: '1.0.0',
		description: 'Frontend-facing API gateway documentation. Frontend clients should call these URLs, not internal services directly.'
	},
	servers: [
		{
			url: 'http://localhost:3000',
			description: 'API gateway local URL'
		}
	],
	tags: [
		{ name: 'Health' },
		{ name: 'Auth' }
	],
	components: {
		securitySchemes: {
			bearerAuth: {
				type: 'http',
				scheme: 'bearer',
				bearerFormat: 'JWT'
			}
		},
		schemas: {
			LoginRequest: {
				type: 'object',
				required: [ 'email', 'password' ],
				properties: {
					email: { type: 'string', format: 'email', example: 'admin@school.com' },
					password: { type: 'string', format: 'password', example: 'superadmin123' },
					deviceId: { type: 'string', example: 'browser-device-id' }
				}
			},
			GoogleLoginRequest: {
				type: 'object',
				required: [ 'idToken' ],
				properties: {
					idToken: { type: 'string', example: 'google-id-token-or-dev-google-token' },
					role: { type: 'string', enum: [ 'parent', 'student', 'guest' ], example: 'parent' },
					schoolCode: { type: 'string', example: 'ABC001' },
					deviceId: { type: 'string', example: 'browser-device-id' }
				}
			},
			RefreshRequest: {
				type: 'object',
				required: [ 'refreshToken' ],
				properties: {
					refreshToken: { type: 'string', example: 'refresh-jwt' }
				}
			},
			LogoutRequest: {
				type: 'object',
				properties: {
					token: { type: 'string', example: 'access-jwt' },
					refreshToken: { type: 'string', example: 'refresh-jwt' }
				}
			},
			ForgotPasswordRequest: {
				type: 'object',
				required: [ 'email' ],
				properties: {
					email: { type: 'string', format: 'email', example: 'admin@school.com' }
				}
			},
			ResetPasswordRequest: {
				type: 'object',
				required: [ 'token', 'password' ],
				properties: {
					token: { type: 'string', example: 'reset-token' },
					password: { type: 'string', format: 'password', example: 'NewPassword@123' }
				}
			},
			LoginResponse: {
				type: 'object',
				properties: {
					statusCode: { type: 'integer', example: 200 },
					status: { type: 'boolean', example: true },
					message: { type: 'string', example: 'Login successful.' },
					type: { type: 'string', example: 'SUCCESS' },
					data: {
						type: 'object',
						properties: {
							token: { type: 'string', example: 'access-jwt' },
							refreshToken: { type: 'string', example: 'refresh-jwt' },
							sessionId: { type: 'string', example: '6650f0000000000000000002' },
							user: {
								type: 'object',
								properties: {
									_id: { type: 'string', example: '6650f0000000000000000001' },
									email: { type: 'string', example: 'admin@school.com' },
									role: {
										type: 'string',
										enum: [ 'super_admin', 'school_admin', 'school_operator', 'teacher', 'parent', 'student', 'guest' ],
										example: 'super_admin'
									},
									schoolId: { type: 'string', nullable: true, example: null }
								}
							}
						}
					}
				}
			},
			ApiError: {
				type: 'object',
				properties: {
					statusCode: { type: 'integer', example: 401 },
					status: { type: 'boolean', example: false },
					message: { type: 'string', example: 'Authentication failed' },
					type: { type: 'string', example: 'UNAUTHORIZED' }
				}
			}
		}
	},
	paths: {
		'/health': {
			get: {
				tags: [ 'Health' ],
				summary: 'Check api-gateway health',
				responses: {
					'200': { description: 'Gateway is healthy' }
				}
			}
		},
		'/v1/auth/login': {
			post: {
				tags: [ 'Auth' ],
				summary: 'Login with email and password',
				requestBody: {
					required: true,
					content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } }
				},
				responses: {
					'200': { description: 'Login successful', content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } } } },
					'401': { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } } }
				}
			}
		},
		'/v1/auth/google': {
			post: {
				tags: [ 'Auth' ],
				summary: 'Login with Google',
				requestBody: {
					required: true,
					content: { 'application/json': { schema: { $ref: '#/components/schemas/GoogleLoginRequest' } } }
				},
				responses: {
					'200': { description: 'Login successful', content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } } } },
					'403': { description: 'Google auto-create rejected for protected role' }
				}
			}
		},
		'/v1/auth/me': {
			get: {
				tags: [ 'Auth' ],
				summary: 'Get current user',
				security: [ { bearerAuth: [] } ],
				responses: {
					'200': { description: 'Current user profile' },
					'401': { description: 'Missing or invalid token' }
				}
			}
		},
		'/v1/auth/logout': {
			post: {
				tags: [ 'Auth' ],
				summary: 'Logout and revoke session',
				security: [ { bearerAuth: [] } ],
				requestBody: {
					required: false,
					content: { 'application/json': { schema: { $ref: '#/components/schemas/LogoutRequest' } } }
				},
				responses: {
					'200': { description: 'Logged out successfully' }
				}
			}
		},
		'/v1/auth/refresh': {
			post: {
				tags: [ 'Auth' ],
				summary: 'Refresh access token',
				requestBody: {
					required: true,
					content: { 'application/json': { schema: { $ref: '#/components/schemas/RefreshRequest' } } }
				},
				responses: {
					'200': { description: 'Token refreshed successfully' },
					'401': { description: 'Invalid refresh token' }
				}
			}
		},
		'/v1/auth/forgot-password': {
			post: {
				tags: [ 'Auth' ],
				summary: 'Request password reset',
				requestBody: {
					required: true,
					content: { 'application/json': { schema: { $ref: '#/components/schemas/ForgotPasswordRequest' } } }
				},
				responses: {
					'200': { description: 'Password reset instructions response' }
				}
			}
		},
		'/v1/auth/reset-password': {
			post: {
				tags: [ 'Auth' ],
				summary: 'Reset password',
				requestBody: {
					required: true,
					content: { 'application/json': { schema: { $ref: '#/components/schemas/ResetPasswordRequest' } } }
				},
				responses: {
					'200': { description: 'Password reset successfully' },
					'401': { description: 'Invalid reset token' }
				}
			}
		}
	}
};
