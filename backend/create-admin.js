require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// --- KONEKSI DATABASE POSTGRESQL ---
// Skrip ini menggunakan koneksi yang sama dengan server.js
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function createAdmin() {
    // Ambil argumen dari command line:
    // process.argv[2]: email
    // process.argv[3]: password
    // process.argv[4]: username
    // process.argv[5]: fullName
    const email = process.argv[2];
    const password = process.argv[3];
    const username = process.argv[4];
    const fullName = process.argv[5];

    if (!email || !password || !username || !fullName) {
        console.error('Kesalahan: Argumen tidak lengkap.');
        console.log('Penggunaan: node create-admin.js <email> <password> <username> "<nama_lengkap>"');
        console.log('Contoh: node create-admin.js admin@example.com password123 admin "Admin Utama"');
        // Pastikan untuk menggunakan tanda kutip jika nama lengkap mengandung spasi.
        process.exit(1); // Keluar dengan kode error
    }

    try {
        console.log(`Mencoba membuat admin dengan email: ${email}...`);

        // 1. Hash password (SANGAT PENTING)
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // 2. Masukkan data admin ke database
        const result = await pool.query(
            'INSERT INTO users (username, email, password_hash, full_name, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, role',
            [username, email, passwordHash, fullName, 'admin'] // Role di-hardcode sebagai 'admin'
        );

        const newUser = result.rows[0];
        console.log('✅ Pengguna admin berhasil dibuat!');
        console.log('---------------------------------');
        console.log(`ID: ${newUser.id}`);
        console.log(`Username: ${newUser.username}`);
        console.log(`Email: ${newUser.email}`);
        console.log(`Role: ${newUser.role}`);
        console.log('---------------------------------');

    } catch (err) {
        if (err.code === '23505') { // Kode error PostgreSQL untuk unique violation
            console.error('❌ Gagal: Username atau email sudah terdaftar.');
        } else {
            console.error('❌ Terjadi kesalahan saat membuat admin:', err);
        }
    } finally {
        await pool.end(); // Tutup koneksi ke database
    }
}

createAdmin();