const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Setup Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // PERBAIKAN: Simpan file di dalam folder public/uploads agar dapat diakses secara publik.
        // __dirname akan merujuk ke 'backend/routes', jadi kita perlu naik dua level.
        const uploadPath = path.join(__dirname, '../../public/uploads');
        // Buat direktori jika belum ada
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Routes
router.get('/', authenticateToken, bookController.getAllBooks);
router.post('/', authenticateToken, upload.any(), bookController.createBook);
router.get('/:id', authenticateToken, bookController.getBookById);
router.delete('/:id', authenticateToken, bookController.deleteBook);

module.exports = router;
