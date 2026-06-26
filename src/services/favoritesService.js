const Favorite = require('../models/Favorite');

/**
 * List all favorites with optional type filter and text search.
 */
const listFavorites = async ({ type, search, page = 1, limit = 20 } = {}) => {
  const query = {};
  if (type) query.type = type;
  if (search) query.$text = { $search: search };

  const skip = (Number(page) - 1) * Number(limit);
  const [favorites, total] = await Promise.all([
    Favorite.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Favorite.countDocuments(query),
  ]);

  return {
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)),
    favorites,
  };
};

/**
 * Create a favorite. Returns 409 if already exists.
 */
const createFavorite = async (payload) => {
  const { type, nasaId, title, url, notes, tags, metadata } = payload;

  // Check for duplicate
  const existing = await Favorite.findOne({ type, nasaId });
  if (existing) {
    const err = new Error(`This ${type} item is already in your favorites`);
    err.statusCode = 409;
    throw err;
  }

  const favorite = await Favorite.create({ type, nasaId, title, url, notes, tags, metadata });
  return favorite;
};

/**
 * Get a single favorite by its MongoDB _id.
 */
const getFavoriteById = async (id) => {
  const favorite = await Favorite.findById(id);
  if (!favorite) {
    const err = new Error('Favorite not found');
    err.statusCode = 404;
    throw err;
  }
  return favorite;
};

/**
 * Update notes and/or tags on a favorite.
 */
const updateFavorite = async (id, { notes, tags, title }) => {
  const updates = {};
  if (notes !== undefined) updates.notes = notes;
  if (tags !== undefined) updates.tags = tags;
  if (title !== undefined) updates.title = title;

  const favorite = await Favorite.findByIdAndUpdate(
    id,
    { $set: updates },
    { new: true, runValidators: true }
  );

  if (!favorite) {
    const err = new Error('Favorite not found');
    err.statusCode = 404;
    throw err;
  }

  return favorite;
};

/**
 * Delete a favorite by its MongoDB _id.
 */
const deleteFavorite = async (id) => {
  const favorite = await Favorite.findByIdAndDelete(id);
  if (!favorite) {
    const err = new Error('Favorite not found');
    err.statusCode = 404;
    throw err;
  }
  return favorite;
};

module.exports = {
  listFavorites,
  createFavorite,
  getFavoriteById,
  updateFavorite,
  deleteFavorite,
};
