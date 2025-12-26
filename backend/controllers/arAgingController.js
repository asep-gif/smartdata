const pool = require('../config/db');

// Whitelist of allowed tables and their columns for factory functions
const ALLOWED_TABLE_COLUMNS = {
    ar_aging: [
        'id', 'company_name', 'invoice_number', 'invoice_date', 'total_bill',
        'current', 'days_1_30', 'days_31_60', 'days_61_90', 'days_over_90', 'remarks',
        'hotel_id', 'year', 'month' // Include columns used for filtering/insertion
    ],
    // Add other tables as needed for other periodic data handlers
    // For example:
    // room_production: ['id', 'hotel_id', 'year', 'month', 'room_type', 'sold', 'revenue']
};

/**
 * Factory function untuk membuat handler yang mengambil data periodik (Room Prod & AR Aging).
 * @param {string} tableName - Nama tabel.
 * @param {string[]} columns - Kolom yang akan dipilih.
 * @param {string} [dateColumn] - Nama kolom tanggal jika ada (opsional).
 * @returns {Function} Express request handler.
 */
const getPeriodicDataHandler = (tableName, columns, dateColumn) => async (req, res, next) => {
    // Validate tableName against whitelist
    if (!ALLOWED_TABLE_COLUMNS[tableName]) {
        return next(new Error(`Invalid table name: ${tableName}`));
    }

    // Validate selected columns against whitelist for the specific table
    const allowedColumnsForTable = ALLOWED_TABLE_COLUMNS[tableName];
    const invalidColumns = columns.filter(col => !allowedColumnsForTable.includes(col));
    if (invalidColumns.length > 0) {
        return next(new Error(`Invalid column(s) for table ${tableName}: ${invalidColumns.join(', ')}`));
    }

    const { hotel_id, year, month } = req.query;
    // Deeper input validation
    if (!hotel_id || !year || !month) {
        return res.status(400).json({ error: 'Parameter hotel_id, year, dan month diperlukan.' });
    }
    const parsedHotelId = parseInt(hotel_id, 10);
    const parsedYear = parseInt(year, 10);
    const parsedMonth = parseInt(month, 10);

    if (isNaN(parsedHotelId) || isNaN(parsedYear) || isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
        return res.status(400).json({ error: 'Parameter hotel_id, year, dan month harus berupa angka valid (month antara 1-12).' });
    }
    
    try {
        let query;
        if (dateColumn) {
            query = `SELECT ${columns.join(', ')} FROM ${tableName} WHERE hotel_id = $1 AND EXTRACT(YEAR FROM ${dateColumn}) = $2 AND EXTRACT(MONTH FROM ${dateColumn}) = $3 ORDER BY id ASC;`;
        } else {
            query = `SELECT ${columns.join(', ')} FROM ${tableName} WHERE hotel_id = $1 AND year = $2 AND month = $3 ORDER BY id ASC;`;
        }
        const result = await pool.query(query, [parsedHotelId, parsedYear, parsedMonth]);
        res.json(result.rows);
    } catch (error) {
        next(error);
    }
};

/**
 * Factory function untuk membuat handler yang menyimpan data periodik (Room Prod & AR Aging).
 * Menggunakan strategi "hapus-lalu-sisipkan".
 * @param {object} config - Konfigurasi { tableName, columns, insertCheckColumn, successMessage }.
 * @returns {Function} Express request handler.
 */
