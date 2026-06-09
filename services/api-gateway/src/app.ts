import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import config from './config';
import { gatewaySwaggerDocument } from './docs/swagger';
import { createAuthProxyMiddleware } from './routes/authProxy';
import { createSchoolProxyMiddleware } from './routes/schoolProxy';
import { createMasterDataProxyMiddleware } from './routes/masterDataProxy';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/authMiddleware';
import { roleGuard } from './middleware/roleGuard';
import { Constants } from '@school/common';

type GatewayAppOptions = {
	authServiceUrl?: string;
	schoolServiceUrl?: string;
	rateLimitWindowMs?: number;
	rateLimitMaxRequests?: number;
};

export function createGatewayApp(options: GatewayAppOptions = {}) {
	const app = express();

	app.use(cors());
	app.use(
		rateLimit({
			windowMs: options.rateLimitWindowMs || config.RATE_LIMIT_WINDOW_MS,
			max: options.rateLimitMaxRequests || config.RATE_LIMIT_MAX_REQUESTS,
			standardHeaders: true,
			legacyHeaders: false
		})
	);

	app.get('/swagger.json', (_request, response) => {
		response.status(200).json(gatewaySwaggerDocument);
	});
	app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(gatewaySwaggerDocument));

	/**
	 * @swagger
	 * /health:
	 *   get:
	 *     tags: [Health]
	 *     summary: Check api-gateway health
	 *     responses:
	 *       200:
	 *         description: Gateway is healthy
	 */
	app.get('/health', (_request, response) => {
		response.status(200).json({
			status: 'healthy',
			service: 'api-gateway',
			timestamp: new Date().toISOString(),
			uptime: process.uptime()
		});
	});

	const authProxyMiddleware = createAuthProxyMiddleware(options.authServiceUrl);
	const superAdminOnly = roleGuard([ Constants.USER_ROLES.SUPER_ADMIN ]);
	const schoolAdminOnly = roleGuard([ Constants.USER_ROLES.SCHOOL_ADMIN ]);
	const schoolReaders = roleGuard([ Constants.USER_ROLES.SUPER_ADMIN, Constants.USER_ROLES.SCHOOL_ADMIN ]);

	// ── Auth Routes ──────────────────────────────────────────

	/**
	 * @swagger
	 * /v1/auth/login:
	 *   post:
	 *     tags: [Auth]
	 *     summary: Login with email and password
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             $ref: '#/components/schemas/LoginRequest'
	 *     responses:
	 *       200:
	 *         description: Login successful
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/LoginResponse'
	 *       401:
	 *         description: Invalid credentials
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ApiError'
	 */

	/**
	 * @swagger
	 * /v1/auth/google:
	 *   post:
	 *     tags: [Auth]
	 *     summary: Login with Google
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             $ref: '#/components/schemas/GoogleLoginRequest'
	 *     responses:
	 *       200:
	 *         description: Login successful
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/LoginResponse'
	 *       403:
	 *         description: Google auto-create rejected for protected role
	 */

	/**
	 * @swagger
	 * /v1/auth/me:
	 *   get:
	 *     tags: [Auth]
	 *     summary: Get current user
	 *     security:
	 *       - bearerAuth: []
	 *     responses:
	 *       200:
	 *         description: Current user profile
	 *       401:
	 *         description: Missing or invalid token
	 */

	/**
	 * @swagger
	 * /v1/auth/logout:
	 *   post:
	 *     tags: [Auth]
	 *     summary: Logout and revoke session
	 *     security:
	 *       - bearerAuth: []
	 *     requestBody:
	 *       required: false
	 *       content:
	 *         application/json:
	 *           schema:
	 *             $ref: '#/components/schemas/LogoutRequest'
	 *     responses:
	 *       200:
	 *         description: Logged out successfully
	 */

	/**
	 * @swagger
	 * /v1/auth/refresh:
	 *   post:
	 *     tags: [Auth]
	 *     summary: Refresh access token
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             $ref: '#/components/schemas/RefreshRequest'
	 *     responses:
	 *       200:
	 *         description: Token refreshed successfully
	 *       401:
	 *         description: Invalid refresh token
	 */

	/**
	 * @swagger
	 * /v1/auth/forgot-password:
	 *   post:
	 *     tags: [Auth]
	 *     summary: Request password reset
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             $ref: '#/components/schemas/ForgotPasswordRequest'
	 *     responses:
	 *       200:
	 *         description: Password reset instructions response
	 */

	/**
	 * @swagger
	 * /v1/auth/reset-password:
	 *   post:
	 *     tags: [Auth]
	 *     summary: Reset password
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             $ref: '#/components/schemas/ResetPasswordRequest'
	 *     responses:
	 *       200:
	 *         description: Password reset successfully
	 *       401:
	 *         description: Invalid reset token
	 */

	/**
	 * @swagger
	 * /v1/auth/school-admins:
	 *   post:
	 *     tags: [Auth]
	 *     summary: Create a school admin (Super Admin only)
	 *     security:
	 *       - bearerAuth: []
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             type: object
	 *             required: [email, password, name]
	 *             properties:
	 *               email:
	 *                 type: string
	 *                 format: email
	 *               password:
	 *                 type: string
	 *                 format: password
	 *               name:
	 *                 type: string
	 *     responses:
	 *       201:
	 *         description: School admin created
	 *       401:
	 *         description: Unauthorized
	 *       403:
	 *         description: Forbidden — Super Admin only
	 */
	app.post('/v1/auth/school-admins', authMiddleware, superAdminOnly, authProxyMiddleware);
	app
		.route('/v1/auth/*')
		.delete(authProxyMiddleware)
		.get(authProxyMiddleware)
		.patch(authProxyMiddleware)
		.post(authProxyMiddleware)
		.put(authProxyMiddleware);

	// ── School Routes ────────────────────────────────────────

	/**
	 * @swagger
	 * /v1/schools:
	 *   get:
	 *     tags: [Schools]
	 *     summary: List all schools
	 *     description: Accessible by Super Admin and School Admin.
	 *     security:
	 *       - bearerAuth: []
	 *     responses:
	 *       200:
	 *         description: Schools fetched successfully
	 *       401:
	 *         description: Unauthorized
	 *   post:
	 *     tags: [Schools]
	 *     summary: Create a new school (School Admin only)
	 *     security:
	 *       - bearerAuth: []
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             type: object
	 *     responses:
	 *       201:
	 *         description: School created successfully
	 *       401:
	 *         description: Unauthorized
	 *       403:
	 *         description: Forbidden — School Admin only
	 */

	/**
	 * @swagger
	 * /v1/schools/{id}:
	 *   get:
	 *     tags: [Schools]
	 *     summary: Get school by ID
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - name: id
	 *         in: path
	 *         required: true
	 *         schema:
	 *           type: string
	 *     responses:
	 *       200:
	 *         description: School details
	 *       404:
	 *         description: School not found
	 *   put:
	 *     tags: [Schools]
	 *     summary: Update school (School Admin only)
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - name: id
	 *         in: path
	 *         required: true
	 *         schema:
	 *           type: string
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             type: object
	 *     responses:
	 *       200:
	 *         description: School updated successfully
	 *       403:
	 *         description: Forbidden
	 *       404:
	 *         description: School not found
	 *   delete:
	 *     tags: [Schools]
	 *     summary: Delete school (School Admin only)
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - name: id
	 *         in: path
	 *         required: true
	 *         schema:
	 *           type: string
	 *     responses:
	 *       200:
	 *         description: School deleted successfully
	 *       403:
	 *         description: Forbidden
	 *       404:
	 *         description: School not found
	 */

	const schoolProxyMiddleware = createSchoolProxyMiddleware(options.schoolServiceUrl);
	app
		.route('/v1/schools')
		.get(authMiddleware, schoolReaders, schoolProxyMiddleware)
		.post(authMiddleware, schoolAdminOnly, schoolProxyMiddleware);
	app
		.route('/v1/schools/*')
		.delete(authMiddleware, schoolAdminOnly, schoolProxyMiddleware)
		.get(authMiddleware, schoolReaders, schoolProxyMiddleware)
		.patch(authMiddleware, schoolAdminOnly, schoolProxyMiddleware)
		.post(authMiddleware, schoolAdminOnly, schoolProxyMiddleware)
		.put(authMiddleware, schoolAdminOnly, schoolProxyMiddleware);

	// ── Master Data Routes ───────────────────────────────────

	/**
	 * @swagger
	 * /v1/master-data:
	 *   get:
	 *     tags: [Master Data]
	 *     summary: Get all master data (grouped by type)
	 *     description: Returns all active master data grouped by type. Use query param `type` to filter. Accessible by Super Admin and School Admin.
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - name: type
	 *         in: query
	 *         required: false
	 *         schema:
	 *           type: string
	 *           enum: [board, medium, ownership, category, module]
	 *         description: Filter by master data type. Omit to get all types grouped.
	 *     responses:
	 *       200:
	 *         description: Master data fetched successfully
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 statusCode:
	 *                   type: integer
	 *                   example: 200
	 *                 status:
	 *                   type: boolean
	 *                   example: true
	 *                 message:
	 *                   type: string
	 *                   example: Master data fetched successfully.
	 *                 data:
	 *                   type: object
	 *                   properties:
	 *                     masterData:
	 *                       type: object
	 *       401:
	 *         description: Unauthorized
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ApiError'
	 *   post:
	 *     tags: [Master Data]
	 *     summary: Create a new master data option (Super Admin only)
	 *     description: Creates a new dropdown option. The `value` must be unique within its `type`.
	 *     security:
	 *       - bearerAuth: []
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             $ref: '#/components/schemas/CreateMasterDataRequest'
	 *     responses:
	 *       201:
	 *         description: Master data created successfully
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 statusCode:
	 *                   type: integer
	 *                   example: 201
	 *                 data:
	 *                   type: object
	 *                   properties:
	 *                     item:
	 *                       $ref: '#/components/schemas/MasterDataItem'
	 *       400:
	 *         description: Invalid type or validation error
	 *       401:
	 *         description: Unauthorized
	 *       403:
	 *         description: Forbidden — Super Admin only
	 *       409:
	 *         description: Duplicate value for type
	 */

	/**
	 * @swagger
	 * /v1/master-data/{id}:
	 *   put:
	 *     tags: [Master Data]
	 *     summary: Update a master data option (Super Admin only)
	 *     description: Updates label, description, displayOrder, metadata, or isActive. Cannot change `type` or `isDefault`.
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - name: id
	 *         in: path
	 *         required: true
	 *         schema:
	 *           type: string
	 *         description: Master data document ID
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             $ref: '#/components/schemas/UpdateMasterDataRequest'
	 *     responses:
	 *       200:
	 *         description: Master data updated successfully
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 data:
	 *                   type: object
	 *                   properties:
	 *                     item:
	 *                       $ref: '#/components/schemas/MasterDataItem'
	 *       400:
	 *         description: Invalid ID
	 *       401:
	 *         description: Unauthorized
	 *       403:
	 *         description: Forbidden — Super Admin only
	 *       404:
	 *         description: Master data not found
	 *   delete:
	 *     tags: [Master Data]
	 *     summary: Soft delete a master data option (Super Admin only)
	 *     description: Soft deletes the record. Default (seeded) items cannot be deleted — deactivate them instead.
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - name: id
	 *         in: path
	 *         required: true
	 *         schema:
	 *           type: string
	 *         description: Master data document ID
	 *     responses:
	 *       200:
	 *         description: Master data deleted successfully
	 *       400:
	 *         description: Invalid ID
	 *       401:
	 *         description: Unauthorized
	 *       403:
	 *         description: Cannot delete default master data
	 *       404:
	 *         description: Master data not found
	 */

	/**
	 * @swagger
	 * /v1/master-data/{id}/toggle:
	 *   patch:
	 *     tags: [Master Data]
	 *     summary: Toggle active/inactive status (Super Admin only)
	 *     description: Flips the `isActive` flag. Inactive items won't appear in frontend dropdowns.
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - name: id
	 *         in: path
	 *         required: true
	 *         schema:
	 *           type: string
	 *         description: Master data document ID
	 *     responses:
	 *       200:
	 *         description: Master data toggled successfully
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 data:
	 *                   type: object
	 *                   properties:
	 *                     item:
	 *                       $ref: '#/components/schemas/MasterDataItem'
	 *       400:
	 *         description: Invalid ID
	 *       401:
	 *         description: Unauthorized
	 *       403:
	 *         description: Forbidden — Super Admin only
	 *       404:
	 *         description: Master data not found
	 */

	const masterDataProxy = createMasterDataProxyMiddleware(options.schoolServiceUrl);
	const masterDataReaders = roleGuard([ Constants.USER_ROLES.SUPER_ADMIN, Constants.USER_ROLES.SCHOOL_ADMIN ]);
	app
		.route('/v1/master-data')
		.get(authMiddleware, masterDataReaders, masterDataProxy)
		.post(authMiddleware, superAdminOnly, masterDataProxy);
	app
		.route('/v1/master-data/*')
		.delete(authMiddleware, superAdminOnly, masterDataProxy)
		.get(authMiddleware, masterDataReaders, masterDataProxy)
		.patch(authMiddleware, superAdminOnly, masterDataProxy)
		.put(authMiddleware, superAdminOnly, masterDataProxy);

	app.use(errorHandler);

	return app;
}

export default createGatewayApp;
