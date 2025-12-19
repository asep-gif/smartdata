const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/auth');

router.get('/income-statement', authenticateToken, reportController.getIncomeStatement);
router.get('/hotel-achievement', authenticateToken, reportController.getHotelAchievement);
router.get('/room-division', authenticateToken, reportController.getRoomDivision);
router.get('/fnb-division', authenticateToken, reportController.getFnbDivision);
router.get('/monthly-hotel-summary', authenticateToken, reportController.getMonthlyHotelSummary);
router.get('/arr-by-company', authenticateToken, reportController.getArrByCompany);

module.exports = router;
