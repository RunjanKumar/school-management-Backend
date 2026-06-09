/**
 * ═══════════════════════════════════════════════════════════════
 *  Shared / Common Swagger schemas
 *  swagger-jsdoc auto-reads this file
 * ═══════════════════════════════════════════════════════════════
 *
 * @swagger
 * tags:
 *   - name: Health
 *     description: Gateway health check
 *   - name: Schools
 *     description: School CRUD operations
 *
 * components:
 *   schemas:
 *     ApiError:
 *       type: object
 *       properties:
 *         statusCode:
 *           type: integer
 *           example: 401
 *         status:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: Authentication failed
 *         type:
 *           type: string
 *           example: UNAUTHORIZED
 */
