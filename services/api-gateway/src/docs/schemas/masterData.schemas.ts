/**
 * ═══════════════════════════════════════════════════════════════
 *  Master Data Swagger schemas
 *  swagger-jsdoc auto-reads this file — just add new schemas here
 * ═══════════════════════════════════════════════════════════════
 *
 * @swagger
 * tags:
 *   - name: Master Data
 *     description: Dynamic dropdown options managed by Super Admin (board, medium, ownership, category, module)
 *
 * components:
 *   schemas:
 *     MasterDataItem:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 665abc0000000000000000a1
 *         type:
 *           type: string
 *           enum: [board, medium, ownership, category, module]
 *           example: board
 *         value:
 *           type: string
 *           example: cbse
 *         label:
 *           type: string
 *           example: CBSE
 *         description:
 *           type: string
 *           example: Central Board of Secondary Education
 *         displayOrder:
 *           type: integer
 *           example: 1
 *         metadata:
 *           type: object
 *         isDefault:
 *           type: boolean
 *           example: true
 *
 *     CreateMasterDataRequest:
 *       type: object
 *       required: [type, value, label]
 *       properties:
 *         type:
 *           type: string
 *           enum: [board, medium, ownership, category, module]
 *           example: board
 *         value:
 *           type: string
 *           example: new_board
 *           description: Unique slug (auto lowercased)
 *         label:
 *           type: string
 *           example: New Board
 *           description: Display label
 *         description:
 *           type: string
 *           example: A new education board
 *         displayOrder:
 *           type: integer
 *           example: 10
 *           default: 0
 *         metadata:
 *           type: object
 *
 *     UpdateMasterDataRequest:
 *       type: object
 *       properties:
 *         value:
 *           type: string
 *           example: updated_value
 *         label:
 *           type: string
 *           example: Updated Label
 *         description:
 *           type: string
 *           example: Updated description
 *         displayOrder:
 *           type: integer
 *           example: 5
 *         metadata:
 *           type: object
 *         isActive:
 *           type: boolean
 *           example: true
 */
