const express = require('express');
const router = express.Router();
const competitorController = require('../controllers/competitorController');
const { authenticateToken, authorize } = require('../middleware/auth');

// Semua rute di bawah ini memerlukan otentikasi
router.use(authenticateToken);

router.get('/', competitorController.getCompetitorData);
router.post('/', authorize(['financials:competitor:manage']), competitorController.saveCompetitorData);

// Configuration Routes
router.get('/config/:hotel_id', competitorController.getCompetitorsConfig);
router.post('/config', authorize(['financials:competitor:manage', 'hotels:manage']), competitorController.addCompetitorConfig);
router.put('/config/:id', authorize(['financials:competitor:manage', 'hotels:manage']), competitorController.updateCompetitorConfig);
router.delete('/config/:id', authorize(['financials:competitor:manage', 'hotels:manage']), competitorController.deleteCompetitorConfig);
router.post('/config/reorder', authorize(['financials:competitor:manage', 'hotels:manage']), competitorController.reorderCompetitorsConfig);

module.exports = router;
