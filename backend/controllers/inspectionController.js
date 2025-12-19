const pool = require('../config/db');
const fs = require('fs');

// --- Inspection Types & Items ---

// GET /api/inspection-types
exports.getAllInspectionTypes = async (req, res, next) => {
    try {
        const query = `
            SELECT
                it.id, it.name, it.created_at, it.updated_at,
                COUNT(ii.id)::int as item_count
            FROM inspection_types it
            LEFT JOIN inspection_items ii ON it.id = ii.inspection_type_id
            GROUP BY it.id
            ORDER BY it.name ASC;
        `;
        const { rows } = await pool.query(query);
        res.json(rows);
    } catch (err) {
        next(err);
    }
};

// POST /api/inspection-types
exports.createInspectionType = async (req, res, next) => {
    const { name } = req.body;
    if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'Nama tipe inspeksi tidak boleh kosong.' });
    }

    try {
        const { rows } = await pool.query(
            'INSERT INTO inspection_types (name) VALUES ($1) RETURNING *',
            [name.trim()]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        if (err.code === '23505') { // unique_violation
            res.status(409);
            err.message = 'Nama tipe inspeksi sudah ada.';
        }
        next(err);
    }
};

// PUT /api/inspection-types/:typeId
exports.updateInspectionType = async (req, res, next) => {
    const { typeId } = req.params;
    const { name } = req.body;

    if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'Nama tipe inspeksi tidak boleh kosong.' });
    }

    try {
        const { rows } = await pool.query(
            'UPDATE inspection_types SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
            [name.trim(), typeId]
        );
        if (rows.length === 0) {
            res.status(404);
            throw new Error('Tipe inspeksi tidak ditemukan.');
        }
        res.json(rows[0]);
    } catch (err) {
        if (err.code === '23505') { // unique_violation
            res.status(409);
            err.message = 'Nama tipe inspeksi sudah ada.';
        }
        next(err);
    }
};

// GET /api/inspection-types/:typeId/items
exports.getInspectionItemsByType = async (req, res, next) => {
    const { typeId } = req.params;
    try {
        const { rows } = await pool.query(
            'SELECT * FROM inspection_items WHERE inspection_type_id = $1 ORDER BY category, position, name',
            [typeId]
        );
        res.json(rows);
    } catch (err) {
        next(err);
    }
};