const createPeriodicDataHandler = ({ tableName, columns, insertCheckColumn, successMessage }) => async (req, res, next) => {
    // Validate tableName against whitelist
    if (!ALLOWED_TABLE_COLUMNS[tableName]) {
        return next(new Error(`Invalid table name: ${tableName}`));
    }

    // Validate provided columns against whitelist for the specific table
    const allowedColumnsForTable = ALLOWED_TABLE_COLUMNS[tableName];
    const invalidColumns = columns.filter(col => !allowedColumnsForTable.includes(col));
    if (invalidColumns.length > 0) {
        return next(new Error(`Invalid column(s) for table ${tableName}: ${invalidColumns.join(', ')}`));
    }

    const { hotel_id, year, month, data } = req.body;
    
    // Deeper input validation for hotel_id, year, month
    if (!hotel_id || !year || !month || !Array.isArray(data)) {
        return res.status(400).json({ error: 'Data tidak lengkap. Parameter hotel_id, year, month, dan data (array) diperlukan.' });
    }

    const parsedHotelId = parseInt(hotel_id, 10);
    const parsedYear = parseInt(year, 10);
    const parsedMonth = parseInt(month, 10);

    if (isNaN(parsedHotelId) || isNaN(parsedYear) || isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
        return res.status(400).json({ error: 'Parameter hotel_id, year, dan month harus berupa angka valid (month antara 1-12).' });
    }

    // Validate each record in the data array
    for (const record of data) {
        // Basic check for required fields, adjust as per actual schema and requirements
        if (!record.company_name || !record.invoice_number || !record.total_bill) { // Add more required fields as necessary
            return res.status(400).json({ error: 'Setiap record data harus memiliki company_name, invoice_number, dan total_bill.' });
        }

        // Validate numeric fields
        const numericFields = ['total_bill', 'current', 'days_1_30', 'days_31_60', 'days_61_90', 'days_over_90'];
        for (const field of numericFields) {
            if (record[field] !== undefined && isNaN(parseFloat(record[field]))) {
                return res.status(400).json({ error: `Field '${field}' pada record harus berupa angka.` });
            }
        }

        // Validate invoice_date (assuming it's a date string)
        if (record.invoice_date && isNaN(new Date(record.invoice_date).getTime())) {
            return res.status(400).json({ error: 'invoice_date pada record harus berupa tanggal yang valid.' });
        }
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Gunakan EXTRACT untuk penghapusan jika ada kolom `date`
        const schemaInfo = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = '${tableName}' AND column_name = 'date'`);
        const hasDateColumn = schemaInfo.rowCount > 0;

        if (hasDateColumn) {
            await client.query(`DELETE FROM ${tableName} WHERE hotel_id = $1 AND EXTRACT(YEAR FROM date) = $2 AND EXTRACT(MONTH FROM date) = $3;`, [hotel_id, year, month]);
        } else {
            await client.query(`DELETE FROM ${tableName} WHERE hotel_id = $1 AND year = $2 AND month = $3;`, [hotel_id, year, month]);
        }


        if (data.length > 0) {
            const valuePlaceholders = columns.map((_, i) => `$${i + 1}`).join(', ');
            const insertQuery = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${valuePlaceholders});`;

            for (const record of data) {
                if (record[insertCheckColumn]) {
                    const values = columns.map(col => record[col]);
                    await client.query(insertQuery, values);
                }
            }
        }

        await client.query('COMMIT');
        res.status(201).json({ message: successMessage });
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
};

exports.getArAging = getPeriodicDataHandler('ar_aging', ['id', 'company_name', 'invoice_number', 'invoice_date', 'total_bill', 'current', 'days_1_30', 'days_31_60', 'days_61_90', 'days_over_90', 'remarks']);
exports.saveArAging = createPeriodicDataHandler({
    tableName: 'ar_aging',
    columns: ['hotel_id', 'year', 'month', 'company_name', 'invoice_number', 'invoice_date', 'total_bill', 'current', 'days_1_30', 'days_31_60', 'days_61_90', 'days_over_90', 'remarks'],
    insertCheckColumn: 'company_name', // Insert jika kolom 'company_name' ada isinya
    successMessage: 'Data AR Aging berhasil disimpan.'
});

/**
 * BARU: Menangani permintaan untuk ringkasan AR Aging per hotel.
 * GET /api/ar-aging/summary
 */
exports.getArAgingSummary = async (req, res, next) => {
    const { year, month } = req.query;

    if (!year || !month) {
        return res.status(400).json({ error: 'Parameter year dan month diperlukan.' });
    }

    const parsedYear = parseInt(year, 10);
    const parsedMonth = parseInt(month, 10);

    if (isNaN(parsedYear) || isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
        return res.status(400).json({ error: 'Parameter year dan month harus berupa angka valid (month antara 1-12).' });
    }

    try {
        const query = `
            SELECT 
                h.name AS hotel_name,
                SUM(ar.current) AS current,
                SUM(ar.days_1_30) AS days_1_30,
                SUM(ar.days_31_60) AS days_31_60,
                SUM(ar.days_61_90) AS days_61_90,
                SUM(ar.days_over_90) AS days_over_90
            FROM ar_aging ar
            JOIN hotels h ON ar.hotel_id = h.id
            WHERE ar.year = $1 AND ar.month = $2
            GROUP BY h.id, h.name
            ORDER BY h.name;
        `;
        const result = await pool.query(query, [parsedYear, parsedMonth]);
        
        // Konversi hasil BigInt dari SUM() ke Number/float jika perlu, karena JSON tidak mendukung BigInt
        const summary = result.rows.map(row => {
            for (const key in row) {
                if (typeof row[key] === 'bigint') {
                    row[key] = Number(row[key]);
                }
            }
            return row;
        });

        res.json(summary);
    } catch (error) {
        console.error('Error fetching AR Aging summary:', error);
        next(error);
    }
};