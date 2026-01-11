const express = require('express');
const router = express.Router();
const shoeController = require('../controllers/shoeController');

// Semua routes ini membutuhkan API Key
router.use(shoeController.validateApiKey);

// Public API Routes
router.get('/shoes', shoeController.getAllShoes);
router.get('/shoes/:id', shoeController.getShoeById);
router.get('/shoes/search', shoeController.searchShoes);
router.get('/categories', shoeController.getCategories);
router.get('/brands', shoeController.getBrands);

module.exports = router;