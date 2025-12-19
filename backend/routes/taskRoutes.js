const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { authenticateToken, authorizeManagerOrAdmin } = require('../middleware/auth');
const multer = require('multer');

const upload = multer({ dest: 'uploads/' });

router.get('/', authenticateToken, taskController.getAllTasks);
router.get('/:id', authenticateToken, taskController.getTaskById);
router.put('/:id', authenticateToken, upload.single('completion_photo'), taskController.updateTask);

module.exports = router;
