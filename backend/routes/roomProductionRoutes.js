const express = require('express');
const router = express.Router();
// const roomProductionController = require('../controllers/roomProductionController');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');

// router.get('/', authenticateToken, authorizeAdmin, roomProductionController.getRoomProduction);
// router.post('/', authenticateToken, authorizeAdmin, roomProductionController.saveRoomProduction);

module.exports = router;
