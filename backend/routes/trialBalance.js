const express = require('express');
const router = express.Router();
const trialBalanceController = require('../controllers/trialBalanceController');
const { authenticateToken, authorizeManagerOrAdmin } = require('../middleware/auth');

// Semua rute di bawah ini memerlukan otentikasi
router.use(authenticateToken);

// --- ENDPOINTS API ---

/**
 * GET /api/trial-balances
 * Mengambil semua data trial balance.
 */
router.get('/', trialBalanceController.getAllTrialBalances); // Bisa diakses semua role terotentikasi

/**
 * GET /api/trial-balances/:id
 * Mengambil satu data trial balance berdasarkan ID.
 */
router.get('/:id', trialBalanceController.getTrialBalanceById); // Bisa diakses semua role terotentikasi

/**
 * POST /api/trial-balances
 * Membuat data trial balance baru.
 */
router.post('/', authorizeManagerOrAdmin, trialBalanceController.createTrialBalance);

/**
 * PUT /api/trial-balances/reorder
 * Mengurutkan ulang posisi trial balance.
 */
router.put('/reorder', authorizeManagerOrAdmin, trialBalanceController.reorderTrialBalances);

/**
 * PUT /api/trial-balances/:id
 * Memperbarui data trial balance yang ada.
 */
router.put('/:id', authorizeManagerOrAdmin, trialBalanceController.updateTrialBalance);

/**
 * DELETE /api/trial-balances/:id
 * Menghapus data trial balance.
 */
router.delete('/:id', authorizeManagerOrAdmin, trialBalanceController.deleteTrialBalance);

module.exports = router;