const pool = require('../config/db');

/**
 * @desc    Get all checklist items grouped by category
 * @route   GET /api/audit-checklists
 * @access  Private
 */
const getChecklist = async (req, res) => {
    try {
        const categoriesResult = await pool.query('SELECT * FROM audit_checklist_categories ORDER BY position, name');
        const itemsResult = await pool.query('SELECT * FROM audit_checklist_items WHERE is_active = true ORDER BY position, name');

        const checklist = categoriesResult.rows.map(category => ({
            ...category,
            items: itemsResult.rows.filter(item => item.category_id === category.id)
        }));

        res.json(checklist);
    } catch (err) {
        console.error('Error fetching audit checklist:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @desc    Create a new checklist category
 * @route   POST /api/audit-checklists/categories
 * @access  Private (Admin)
 */
const createCategory = async (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ message: 'Nama kategori wajib diisi.' });
    }
    try {
        const { rows } = await pool.query(
            'INSERT INTO audit_checklist_categories (name) VALUES ($1) RETURNING *',
            [name]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('Error creating category:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @desc    Create a new checklist item
 * @route   POST /api/audit-checklists/items
 * @access  Private (Admin)
 */
const createItem = async (req, res) => {
    const { category_id, name, standard } = req.body;
    if (!category_id || !name) {
        return res.status(400).json({ message: 'Kategori dan nama item wajib diisi.' });
    }
    try {
        const { rows } = await pool.query(
            'INSERT INTO audit_checklist_items (category_id, name, standard) VALUES ($1, $2, $3) RETURNING *',
            [category_id, name, standard]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('Error creating item:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @desc    Get a single checklist item by ID
 * @route   GET /api/audit-checklists/items/:id
 * @access  Private (Admin)
 */
const getItemById = async (req, res) => {
    const { id } = req.params;
    try {
        const { rows } = await pool.query('SELECT * FROM audit_checklist_items WHERE id = $1', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Item tidak ditemukan.' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error(`Error fetching item ${id}:`, err.message);
        res.status(500).json({ message: 'Server error' });
    }
};
/**
 * @desc    Update a checklist item
 * @route   PUT /api/audit-checklists/items/:id
 * @access  Private (Admin)
 */
const updateItem = async (req, res) => {
    const { id } = req.params;
    const { category_id, name, standard, is_active } = req.body;
    if (!category_id || !name) {
        return res.status(400).json({ message: 'Kategori dan nama item wajib diisi.' });
    }
    try {
        const { rows } = await pool.query(
            `UPDATE audit_checklist_items 
             SET category_id = $1, name = $2, standard = $3, is_active = $4, updated_at = NOW()
             WHERE id = $5 RETURNING *`,
            [category_id, name, standard, is_active, id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Item tidak ditemukan.' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error(`Error updating item ${id}:`, err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @desc    Delete a checklist item
 * @route   DELETE /api/audit-checklists/items/:id
 * @access  Private (Admin)
 */
const deleteItem = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM audit_checklist_items WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Item tidak ditemukan.' });
        }
        res.status(204).send();
    } catch (err) {
        console.error(`Error deleting item ${id}:`, err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @desc    Update the order of checklist categories
 * @route   PUT /api/audit-checklists/categories/reorder
 * @access  Private (Admin)
 */
const updateCategoryOrder = async (req, res) => {
    const { orderedIds } = req.body; // Expecting an array of category IDs
    if (!Array.isArray(orderedIds)) {
        return res.status(400).json({ message: 'Payload harus berupa array ID.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        for (let i = 0; i < orderedIds.length; i++) {
            const categoryId = orderedIds[i];
            const position = i;
            await client.query('UPDATE audit_checklist_categories SET position = $1 WHERE id = $2', [position, categoryId]);
        }
        await client.query('COMMIT');
        res.status(200).json({ message: 'Urutan kategori berhasil diperbarui.' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error reordering categories:', err.message);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
};

/**
 * @desc    Update the order of checklist items within a category
 * @route   PUT /api/audit-checklists/items/reorder
 * @access  Private (Admin)
 */
const updateItemOrder = async (req, res) => {
    const { orderedIds } = req.body; // Expecting an array of item IDs
    if (!Array.isArray(orderedIds)) {
        return res.status(400).json({ message: 'Payload harus berupa array ID.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        for (let i = 0; i < orderedIds.length; i++) {
            const itemId = orderedIds[i];
            const position = i;
            await client.query('UPDATE audit_checklist_items SET position = $1 WHERE id = $2', [position, itemId]);
        }
        await client.query('COMMIT');
        res.status(200).json({ message: 'Urutan item berhasil diperbarui.' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error reordering items:', err.message);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
};

module.exports = {
    getChecklist,
    createCategory,
    createItem,
    getItemById,
    updateItem,
    deleteItem,
    updateCategoryOrder,
    updateItemOrder,
};
