const express = require('express');
const router = express.Router();
// const plController = require('../controllers/plController');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');

// router.post('/budget', authenticateToken, authorizeAdmin, plController.saveBudget);
// router.get('/budget', authenticateToken, plController.getBudget);
// router.post('/actual', authenticateToken, authorizeAdmin, plController.saveActual);
// router.get('/actual', authenticateToken, plController.getActual);

module.exports = router;
