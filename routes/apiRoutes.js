const express = require('express');
const router = express.Router();
const apiKeyController = require('../controllers/apiKeyController');
const authController = require('../controllers/authController');

// Semua routes butuh authentication
router.use(authController.verifyToken);

// Routes untuk API Key management
router.post('/generate', apiKeyController.generateApiKey);
router.get('/list', apiKeyController.listUserApiKeys);
router.delete('/:id', apiKeyController.deleteApiKey);
router.patch('/:id/toggle', apiKeyController.toggleApiKeyStatus);

module.exports = router;