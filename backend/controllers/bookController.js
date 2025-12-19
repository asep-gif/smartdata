const pool = require('../config/db');
const path = require('path');
const fs = require('fs');

const uploadDir = 'uploads';

// GET /api/books - Mengambil semua buku
exports.getAllBooks = async (req, res, next) => {
    try {
        const result = await pool.query('SELECT id, title, thumbnail_url, file_paths FROM books ORDER BY created_at DESC');
        const books = result.rows.map(book => {
            const thumbnailUrl = book.thumbnail_url ? `${req.protocol}://${req.get('host')}/uploads/${book.thumbnail_url}` : null;
            return { ...book, thumbnail_url: thumbnailUrl };
        });
        res.json(books);
    } catch (err) {
        next(err);
    }
};

// GET /api/books/:id - Mengambil satu buku
exports.getBookById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM books WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            res.status(404);
            throw new Error('Book not found');
        }
        const book = result.rows[0];
        if (book.file_paths && Array.isArray(book.file_paths)) {
            book.file_paths = book.file_paths.map(p => `${req.protocol}://${req.get('host')}/uploads/${p}`);
        }
        if (book.thumbnail_url) {
            book.thumbnail_url = `${req.protocol}://${req.get('host')}/uploads/${book.thumbnail_url}`;
        }
        res.json(book);
    } catch (err) {
        next(err);
    }
};

// POST /api/books - Membuat buku baru
exports.createBook = async (req, res, next) => {
    const { title, thumbnailData } = req.body;
    const files = req.files;

    if (!title || !files || files.length === 0) {
        return res.status(400).json({ error: 'Title and files are required' });
    }

    try {
        const filePaths = files.map(file => file.filename);
        let thumbnailUrl = null;

        if (thumbnailData) {
            const base64Data = thumbnailData.replace(/^data:image\/png;base64,/, "");
            const thumbFilename = `thumb-${Date.now()}.png`;
            const thumbPath = path.join(uploadDir, thumbFilename);
            fs.writeFileSync(thumbPath, base64Data, 'base64');
            thumbnailUrl = thumbFilename;
        } else {
            thumbnailUrl = filePaths[0];
        }

        const result = await pool.query(
            'INSERT INTO books (title, file_paths, thumbnail_url) VALUES ($1, $2::jsonb, $3) RETURNING *',
            [title, JSON.stringify(filePaths), thumbnailUrl]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (files && files.length > 0) {
            files.forEach(file => {
                if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
            });
        }
        next(err);
    }
};

// DELETE /api/books/:id - Menghapus buku
exports.deleteBook = async (req, res, next) => {
    const { id } = req.params;

    if (id === '0') {
        return res.status(204).send();
    }

    try {
        const bookResult = await pool.query('SELECT file_paths, thumbnail_url FROM books WHERE id = $1', [id]);
        if (bookResult.rows.length === 0) {
            res.status(404);
            throw new Error('Book not found');
        }
        const { file_paths: filePaths, thumbnail_url: thumbnailUrl } = bookResult.rows[0];

        await pool.query('DELETE FROM books WHERE id = $1', [id]);

        if (filePaths && Array.isArray(filePaths)) {
            filePaths.forEach(fileName => {
                const fullPath = path.join(uploadDir, fileName);
                if (fs.existsSync(fullPath)) {
                    fs.unlink(fullPath, (err) => {
                        if (err) console.error(`Failed to delete file: ${fullPath}`, err);
                    });
                }
            });
        }
        if (thumbnailUrl) {
            const thumbFullPath = path.join(uploadDir, thumbnailUrl);
            if (fs.existsSync(thumbFullPath)) {
                fs.unlink(thumbFullPath, (err) => {
                    if (err) console.error(`Failed to delete thumbnail file: ${thumbFullPath}`, err);
                });
            }
        }

        res.status(204).send();
    } catch (err) {
        next(err);
    }
};
