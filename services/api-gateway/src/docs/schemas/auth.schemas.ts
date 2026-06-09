/**
 * ═══════════════════════════════════════════════════════════════
 *  Auth-related Swagger schemas
 *  swagger-jsdoc auto-reads this file — just add new schemas here
 * ═══════════════════════════════════════════════════════════════
 *
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Authentication & session management
 *
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required: [email, password]
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: admin@school.com
 *         password:
 *           type: string
 *           format: password
 *           example: superadmin123
 *         deviceId:
 *           type: string
 *           example: browser-device-id
 *
 *     GoogleLoginRequest:
 *       type: object
 *       required: [idToken]
 *       properties:
 *         idToken:
 *           type: string
 *           example: google-id-token-or-dev-google-token
 *         role:
 *           type: string
 *           enum: [parent, student, guest]
 *           example: parent
 *         schoolCode:
 *           type: string
 *           example: ABC001
 *         deviceId:
 *           type: string
 *           example: browser-device-id
 *
 *     RefreshRequest:
 *       type: object
 *       required: [refreshToken]
 *       properties:
 *         refreshToken:
 *           type: string
 *           example: refresh-jwt
 *
 *     LogoutRequest:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *           example: access-jwt
 *         refreshToken:
 *           type: string
 *           example: refresh-jwt
 *
 *     ForgotPasswordRequest:
 *       type: object
 *       required: [email]
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: admin@school.com
 *
 *     ResetPasswordRequest:
 *       type: object
 *       required: [token, password]
 *       properties:
 *         token:
 *           type: string
 *           example: reset-token
 *         password:
 *           type: string
 *           format: password
 *           example: NewPassword@123
 *
 *     LoginResponse:
 *       type: object
 *       properties:
 *         statusCode:
 *           type: integer
 *           example: 200
 *         status:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Login successful.
 *         type:
 *           type: string
 *           example: SUCCESS
 *         data:
 *           type: object
 *           properties:
 *             token:
 *               type: string
 *               example: access-jwt
 *             refreshToken:
 *               type: string
 *               example: refresh-jwt
 *             sessionId:
 *               type: string
 *               example: 6650f0000000000000000002
 *             user:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   example: 6650f0000000000000000001
 *                 email:
 *                   type: string
 *                   example: admin@school.com
 *                 role:
 *                   type: string
 *                   enum: [super_admin, school_admin, school_operator, teacher, parent, student, guest]
 *                   example: super_admin
 *                 schoolId:
 *                   type: string
 *                   nullable: true
 *                   example: null
 */
