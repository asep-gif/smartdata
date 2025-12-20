const express = require('express');
const router = express.Router();
const financialsController = require('../controllers/financialsController');
const { authenticateToken, authorize } = require('../middleware/auth');
const hotelAccessMiddleware = require('../middleware/hotelAccess');

// Semua rute di bawah ini memerlukan otentikasi
router.use(authenticateToken);

// Rute yang memerlukan hak akses spesifik (manager/admin)
router.post('/budgets', authorize(['financials:pl:manage']), hotelAccessMiddleware, financialsController.createOrUpdateBudget);
router.post('/actuals', authorize(['financials:pl:manage']), hotelAccessMiddleware, financialsController.createOrUpdateActual);
router.post('/dsr/budget', authorize(['financials:dsr:manage']), hotelAccessMiddleware, financialsController.createOrUpdateDsrBudget);
router.post('/dsr/actual', authorize(['financials:dsr:manage']), hotelAccessMiddleware, financialsController.createOrUpdateDsrActual);
router.get('/dsr/opening-balances', authorize(['financials:dsr:manage']), financialsController.getOpeningBalances);
router.post('/dsr/opening-balance', authorize(['financials:dsr:manage']), hotelAccessMiddleware, financialsController.saveOpeningBalance);
router.post('/room-production', authorize(['financials:room_prod:manage']), hotelAccessMiddleware, financialsController.saveRoomProduction);
router.post('/ar-aging', authorize(['financials:ar_aging:manage']), hotelAccessMiddleware, financialsController.saveArAging);

// Rute yang dapat diakses oleh role lain (sesuai kebutuhan)
// Untuk saat ini, kita asumsikan semua GET bisa diakses oleh pengguna terotentikasi
router.get('/budgets', authorize(['submenu:input_budget_pl']), hotelAccessMiddleware, financialsController.getBudget);
router.get('/actuals', authorize(['submenu:input_actual_pl']), hotelAccessMiddleware, financialsController.getActual);
router.get('/dsr/budget', authorize(['submenu:input_budget_dsr']), hotelAccessMiddleware, financialsController.getDsrBudget);
router.get('/dsr/actual', authorize(['submenu:input_actual_dsr']), hotelAccessMiddleware, financialsController.getDsrActual);
router.get('/dsr/actual/range', authorize(['submenu:daily_income_dashboard']), hotelAccessMiddleware, financialsController.getDsrActualRange);
router.get('/room-production', authorize(['submenu:input_room_production']), hotelAccessMiddleware, financialsController.getRoomProduction);
router.get('/ar-aging', authorize(['submenu:input_ar_aging']), hotelAccessMiddleware, financialsController.getArAging);
router.get('/ar-aging/summary', authorize(['submenu:ar_summary']), hotelAccessMiddleware, financialsController.getArAgingSummary);


module.exports = router;