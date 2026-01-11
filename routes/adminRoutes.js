const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authController = require('../controllers/authController');

// Semua routes butuh authentication dan admin role
router.use(authController.verifyToken);
router.use(authController.isAdmin);

// Admin routes
router.get('/api-keys', adminController.getAllApiKeys);
router.delete('/api-keys/inactive', adminController.deleteInactiveApiKeys);
router.delete('/api-keys/:id', adminController.deleteApiKeyById);
router.get('/stats', adminController.getApiStats);
router.get('/users', adminController.getAllUsers);

module.exports = router;