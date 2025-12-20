const pool = require('../config/db');

const getCompetitorData = async (req, res, next) => {
    const { hotel_id, startDate, endDate } = req.query;
    if (!hotel_id || !startDate || !endDate) {
        return res.status(400).json({ message: 'Hotel ID dan rentang tanggal wajib diisi.' });
    }
    try {
        if (startDate === endDate) {
            // Single day fetch, no aggregation
            const { rows } = await pool.query(
                'SELECT * FROM hotel_competitor_data WHERE hotel_id = $1 AND date = $2',
                [hotel_id, startDate]
            );
            res.json(rows);
        } else {
            // Date range fetch, needs aggregation
            const query = `
                SELECT
                    competitor_name,
                    AVG(number_of_rooms)::numeric(10,0) as number_of_rooms,
                    SUM(room_available) as room_available,
                    SUM(room_sold) as room_sold,
                    SUM(revenue) as revenue,
                    (SUM(revenue) / NULLIF(SUM(room_sold), 0))::numeric(15,2) as arr
                FROM hotel_competitor_data
                WHERE hotel_id = $1 AND date BETWEEN $2 AND $3
                GROUP BY competitor_name;
            `;
            const { rows } = await pool.query(query, [hotel_id, startDate, endDate]);
            res.json(rows);
        }
    } catch (error) {
        next(error);
    }
};

const saveCompetitorData = async (req, res, next) => {
    const { hotel_id, date, data } = req.body;
    if (!hotel_id || !date || !Array.isArray(data)) {
        return res.status(400).json({ message: 'Data tidak lengkap.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const competitorNamesInPayload = data.map(d => d.competitor_name).filter(Boolean);

        if (competitorNamesInPayload.length > 0) {
            const deleteQuery = `
                DELETE FROM hotel_competitor_data
                WHERE hotel_id = $1 AND date = $2 AND competitor_name NOT IN (${competitorNamesInPayload.map((_, i) => `$${i + 3}`).join(',')})
            `;
            await client.query(deleteQuery, [hotel_id, date, ...competitorNamesInPayload]);
        } else {
            await client.query('DELETE FROM hotel_competitor_data WHERE hotel_id = $1 AND date = $2', [hotel_id, date]);
        }

        const upsertQuery = `
            INSERT INTO hotel_competitor_data (
                hotel_id, date, competitor_name, number_of_rooms, room_available, room_sold, arr,
                occupancy_percent, revenue, revpar, mpi, ari, rgi, rank_mpi
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            ON CONFLICT (hotel_id, date, competitor_name)
            DO UPDATE SET
                number_of_rooms = EXCLUDED.number_of_rooms,
                room_available = EXCLUDED.room_available,
                room_sold = EXCLUDED.room_sold,
                arr = EXCLUDED.arr,
                occupancy_percent = EXCLUDED.occupancy_percent,
                revenue = EXCLUDED.revenue,
                revpar = EXCLUDED.revpar,
                mpi = EXCLUDED.mpi,
                ari = EXCLUDED.ari,
                rgi = EXCLUDED.rgi,
                rank_mpi = EXCLUDED.rank_mpi,
                updated_at = NOW();
        `;

        for (const record of data) {
            if (record.competitor_name) {
                await client.query(upsertQuery, [
                    hotel_id,
                    date,
                    record.competitor_name,
                    record.number_of_rooms || null,
                    record.room_available || null,
                    record.room_sold || null,
                    record.arr || null,
                    record.occupancy_percent || null,
                    record.revenue || null,
                    record.revpar || null,
                    record.mpi || null,
                    record.ari || null,
                    record.rgi || null,
                    record.rank_mpi || null
                ]);
            }
        }

        await client.query('COMMIT');
        res.status(201).json({ message: 'Data kompetitor berhasil disimpan.' });
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
};

const getCompetitorsConfig = async (req, res, next) => {
    const { hotel_id } = req.params;
    try {
        const { rows } = await pool.query(
            'SELECT * FROM hotel_competitors WHERE hotel_id = $1 ORDER BY display_order ASC NULLS LAST, id ASC',
            [hotel_id]
        );
        res.json(rows);
    } catch (error) {
        next(error);
    }
};

const addCompetitorConfig = async (req, res, next) => {
    const { hotel_id, competitor_name, number_of_rooms } = req.body;
    if (!hotel_id || !competitor_name) {
        return res.status(400).json({ message: 'Hotel ID dan nama kompetitor wajib diisi.' });
    }
    try {
        const { rows } = await pool.query(
            'INSERT INTO hotel_competitors (hotel_id, competitor_name, number_of_rooms) VALUES ($1, $2, $3) ON CONFLICT (hotel_id, competitor_name) DO NOTHING RETURNING *',
            [hotel_id, competitor_name, number_of_rooms || null]
        );
        if (rows.length === 0) {
            return res.status(409).json({ message: 'Kompetitor sudah ada untuk hotel ini.' });
        }
        res.status(201).json(rows[0]);
    } catch (error) {
        next(error);
    }
};

const deleteCompetitorConfig = async (req, res, next) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM hotel_competitors WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Konfigurasi kompetitor tidak ditemukan.' });
        }
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};

const reorderCompetitorsConfig = async (req, res, next) => {
    const { hotel_id, ordered_ids } = req.body;
    if (!hotel_id || !Array.isArray(ordered_ids)) {
        return res.status(400).json({ message: 'Data tidak lengkap.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        for (let i = 0; i < ordered_ids.length; i++) {
            const id = ordered_ids[i];
            const order = i + 1;
            await client.query(
                'UPDATE hotel_competitors SET display_order = $1 WHERE id = $2 AND hotel_id = $3',
                [order, id, hotel_id]
            );
        }
        await client.query('COMMIT');
        res.status(200).json({ message: 'Urutan berhasil diperbarui.' });
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
};

const updateCompetitorConfig = async (req, res, next) => {
    const { id } = req.params;
    const { number_of_rooms } = req.body;

    // Validasi: number_of_rooms bisa 0, jadi cek undefined/null
    if (number_of_rooms === undefined || number_of_rooms === null) {
        return res.status(400).json({ message: 'Jumlah kamar wajib diisi.' });
    }

    try {
        const { rows } = await pool.query(
            'UPDATE hotel_competitors SET number_of_rooms = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
            [number_of_rooms, id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Konfigurasi kompetitor tidak ditemukan.' });
        }

        res.json(rows[0]);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getCompetitorData,
    saveCompetitorData,
    getCompetitorsConfig,
    addCompetitorConfig,
    deleteCompetitorConfig,
    reorderCompetitorsConfig,
    updateCompetitorConfig,
};