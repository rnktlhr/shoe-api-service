const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authController = require('../controllers/authController');

// Semua routes butuh authentication dan admin role
router.use(authController.verifyToken);
router.use(authController.isAdmin);

// API Keys
router.get('/api-keys', adminController.getAllApiKeys);
router.put('/api-keys/:id/toggle', adminController.toggleApiKeyStatus);
router.delete('/api-keys/inactive', adminController.deleteInactiveApiKeys);
router.delete('/api-keys/:id', adminController.deleteApiKeyById);

// Stats & Logs
router.get('/stats', adminController.getApiStats);
router.get('/logs', adminController.getActivityLogs);

// Users
router.get('/users', adminController.getAllUsers);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

module.exports = router;
