const favoritesService = require('../services/favoritesService');
const logger = require('../utils/logger');

const listFavoritesHandler = async (req, res, next) => {
  try {
    const data = await favoritesService.listFavorites(req.query);
    res.json({ success: true, data });
  } catch (error) {
    logger.error('List favorites error', { error: error.message });
    next(error);
  }
};

const createFavoriteHandler = async (req, res, next) => {
  try {
    const favorite = await favoritesService.createFavorite(req.body);
    res.status(201).json({ success: true, data: favorite });
  } catch (error) {
    logger.error('Create favorite error', { error: error.message });
    next(error);
  }
};

const getFavoriteByIdHandler = async (req, res, next) => {
  try {
    const favorite = await favoritesService.getFavoriteById(req.params.id);
    res.json({ success: true, data: favorite });
  } catch (error) {
    logger.error('Get favorite error', { error: error.message });
    next(error);
  }
};

const updateFavoriteHandler = async (req, res, next) => {
  try {
    const favorite = await favoritesService.updateFavorite(req.params.id, req.body);
    res.json({ success: true, data: favorite });
  } catch (error) {
    logger.error('Update favorite error', { error: error.message });
    next(error);
  }
};

const deleteFavoriteHandler = async (req, res, next) => {
  try {
    await favoritesService.deleteFavorite(req.params.id);
    res.json({ success: true, message: 'Favorite deleted successfully' });
  } catch (error) {
    logger.error('Delete favorite error', { error: error.message });
    next(error);
  }
};

module.exports = {
  listFavoritesHandler,
  createFavoriteHandler,
  getFavoriteByIdHandler,
  updateFavoriteHandler,
  deleteFavoriteHandler,
};
