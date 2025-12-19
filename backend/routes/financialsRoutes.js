const express = require('express');
const router = express.Router();
const financialsController = require('../controllers/financialsController');
const { authenticateToken, authorize } = require('../middleware/auth');

// Semua rute di bawah ini memerlukan otentikasi
router.use(authenticateToken);

// Rute yang memerlukan hak akses spesifik (manager/admin)
router.post('/budgets', authorize(['financials:pl:manage']), financialsController.createOrUpdateBudget);
router.post('/actuals', authorize(['financials:pl:manage']), financialsController.createOrUpdateActual);
router.post('/dsr/budget', authorize(['financials:dsr:manage']), financialsController.createOrUpdateDsrBudget);
router.post('/dsr/actual', authorize(['financials:dsr:manage']), financialsController.createOrUpdateDsrActual);
router.get('/dsr/opening-balances', authorize(['financials:dsr:manage']), financialsController.getOpeningBalances);
router.post('/dsr/opening-balance', authorize(['financials:dsr:manage']), financialsController.saveOpeningBalance);
router.post('/room-production', authorize(['financials:room_prod:manage']), financialsController.saveRoomProduction);
router.post('/ar-aging', authorize(['financials:ar_aging:manage']), financialsController.saveArAging);

// Rute yang dapat diakses oleh role lain (sesuai kebutuhan)
// Untuk saat ini, kita asumsikan semua GET bisa diakses oleh pengguna terotentikasi
router.get('/budgets', financialsController.getBudget);
router.get('/actuals', financialsController.getActual);
router.get('/dsr/budget', financialsController.getDsrBudget);
router.get('/dsr/actual', financialsController.getDsrActual);
router.get('/room-production', financialsController.getRoomProduction);
router.get('/ar-aging', financialsController.getArAging);
router.get('/ar-aging/summary', financialsController.getArAgingSummary);


module.exports = router;