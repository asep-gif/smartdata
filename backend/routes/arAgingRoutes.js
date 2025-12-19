const express = require('express');
const router = express.Router();
const arAgingController = require('../controllers/arAgingController');
const { authenticateToken, authorizeAdmin } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, arAgingController.getArAging);
router.post('/', authenticateToken, authorizeAdmin, arAgingController.saveArAging);

// BARU: Route untuk mendapatkan ringkasan AR Aging
router.get('/summary', authenticateToken, arAgingController.getArAgingSummary);

module.exports = router;