// POST /api/inspection-types/:typeId/items
exports.createInspectionItem = async (req, res, next) => {
    const { typeId } = req.params;
    const { name, category, standard } = req.body;

    if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'Nama item tidak boleh kosong.' });
    }

    try {
        const maxPosResult = await pool.query(
            'SELECT MAX(position) as max_pos FROM inspection_items WHERE inspection_type_id = $1 AND category = $2',
            [typeId, category || null]
        );
        const newPosition = (maxPosResult.rows[0].max_pos || 0) + 1;

        const { rows } = await pool.query(
            `INSERT INTO inspection_items (inspection_type_id, name, category, standard, position)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [typeId, name.trim(), category || null, standard || null, newPosition]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        if (err.code === '23503') {
            res.status(404);
            err.message = 'Tipe inspeksi tidak ditemukan.';
        }
        next(err);
    }
};

// GET /api/inspection-items/:itemId
exports.getInspectionItemById = async (req, res, next) => {
    const { itemId } = req.params;
    try {
        const { rows } = await pool.query('SELECT * FROM inspection_items WHERE id = $1', [itemId]);
        if (rows.length === 0) {
            res.status(404);
            throw new Error('Item checklist tidak ditemukan.');
        }
        res.json(rows[0]);
    } catch (err) {
        next(err);
    }
};

// PUT /api/inspection-items/:itemId
exports.updateInspectionItem = async (req, res, next) => {
    const { itemId } = req.params;
    const { name, category, standard } = req.body;

    if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'Nama item tidak boleh kosong.' });
    }

    try {
        const { rows } = await pool.query(
            'UPDATE inspection_items SET name = $1, category = $2, standard = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
            [name.trim(), category || null, standard || null, itemId]
        );
        if (rows.length === 0) {
            res.status(404);
            throw new Error('Item checklist tidak ditemukan.');
        }
        res.json(rows[0]);
    } catch (err) {
        next(err);
    }
};

// PUT /api/inspection-items/reorder
exports.reorderInspectionItems = async (req, res, next) => {
    const { orderedIds } = req.body;

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
        return res.status(400).json({ error: 'Data urutan (orderedIds) harus berupa array.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const caseClauses = orderedIds.map((id, index) => `WHEN id = ${parseInt(id, 10)} THEN ${index + 1}`).join(' ');
        const idList = orderedIds.map(id => parseInt(id, 10)).join(',');

        if (!idList) {
            return res.status(200).json({ message: 'Tidak ada item untuk diurutkan.' });
        }

        const query = `UPDATE inspection_items SET position = CASE ${caseClauses} END WHERE id IN (${idList});`;
        await client.query(query);

        await client.query('COMMIT');
        res.status(200).json({ message: 'Urutan item berhasil diperbarui.' });
    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
};

// --- Inspections ---

// GET /api/inspections
exports.getAllInspections = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        let selectClause = `
            SELECT i.id, i.inspection_date, i.status, i.score, h.name as hotel_name,
                   it.name as inspection_type_name, i.inspector_name, i.room_number_or_area, i.pic_name
        `;
        let fromClause = `
            FROM inspections i
            JOIN hotels h ON i.hotel_id = h.id
            JOIN inspection_types it ON i.inspection_type_id = it.id
        `;

        const whereClauses = [];
        const queryParams = [];
        let paramIndex = 1;

        if (req.user.role === 'staff') {
            const userHotelsResult = await pool.query('SELECT hotel_id FROM user_hotel_access WHERE user_id = $1', [req.user.id]);
            const userHotelIds = userHotelsResult.rows.map(row => row.hotel_id);
            if (userHotelIds.length > 0) {
                whereClauses.push(`i.hotel_id = ANY($${paramIndex++}::int[])`);
                queryParams.push(userHotelIds);
            } else {
                return res.json({ data: [], totalItems: 0, totalPages: 0, currentPage: 1 });
            }
        }

        const { hotelId, typeId, area, pic, status, startDate, endDate } = req.query;
        if (hotelId && hotelId !== 'all') { whereClauses.push(`i.hotel_id = $${paramIndex++}`); queryParams.push(hotelId); }
        if (typeId && typeId !== 'all') { whereClauses.push(`i.inspection_type_id = $${paramIndex++}`); queryParams.push(typeId); }
        if (area) { whereClauses.push(`i.room_number_or_area ILIKE $${paramIndex++}`); queryParams.push(`%${area}%`); }
        if (pic) { whereClauses.push(`i.pic_name ILIKE $${paramIndex++}`); queryParams.push(`%${pic}%`); }
        if (status && status !== 'all') { whereClauses.push(`i.status = $${paramIndex++}`); queryParams.push(status); }
        if (startDate) { whereClauses.push(`i.inspection_date >= $${paramIndex++}`); queryParams.push(startDate); }
        if (endDate) { whereClauses.push(`i.inspection_date <= $${paramIndex++}`); queryParams.push(endDate); }

        let whereString = whereClauses.length > 0 ? ` WHERE ${whereClauses.join(' AND ')}` : '';

        const countQuery = `SELECT COUNT(i.id) ${fromClause} ${whereString}`;
        const totalResult = await pool.query(countQuery, queryParams);
        const totalItems = parseInt(totalResult.rows[0].count, 10);
        const totalPages = Math.ceil(totalItems / limit);

        const dataQuery = `${selectClause} ${fromClause} ${whereString} ORDER BY i.inspection_date DESC, i.id DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        const dataParams = [...queryParams, limit, offset];
        const { rows } = await pool.query(dataQuery, dataParams);

        res.json({ data: rows, totalItems, totalPages, currentPage: page });
    } catch (err) {
        next(err);
    }
};

// GET /api/inspections/prepare
exports.prepareInspectionForm = async (req, res, next) => {
    const { hotelId, typeId } = req.query;

    if (!hotelId || !typeId) {
        return res.status(400).json({ error: 'Hotel ID dan Type ID diperlukan.' });
    }

    try {
        const [hotelResult, typeResult, itemsResult] = await Promise.all([
            pool.query('SELECT name FROM hotels WHERE id = $1', [hotelId]),
            pool.query('SELECT name FROM inspection_types WHERE id = $1', [typeId]),
            pool.query('SELECT id, name, category, standard, position FROM inspection_items WHERE inspection_type_id = $1 ORDER BY COALESCE(category, \'zzzzzz\'), position', [typeId])
        ]);

        if (hotelResult.rows.length === 0) {
            res.status(404);
            throw new Error('Hotel tidak ditemukan.');
        }
        if (typeResult.rows.length === 0) {
            res.status(404);
            throw new Error('Tipe inspeksi tidak ditemukan.');
        }

        const itemsByCategory = itemsResult.rows.reduce((acc, item) => {
            const category = item.category || 'Lain-lain';
            if (!acc[category]) acc[category] = [];
            acc[category].push(item);
            return acc;
        }, {});

        res.json({
            hotel_name: hotelResult.rows[0].name,
            inspection_type_name: typeResult.rows[0].name,
            checklist: itemsByCategory
        });
    } catch (err) {
        next(err);
    }
};

