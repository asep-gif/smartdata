const express = require('express');
const router = express.Router();
const slideController = require('../controllers/slideController');
const { authenticateToken, authorizeManagerOrAdmin } = require('../middleware/auth');

router.get('/', authenticateToken, slideController.getAllSlides);
router.post('/', authenticateToken, authorizeManagerOrAdmin, slideController.createSlide);

// Rute ini harus didefinisikan SEBELUM '/:id' agar 'reorder' tidak dianggap sebagai ID.
router.put('/reorder', authenticateToken, authorizeManagerOrAdmin, slideController.reorderSlides);

router.get('/:id', authenticateToken, slideController.getSlideById);
router.put('/:id', authenticateToken, authorizeManagerOrAdmin, slideController.updateSlide);
router.delete('/:id', authenticateToken, authorizeManagerOrAdmin, slideController.deleteSlide);

module.exports = router;