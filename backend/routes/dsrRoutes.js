const express = require('express');
const router = express.Router();
const dsrController = require('../controllers/dsrController');
const { authenticateToken, authorizeAdmin } = require('../middleware/authMiddleware');

router.post('/budget', authenticateToken, authorizeAdmin, dsrController.saveBudgetDsr);
router.get('/budget', dsrController.getBudgetDsr);
router.post('/actual', authenticateToken, authorizeAdmin, dsrController.saveActualDsr);
router.get('/actual', authenticateToken, dsrController.getActualDsr);

module.exports = router;
