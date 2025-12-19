const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const inspectionController = require('../controllers/inspectionController'); // Kita butuh ini untuk dashboard inspeksi
const { authenticateToken } = require('../middleware/auth');

// Rute utama untuk statistik keuangan dashboard
// GET /api/dashboard/stats
router.get('/stats', authenticateToken, dashboardController.getDashboardStats);

// Rute untuk ringkasan P&L per hotel di dashboard
// GET /api/dashboard/pl-summary
router.get('/pl-summary', authenticateToken, dashboardController.getPlSummary);

// Rute untuk ringkasan pendapatan harian di dashboard
// GET /api/dashboard/daily-income-summary
router.get('/daily-income-summary', authenticateToken, dashboardController.getDailyIncomeSummary);

module.exports = router;