const express = require('express');
const {
  listFavoritesHandler,
  createFavoriteHandler,
  getFavoriteByIdHandler,
  updateFavoriteHandler,
  deleteFavoriteHandler,
} = require('../controllers/favoritesController');

const router = express.Router();

/**
 * @swagger
 * /favorites:
 *   get:
 *     tags: [Favorites]
 *     summary: List all favorites
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [apod, mars, neo]
 *         description: Filter by resource type
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Full-text search on title, notes, and tags
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Paginated favorites list
 *
 *   post:
 *     tags: [Favorites]
 *     summary: Add a new favorite
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, nasaId, title]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [apod, mars, neo]
 *               nasaId:
 *                 type: string
 *               title:
 *                 type: string
 *               url:
 *                 type: string
 *               notes:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Favorite created
 *       409:
 *         description: Duplicate favorite
 */
router.route('/').get(listFavoritesHandler).post(createFavoriteHandler);

/**
 * @swagger
 * /favorites/{id}:
 *   get:
 *     tags: [Favorites]
 *     summary: Get a favorite by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Favorite found
 *       404:
 *         $ref: '#/components/schemas/Error'
 *
 *   patch:
 *     tags: [Favorites]
 *     summary: Update notes, tags, or title on a favorite
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               title:
 *                 type: string
 *     responses:
 *       200:
 *         description: Favorite updated
 *       404:
 *         $ref: '#/components/schemas/Error'
 *
 *   delete:
 *     tags: [Favorites]
 *     summary: Delete a favorite
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Favorite deleted
 *       404:
 *         $ref: '#/components/schemas/Error'
 */
router
  .route('/:id')
  .get(getFavoriteByIdHandler)
  .patch(updateFavoriteHandler)
  .delete(deleteFavoriteHandler);

module.exports = router;
