const express = require('express');
const router = express.Router();
const hotelController = require('../controllers/hotelController');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');

// Semua rute di bawah ini memerlukan pengguna untuk login (terotentikasi)
router.use(authenticateToken);

// GET /api/hotels - Dapat diakses oleh semua role yang sudah login
router.get('/', hotelController.getAllHotels);

// Rute di bawah ini hanya dapat diakses oleh admin
router.post('/', authorizeAdmin, hotelController.createHotel);
router.get('/:id', authorizeAdmin, hotelController.getHotelById);
router.put('/:id', authorizeAdmin, hotelController.updateHotel);
router.delete('/:id', authorizeAdmin, hotelController.deleteHotel);

module.exports = router;