// POST /api/inspections
exports.createInspection = async (req, res, next) => {
    const { hotelId, inspectionTypeId, inspectorName } = req.body;

    if (!hotelId || !inspectionTypeId) {
        return res.status(400).json({ error: 'Hotel dan Tipe Inspeksi wajib diisi.' });
    }

    try {
        const { rows } = await pool.query(
            `INSERT INTO inspections (hotel_id, inspection_type_id, inspector_name, status)
             VALUES ($1, $2, $3, 'in_progress') RETURNING *`,
            [hotelId, inspectionTypeId, inspectorName || req.user.full_name]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        if (err.code === '23503') {
            res.status(404);
            err.message = 'Hotel atau Tipe Inspeksi tidak valid.';
        }
        next(err);
    }
};

// POST /api/inspections/draft
exports.createInspectionDraft = async (req, res, next) => {
    const { hotelId, typeId, inspectorName, answers, roomNumberOrArea } = req.body;

    if (!hotelId || !typeId) {
        return res.status(400).json({ error: 'Hotel dan Tipe Inspeksi wajib diisi.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const inspectionResult = await client.query(
            `INSERT INTO inspections (hotel_id, inspection_type_id, inspector_name, status, room_number_or_area)
             VALUES ($1, $2, $3, 'in_progress', $4) RETURNING id`,
            [hotelId, typeId, inspectorName || req.user.full_name, roomNumberOrArea]
        );
        const newInspectionId = inspectionResult.rows[0].id;

        if (Array.isArray(answers) && answers.length > 0) {
            const upsertQuery = `
                INSERT INTO inspection_results (inspection_id, item_id, result, notes)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (inspection_id, item_id)
                DO UPDATE SET result = EXCLUDED.result, notes = EXCLUDED.notes;
            `;
            for (const answer of answers) {
                await client.query(upsertQuery, [newInspectionId, answer.itemId, answer.answer, answer.remarks]);
            }
        }

        await client.query('COMMIT');
        res.status(201).json({
            message: 'Draf inspeksi berhasil dibuat.',
            inspectionId: newInspectionId
        });
    } catch (err) {
        await client.query('ROLLBACK');
        if (err.code === '23503') {
            res.status(404);
            err.message = 'Hotel atau Tipe Inspeksi tidak valid.';
        }
        next(err);
    } finally {
        client.release();
    }
};

// GET /api/inspections/:id
exports.getInspectionById = async (req, res, next) => {
    const { id } = req.params;
    try {
        const inspectionHeaderQuery = `
            SELECT i.*, h.name as hotel_name, it.name as inspection_type_name
            FROM inspections i
            JOIN hotels h ON i.hotel_id = h.id
            JOIN inspection_types it ON i.inspection_type_id = it.id
            WHERE i.id = $1;
        `;
        const headerResult = await pool.query(inspectionHeaderQuery, [id]);
        if (headerResult.rows.length === 0) {
            res.status(404);
            throw new Error('Inspeksi tidak ditemukan.');
        }
        const inspectionData = headerResult.rows[0];

        const itemsQuery = `
            SELECT ii.id, ii.name, ii.category, ii.standard,
                   ir.result as answer, ir.notes as remarks, ir.image_url as photo_url, ir.priority
            FROM inspection_items ii
            LEFT JOIN inspection_results ir ON ii.id = ir.item_id AND ir.inspection_id = $1
            WHERE ii.inspection_type_id = $2
            ORDER BY COALESCE(ii.category, 'zzzzzz'), ii.position;
        `;
        const itemsResult = await pool.query(itemsQuery, [id, inspectionData.inspection_type_id]);

        const itemsByCategory = itemsResult.rows.reduce((acc, item) => {
            const category = item.category || 'Lain-lain';
            if (!acc[category]) acc[category] = [];
            acc[category].push(item);
            return acc;
        }, {});

        res.json({ ...inspectionData, checklist: itemsByCategory });
    } catch (err) {
        next(err);
    }
};

// PUT /api/inspections/:id/draft
exports.updateInspectionDraft = async (req, res, next) => {
    const { id } = req.params;
    const { answers, roomNumberOrArea, pic } = req.body;

    if (!Array.isArray(answers)) return res.status(400).json({ error: 'Format data jawaban tidak valid.' });

    const checkResult = await pool.query('SELECT status FROM inspections WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
        res.status(404);
        return next(new Error('Inspeksi tidak ditemukan.'));
    }
    if (checkResult.rows[0].status !== 'in_progress') {
        res.status(403);
        return next(new Error('Hanya draf inspeksi yang bisa diperbarui.'));
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const upsertQuery = `
            INSERT INTO inspection_results (inspection_id, item_id, result, notes, priority)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (inspection_id, item_id)
            DO UPDATE SET result = EXCLUDED.result, notes = EXCLUDED.notes, priority = EXCLUDED.priority;
        `;
        for (const answer of answers) {
            await client.query(upsertQuery, [id, answer.itemId, answer.answer, answer.remarks || null, answer.priority || 'medium']);
        }

        await client.query(
            'UPDATE inspections SET room_number_or_area = $1, pic_name = $2, updated_at = NOW() WHERE id = $3',
            [roomNumberOrArea, pic, id]
        );

        await client.query('COMMIT');
        res.json({ message: 'Draf berhasil diperbarui.' });
    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
};

// PUT /api/inspections/:id/complete
exports.completeInspection = async (req, res, next) => {
    const { id } = req.params;
    const { answers, pic, roomNumberOrArea } = req.body;

    if (!Array.isArray(answers)) return res.status(400).json({ error: 'Format data jawaban tidak valid.' });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const upsertQuery = `
            INSERT INTO inspection_results (inspection_id, item_id, result, notes, priority)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (inspection_id, item_id)
            DO UPDATE SET result = EXCLUDED.result, notes = EXCLUDED.notes, priority = EXCLUDED.priority;
        `;
        for (const answer of answers) {
            await client.query(upsertQuery, [id, answer.itemId, answer.answer, answer.remarks || null, answer.priority || 'medium']);
        }

        let passCount = 0, failCount = 0;
        answers.forEach(ans => {
            if (ans.answer === 'pass') passCount++;
            if (ans.answer === 'fail') failCount++;
        });
        const totalScorable = passCount + failCount;
        const score = totalScorable > 0 ? (passCount / totalScorable) * 100 : 100;

        const inspectionDetails = await client.query('SELECT hotel_id FROM inspections WHERE id = $1', [id]);
        const { hotel_id } = inspectionDetails.rows[0];

        const failedItems = answers.filter(ans => ans.answer === 'fail');
        if (failedItems.length > 0) {
            const taskInsertQuery = `
                INSERT INTO inspection_tasks (inspection_id, item_id, hotel_id, description, notes, status, priority, assigned_to, created_at)
                SELECT $1, ii.id, $2, $3, ii.name, 'pending', $4, $5, NOW()
                FROM inspection_items ii WHERE ii.id = $6;
            `;
            for (const failedItem of failedItems) {
                await client.query(taskInsertQuery, [id, hotel_id, failedItem.remarks || 'Tidak ada catatan.', failedItem.priority || 'medium', pic || null, failedItem.itemId]);
            }
        }

        const updateInspectionQuery = `
            UPDATE inspections SET status = 'completed', score = $1, pic_name = $2, room_number_or_area = $3, updated_at = NOW()
            WHERE id = $4 RETURNING *;
        `;
        const { rows } = await client.query(updateInspectionQuery, [score.toFixed(2), pic || null, roomNumberOrArea, id]);

        await client.query('COMMIT');
        res.json({ message: 'Inspeksi berhasil diselesaikan.', inspection: rows[0] });
    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
};

// DELETE /api/inspections/:id
exports.deleteInspection = async (req, res, next) => {
    const { id } = req.params;
    if (!id || isNaN(id)) return res.status(400).json({ error: 'ID inspeksi tidak valid.' });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM inspection_tasks WHERE inspection_id = $1', [id]);
        await client.query('DELETE FROM inspection_results WHERE inspection_id = $1', [id]);
        const deleteInspectionResult = await client.query('DELETE FROM inspections WHERE id = $1', [id]);

        if (deleteInspectionResult.rowCount === 0) {
            await client.query('ROLLBACK');
            res.status(404);
            throw new Error('Inspeksi dengan ID tersebut tidak ditemukan.');
        }

        await client.query('COMMIT');
        res.status(204).send();
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
};

// POST /api/inspections/upload-photo
exports.uploadInspectionPhoto = async (req, res, next) => {
    const { inspectionId, itemId } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: 'Tidak ada file foto yang diupload.' });
    if (!inspectionId || !itemId) {
        fs.unlinkSync(file.path);
        return res.status(400).json({ error: 'Inspection ID dan Item ID diperlukan.' });
    }

    try {
        const imageUrl = file.path.replace(/\\/g, "/");
        const query = `
            INSERT INTO inspection_results (inspection_id, item_id, image_url)
            VALUES ($1, $2, $3)
            ON CONFLICT (inspection_id, item_id)
            DO UPDATE SET image_url = EXCLUDED.image_url
            RETURNING image_url;
        `;
        const { rows } = await pool.query(query, [inspectionId, itemId, imageUrl]);
        res.status(201).json({ message: 'Foto berhasil diupload.', imageUrl: rows[0].image_url });
    } catch (err) {
        next(err);
    }
};

// GET /api/inspections/dashboard
exports.getInspectionDashboardData = async (req, res, next) => {
    const { year, month, hotelId, brand } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
        // --- Base Filter Construction ---
        let hotelIdsToFilter = [];
        let filterApplied = false;

        // 1. Determine base hotels by role
        if (userRole === 'staff') {
            const userHotelsResult = await pool.query('SELECT hotel_id FROM user_hotel_access WHERE user_id = $1', [userId]);
            hotelIdsToFilter = userHotelsResult.rows.map(row => row.hotel_id);
            if (hotelIdsToFilter.length === 0) return res.json({ /* empty response */ });
        } else {
            const allHotelsResult = await pool.query('SELECT id FROM hotels');
            hotelIdsToFilter = allHotelsResult.rows.map(row => row.id);
        }

        // 2. Filter by brand if provided
        if (brand && brand !== 'all') {
            const brandHotelsResult = await pool.query('SELECT id FROM hotels WHERE brand = $1', [brand]);
            const brandHotelIds = new Set(brandHotelsResult.rows.map(row => row.id));
            hotelIdsToFilter = hotelIdsToFilter.filter(id => brandHotelIds.has(id));
            filterApplied = true;
        }

        // 3. Filter by specific hotelIds if provided
        if (hotelId) {
            const requestedHotelIds = new Set(hotelId.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id)));
            hotelIdsToFilter = hotelIdsToFilter.filter(id => requestedHotelIds.has(id));
            filterApplied = true;
        }

        // 4. Construct the final query clauses
        const baseHotelFilterParams = [];
        let baseHotelFilterClause = '';

        if (hotelIdsToFilter.length > 0) {
             baseHotelFilterClause = `AND i.hotel_id = ANY($1::int[])`;
             baseHotelFilterParams.push(hotelIdsToFilter);
        } else if (filterApplied) {
            // If filters were applied but resulted in an empty set, return no results.
            return res.json({
                stats: { totalInspections: 0, averageScore: 0, openTasks: 0, overdueTasks: 0 },
                scoreTrend: { labels: [], scores: [] },
                typeDistribution: { labels: [], counts: [] },
                taskPriority: { labels: [], counts: [] },
                recentActivity: []
            });
        }
        
        let baseYearFilterClause = '';
        let baseMonthFilterClause = '';
        const baseYear = year ? parseInt(year, 10) : null;
        const baseMonth = month && month !== 'all' ? parseInt(month, 10) : null;


        // --- 1. Fetch Stats (Total Inspections, Average Score) ---
        let statsParams = [...baseHotelFilterParams];
        let statsParamIndex = baseHotelFilterParams.length + 1;
        
        let currentStatsHotelFilterClause = baseHotelFilterClause.replace(/\$1/g, `\$${statsParamIndex - baseHotelFilterParams.length}`);
        let currentStatsYearFilterClause = baseYearFilterClause.replace(/\$\d+/g, `\$${statsParamIndex - baseHotelFilterParams.length + (baseYear ? 1 : 0)}`);
        let currentStatsMonthFilterClause = baseMonthFilterClause.replace(/\$\d+/g, `\$${statsParamIndex - baseHotelFilterParams.length + (baseMonth ? (baseYear ? 2 : 1) : 0)}`);

        const statsQuery = `
            SELECT
                COUNT(i.id)::int AS total_inspections,
                COALESCE(AVG(i.score), 0)::numeric(5,2) AS average_score
            FROM inspections i
            WHERE 1=1 ${currentStatsHotelFilterClause} ${currentStatsYearFilterClause} ${currentStatsMonthFilterClause};
        `;
        const statsResult = await pool.query(statsQuery, statsParams);
        const stats = statsResult.rows[0];

        // --- 1a. Fetch Stats (Open and Overdue Tasks) ---
        // Note: Task queries use 'it.created_at' and 'it.hotel_id'
        let taskParams = [];
        let taskParamIndex = 1;
        let taskHotelFilterClause = '';
        let taskYearFilterClause = '';
        let taskMonthFilterClause = '';

        const taskHotelIds = [];
        if (userRole === 'staff') {
            const userHotelsResult = await pool.query('SELECT hotel_id FROM user_hotel_access WHERE user_id = $1', [userId]);
            taskHotelIds.push(...userHotelsResult.rows.map(row => row.hotel_id));
        } else {
            if (hotelId) {
                taskHotelIds.push(...hotelId.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id)));
            } else if (brand && brand !== 'all') {
                const hotelsInBrand = await pool.query('SELECT id FROM hotels WHERE brand = $1', [brand]);
                taskHotelIds.push(...hotelsInBrand.rows.map(row => row.id));
            }
        }

        if (taskHotelIds.length > 0) {
            taskHotelFilterClause = `AND it.hotel_id = ANY($${taskParamIndex++}::int[])`;
            taskParams.push(taskHotelIds);
        } else {
            // If no hotel IDs are specified, ensure no tasks are returned by default filter.
            // This prevents an empty ANY() array error.
            taskHotelFilterClause = `AND false`; 
        }

        if (baseYear) {
            taskYearFilterClause = `AND EXTRACT(YEAR FROM it.created_at) = $${taskParamIndex++}`;
            taskParams.push(baseYear);
        }
        if (baseMonth) {
            taskMonthFilterClause = `AND EXTRACT(MONTH FROM it.created_at) = $${taskParamIndex++}`;
            taskParams.push(baseMonth);
        }

        const openTasksQuery = `
            SELECT COUNT(id)::int FROM inspection_tasks it
            WHERE status = 'pending' ${taskHotelFilterClause} ${taskYearFilterClause} ${taskMonthFilterClause};
        `;
        const openTasksResult = await pool.query(openTasksQuery, taskParams);
        stats.openTasks = openTasksResult.rows[0].count;

        const overdueTasksQuery = `
            SELECT COUNT(id)::int FROM inspection_tasks it
            WHERE status = 'pending' AND due_date < NOW() ${taskHotelFilterClause} ${taskYearFilterClause} ${taskMonthFilterClause};
        `;
        const overdueTasksResult = await pool.query(overdueTasksQuery, taskParams);
        stats.overdueTasks = overdueTasksResult.rows[0].count;

        // --- 2. Score Trend (Monthly/Daily) ---
        let scoreTrendLabels = [];
        let scoreTrendScores = [];
        let scoreTrendParams = [...baseHotelFilterParams]; // Start fresh for this query block
        let scoreTrendParamIndex = baseHotelFilterParams.length + 1;

        let currentScoreTrendHotelFilterClause = baseHotelFilterClause.replace(/\$1/g, `\$${scoreTrendParamIndex - baseHotelFilterParams.length}`);
        let currentScoreTrendYearFilterClause = baseYearFilterClause.replace(/\$\d+/g, `\$${scoreTrendParamIndex - baseHotelFilterParams.length + (baseYear ? 1 : 0)}`);
        let currentScoreTrendMonthFilterClause = baseMonthFilterClause.replace(/\$\d+/g, `\$${scoreTrendParamIndex - baseHotelFilterParams.length + (baseMonth ? (baseYear ? 2 : 1) : 0)}`);

        if (baseMonth) { // Daily trend for a specific month
            const dailyScoreQuery = `
                SELECT
                    EXTRACT(DAY FROM inspection_date) AS day,
                    COALESCE(AVG(score), 0)::numeric(5,2) AS average_score
                FROM inspections i
                WHERE 1=1 ${currentScoreTrendHotelFilterClause} ${currentScoreTrendYearFilterClause} ${currentScoreTrendMonthFilterClause}
                GROUP BY EXTRACT(DAY FROM inspection_date)
                ORDER BY day;
            `;
            const dailyScoreResult = await pool.query(dailyScoreQuery, scoreTrendParams);
            const daysInMonth = new Date(baseYear, baseMonth, 0).getDate();
            const dailyScoresMap = new Map(dailyScoreResult.rows.map(row => [parseInt(row.day), parseFloat(row.average_score)]));

            for (let day = 1; day <= daysInMonth; day++) {
                scoreTrendLabels.push(day.toString());
                scoreTrendScores.push(dailyScoresMap.get(day) || 0);
            }

        } else { // Monthly trend for a year
            const monthlyScoreQuery = `
                SELECT
                    EXTRACT(MONTH FROM inspection_date) AS month,
                    COALESCE(AVG(score), 0)::numeric(5,2) AS average_score
                FROM inspections i
                WHERE 1=1 ${currentScoreTrendHotelFilterClause} ${currentScoreTrendYearFilterClause}
                GROUP BY EXTRACT(MONTH FROM inspection_date)
                ORDER BY month;
            `;
            const monthlyScoreResult = await pool.query(monthlyScoreQuery, scoreTrendParams);
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
            const monthlyScoresMap = new Map(monthlyScoreResult.rows.map(row => [parseInt(row.month), parseFloat(row.average_score)]));

            for (let m = 1; m <= 12; m++) {
                scoreTrendLabels.push(monthNames[m - 1]);
                scoreTrendScores.push(monthlyScoresMap.get(m) || 0);
            }
        }

        // --- 3. Type Distribution ---
        let typeDistributionParams = [...baseHotelFilterParams];
        let typeDistributionParamIndex = baseHotelFilterParams.length + 1;

        let currentTypeDistributionHotelFilterClause = baseHotelFilterClause.replace(/\$1/g, `\$${typeDistributionParamIndex - baseHotelFilterParams.length}`);
        let currentTypeDistributionYearFilterClause = baseYearFilterClause.replace(/\$\d+/g, `\$${typeDistributionParamIndex - baseHotelFilterParams.length + (baseYear ? 1 : 0)}`);
        let currentTypeDistributionMonthFilterClause = baseMonthFilterClause.replace(/\$\d+/g, `\$${typeDistributionParamIndex - baseHotelFilterParams.length + (baseMonth ? (baseYear ? 2 : 1) : 0)}`);

        const typeDistributionQuery = `
            SELECT
                it.name AS type_name,
                COUNT(i.id)::int AS inspection_count
            FROM inspections i
            JOIN inspection_types it ON i.inspection_type_id = it.id
            WHERE 1=1 ${currentTypeDistributionHotelFilterClause} ${currentTypeDistributionYearFilterClause} ${currentTypeDistributionMonthFilterClause}
            GROUP BY it.name
            ORDER BY inspection_count DESC;
        `;
        const typeDistributionResult = await pool.query(typeDistributionQuery, typeDistributionParams);
        const typeDistribution = {
            labels: typeDistributionResult.rows.map(row => row.type_name),
            counts: typeDistributionResult.rows.map(row => row.inspection_count)
        };

        // --- 4. Task Priority Distribution ---
        let taskPriorityParams = [];
        taskParamIndex = 1; // Reset for this query block
        let taskPriorityHotelFilterClause = '';
        let taskPriorityYearFilterClause = '';
        let taskPriorityMonthFilterClause = '';

        if (taskHotelIds.length > 0) { // Reuse taskHotelIds computed earlier
            taskPriorityHotelFilterClause = `AND it.hotel_id = ANY($${taskParamIndex++}::int[])`;
            taskPriorityParams.push(taskHotelIds);
        }
        if (baseYear) {
            taskPriorityYearFilterClause = `AND EXTRACT(YEAR FROM it.created_at) = $${taskParamIndex++}`;
            taskPriorityParams.push(baseYear);
        }
        if (baseMonth) {
            taskPriorityMonthFilterClause = `AND EXTRACT(MONTH FROM it.created_at) = $${taskParamIndex++}`;
            taskPriorityParams.push(baseMonth);
        }

        const taskPriorityQuery = `
            SELECT
                priority,
                COUNT(id)::int AS task_count
            FROM inspection_tasks it
            WHERE 1=1 ${taskPriorityHotelFilterClause} ${taskPriorityYearFilterClause} ${taskPriorityMonthFilterClause} AND status = 'pending'
            GROUP BY priority
            ORDER BY CASE
                WHEN priority = 'high' THEN 1
                WHEN priority = 'medium' THEN 2
                WHEN priority = 'low' THEN 3
                ELSE 4
            END;
        `;
        const taskPriorityResult = await pool.query(taskPriorityQuery, taskPriorityParams);
        const taskPriority = {
            labels: taskPriorityResult.rows.map(row => row.priority),
            counts: taskPriorityResult.rows.map(row => row.task_count)
        };
        
        // --- 5. Recent Activity ---
        let recentActivityParams = [];
        let recentActivityParamIndex = 1;
        let recentActivityHotelFilterClause = '';
        let recentActivityYearFilterClause = '';
        let recentActivityMonthFilterClause = '';

        const recentActivityHotelIds = [];
        if (userRole === 'staff') {
            const userHotelsResult = await pool.query('SELECT hotel_id FROM user_hotel_access WHERE user_id = $1', [userId]);
            recentActivityHotelIds.push(...userHotelsResult.rows.map(row => row.hotel_id));
        } else {
            if (hotelId) {
                recentActivityHotelIds.push(...hotelId.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id)));
            } else if (brand && brand !== 'all') {
                const hotelsInBrand = await pool.query('SELECT id FROM hotels WHERE brand = $1', [brand]);
                recentActivityHotelIds.push(...hotelsInBrand.rows.map(row => row.id));
            }
        }

        if (recentActivityHotelIds.length > 0) {
            recentActivityHotelFilterClause = `AND hotel_id = ANY($${recentActivityParamIndex++}::int[])`;
            recentActivityParams.push(recentActivityHotelIds);
        } else {
            recentActivityHotelFilterClause = `AND false`;
        }
        if (baseYear) {
            recentActivityYearFilterClause = `AND EXTRACT(YEAR FROM timestamp) = $${recentActivityParamIndex++}`;
            recentActivityParams.push(baseYear);
        }
        if (baseMonth) {
            recentActivityMonthFilterClause = `AND EXTRACT(MONTH FROM timestamp) = $${recentActivityParamIndex++}`;
            recentActivityParams.push(baseMonth);
        }

        const recentActivityQuery = `
            (
                SELECT
                    i.id,
                    i.inspection_date AS timestamp,
                    'inspection' AS type,
                    h.name AS hotel_name,
                    i.room_number_or_area,
                    it.name AS item_name, -- This is actually inspection_type_name for inspections
                    NULL AS task_description,
                    i.status::TEXT AS status
                FROM inspections i
                JOIN hotels h ON i.hotel_id = h.id
                JOIN inspection_types it ON i.inspection_type_id = it.id
                WHERE 1=1 ${recentActivityHotelFilterClause.replace(/hotel_id/g, 'i.hotel_id')} ${recentActivityYearFilterClause.replace(/timestamp/g, 'i.inspection_date')} ${recentActivityMonthFilterClause.replace(/timestamp/g, 'i.inspection_date')} AND i.status = 'completed'
            )
            UNION ALL
            (
                SELECT
                    ist.id,
                    ist.created_at AS timestamp,
                    'task' AS type,
                    h.name AS hotel_name,
                    i.room_number_or_area,
                    ii.name AS item_name, -- Item that generated the task
                    ist.description AS task_description,
                    ist.status::TEXT AS status
                FROM inspection_tasks ist
                JOIN hotels h ON ist.hotel_id = h.id
                JOIN inspections i ON ist.inspection_id = i.id
                LEFT JOIN inspection_items ii ON ist.item_id = ii.id
                WHERE 1=1 ${recentActivityHotelFilterClause.replace(/hotel_id/g, 'ist.hotel_id')} ${recentActivityYearFilterClause.replace(/timestamp/g, 'ist.created_at')} ${recentActivityMonthFilterClause.replace(/timestamp/g, 'ist.created_at')} AND ist.status = 'pending' AND ist.priority = 'high'
            )
            ORDER BY timestamp DESC
            LIMIT 10;
        `;
        const recentActivityResult = await pool.query(recentActivityQuery, recentActivityParams);

        const recentActivity = recentActivityResult.rows.map(row => {
            const date = new Date(row.timestamp);
            const now = new Date();
            const diffSeconds = Math.floor((now - date) / 1000);
            let timeAgo = '';

            if (diffSeconds < 60) {
                timeAgo = `${diffSeconds} seconds ago`;
            } else if (diffSeconds < 3600) {
                timeAgo = `${Math.floor(diffSeconds / 60)} minutes ago`;
            } else if (diffSeconds < 86400) {
                timeAgo = `${Math.floor(diffSeconds / 3600)} hours ago`;
            } else {
                timeAgo = `${Math.floor(diffSeconds / 86400)} days ago`;
            }

            let icon = '';
            let iconBg = '';
            let iconColor = '';
            if (row.type === 'inspection') {
                icon = 'fa-clipboard-check';
                iconBg = 'bg-blue-100';
                iconColor = 'text-blue-600';
            } else { // task
                icon = 'fa-triangle-exclamation';
                iconBg = 'bg-red-100';
                iconColor = 'text-red-600';
            }

            return {
                ...row,
                time: timeAgo,
                icon,
                iconBg,
                iconColor
            };
        });

        res.json({
            stats: {
                totalInspections: parseInt(stats.total_inspections),
                averageScore: parseFloat(stats.average_score),
                openTasks: stats.openTasks,
                overdueTasks: stats.overdueTasks
            },
            scoreTrend: {
                labels: scoreTrendLabels,
                scores: scoreTrendScores
            },
            typeDistribution,
            taskPriority,
            recentActivity
        });

    } catch (err) {
        console.error('Error fetching inspection dashboard data:', err);
        next(err);
    }
};