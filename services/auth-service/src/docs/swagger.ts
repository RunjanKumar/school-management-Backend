export const authSwaggerDocument = {
	openapi: '3.0.3',
	info: {
		title: 'School Management Auth Service',
		version: '1.0.0',
		description: 'Authentication APIs for password login, Google login, session refresh, logout, and password reset.'
	},
	servers: [
		{
			url: 'http://localhost:3001',
			description: 'Auth service local URL'
		},
		{
			url: 'http://localhost:3000',
			description: 'API gateway local URL'
		}
	],
	tags: [
		{ name: 'Health' },
		{ name: 'Auth' },
		{ name: 'Internal' }
	],
	components: {
		securitySchemes: {
			bearerAuth: {
				type: 'http',
				scheme: 'bearer',
				bearerFormat: 'JWT'
			},
			internalApiKey: {
				type: 'apiKey',
				in: 'header',
				name: 'x-internal-key'
			}
		},
		schemas: {
			ApiSuccess: {
				type: 'object',
				properties: {
					statusCode: { type: 'integer', example: 200 },
					status: { type: 'boolean', example: true },
					message: { type: 'string', example: 'Login successful.' },
					type: { type: 'string', example: 'SUCCESS' },
					data: { type: 'object' }
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
			},
			AuthUser: {
				type: 'object',
				properties: {
					_id: { type: 'string', example: '6650f0000000000000000001' },
					email: { type: 'string', example: 'admin@school.com' },
					role: {
						type: 'string',
						enum: [ 'super_admin', 'school_admin', 'school_operator', 'teacher', 'parent', 'student', 'guest' ],
						example: 'super_admin'
					},
					schoolId: { type: 'string', nullable: true, example: null },
					profileRef: { type: 'string', nullable: true, example: null },
					profileModel: { type: 'string', nullable: true, example: null }
				}
			},
			LoginRequest: {
				type: 'object',
				required: [ 'email', 'password' ],
				properties: {
					email: { type: 'string', format: 'email', example: 'admin@school.com' },
					password: { type: 'string', format: 'password', example: 'superadmin123' },
					deviceId: { type: 'string', example: 'browser-device-id' }
				}
			},
			LoginResponse: {
				allOf: [
					{ $ref: '#/components/schemas/ApiSuccess' },
					{
						type: 'object',
						properties: {
							data: {
								type: 'object',
								properties: {
									token: { type: 'string', example: 'access-jwt' },
									refreshToken: { type: 'string', example: 'refresh-jwt' },
									sessionId: { type: 'string', example: '6650f0000000000000000002' },
									user: { $ref: '#/components/schemas/AuthUser' }
								}
							}
						}
					}
				]
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
			InternalValidateRequest: {
				type: 'object',
				required: [ 'token' ],
				properties: {
					token: { type: 'string', example: 'access-jwt' }
				}
			}
		}
	},
	paths: {
		'/health': {
			get: {
				tags: [ 'Health' ],
				summary: 'Check auth-service health',
				responses: {
					'200': { description: 'Service is healthy' }
				}
			}
		},
		'/v1/auth/login': {
			post: {
				tags: [ 'Auth' ],
				summary: 'Login with email and password',
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/LoginRequest' }
						}
					}
				},
				responses: {
					'200': {
						description: 'Login successful',
						content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } } }
					},
					'401': { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } } }
				}
			}
		},
		'/v1/auth/google': {
			post: {
				tags: [ 'Auth' ],
				summary: 'Login with a verified Google ID token',
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
				summary: 'Get the current logged-in user',
				security: [ { bearerAuth: [] } ],
				responses: {
					'200': { description: 'Profile fetched successfully', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } } },
					'401': { description: 'Missing or invalid token' }
				}
			}
		},
		'/v1/auth/logout': {
			post: {
				tags: [ 'Auth' ],
				summary: 'Logout and revoke a session',
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
				summary: 'Rotate refresh token and issue a new access token',
				requestBody: {
					required: true,
					content: { 'application/json': { schema: { $ref: '#/components/schemas/RefreshRequest' } } }
				},
				responses: {
					'200': { description: 'Token refreshed successfully' },
					'401': { description: 'Refresh token is invalid or expired' }
				}
			}
		},
		'/v1/auth/forgot-password': {
			post: {
				tags: [ 'Auth' ],
				summary: 'Create a password reset session',
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
				summary: 'Reset password using a reset token',
				requestBody: {
					required: true,
					content: { 'application/json': { schema: { $ref: '#/components/schemas/ResetPasswordRequest' } } }
				},
				responses: {
					'200': { description: 'Password reset successfully' },
					'401': { description: 'Reset token is invalid or expired' }
				}
			}
		},
		'/v1/internal/auth/validate': {
			post: {
				tags: [ 'Internal' ],
				summary: 'Validate access token and active session for gateway/service-to-service use',
				security: [ { internalApiKey: [] } ],
				requestBody: {
					required: true,
					content: { 'application/json': { schema: { $ref: '#/components/schemas/InternalValidateRequest' } } }
				},
				responses: {
					'200': { description: 'Token and session are valid' },
					'401': { description: 'Token or session is invalid' }
				}
			}
		}
	}
};
