const express = require('express');
const router = express.Router();
const dsrController = require('../controllers/dsrController');
const { authenticateToken, authorize } = require('../middleware/auth'); // Updated import
const hotelAccessMiddleware = require('../middleware/hotelAccess'); // New import

router.post('/budget', authenticateToken, authorize(['financials:dsr:manage']), hotelAccessMiddleware, dsrController.saveBudgetDsr);
router.get('/budget', authenticateToken, authorize(['menu:daily_income']), hotelAccessMiddleware, dsrController.getBudgetDsr);
router.post('/actual', authenticateToken, authorize(['financials:dsr:manage']), hotelAccessMiddleware, dsrController.saveActualDsr);
router.get('/actual', authenticateToken, authorize(['menu:daily_income']), hotelAccessMiddleware, dsrController.getActualDsr);

module.exports = router;
