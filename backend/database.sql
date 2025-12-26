CREATE TABLE IF NOT EXISTS books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    file_paths JSONB NOT NULL,
    thumbnail_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Membuat tipe data ENUM untuk peran pengguna, hanya jika belum ada
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'manager', 'staff');
    END IF;

    -- PERBAIKAN: Tambahkan nilai baru ke ENUM jika belum ada.
    -- Ini harus dijalankan setelah ENUM dibuat.
    -- Perintah ini aman untuk dijalankan berulang kali.
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'engineering';
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'direksi';
    -- Jika Anda menambahkan peran lain di masa depan, tambahkan baris serupa di sini.
    -- Contoh: ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'auditor';

END$$;

-- Membuat tabel pengguna
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- Penting: Simpan password yang sudah di-hash, bukan plain text
    full_name VARCHAR(100),
    role user_role NOT NULL,
    hotel_id INTEGER, -- Akan terisi jika role adalah 'staff', bisa null untuk 'admin' atau 'manager'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Menambahkan kolom untuk fitur reset password ke tabel 'users' (aman dijalankan ulang)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='reset_password_token') THEN
        ALTER TABLE users ADD COLUMN reset_password_token TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='reset_password_expires') THEN
        ALTER TABLE users ADD COLUMN reset_password_expires TIMESTAMPTZ;
    END IF;
END$$;

-- Membuat tabel hotel/perusahaan
CREATE TABLE IF NOT EXISTS hotels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Menambahkan trigger untuk otomatis memperbarui 'updated_at' pada tabel hotels
DROP TRIGGER IF EXISTS set_timestamp_hotels ON hotels;
CREATE TRIGGER set_timestamp_hotels
BEFORE UPDATE ON hotels
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- Atur ulang sequence agar ID selanjutnya tidak konflik jika data dimasukkan manual
SELECT setval('hotels_id_seq', (SELECT MAX(id) FROM hotels));

-- Menambahkan kolom 'address' ke tabel 'hotels' jika belum ada (aman untuk dijalankan ulang)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hotels' AND column_name='address') THEN
        ALTER TABLE hotels ADD COLUMN address TEXT;
    END IF;
END$$;



-- Menambahkan kolom 'brand' ke tabel 'hotels' jika belum ada (aman untuk dijalankan ulang)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hotels' AND column_name='brand') THEN
        ALTER TABLE hotels ADD COLUMN brand VARCHAR(100);
    END IF;
END$$;

-- Menambahkan kolom 'city' ke tabel 'hotels' jika belum ada (aman untuk dijalankan ulang)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hotels' AND column_name='city') THEN
        ALTER TABLE hotels ADD COLUMN city VARCHAR(100);
    END IF;
END$$;

-- Menambahkan kolom 'thumbnail_url' ke tabel 'hotels' jika belum ada
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hotels' AND column_name='thumbnail_url') THEN
        ALTER TABLE hotels ADD COLUMN thumbnail_url TEXT;
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hotels' AND column_name='number_of_rooms') THEN
        ALTER TABLE hotels ADD COLUMN number_of_rooms INTEGER;
    END IF;
END$$;

-- =================================================================
-- TABEL PENGHUBUNG UNTUK AKSES HOTEL PENGGUNA (MANY-TO-MANY)
-- =================================================================
CREATE TABLE IF NOT EXISTS user_hotel_access (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hotel_id INTEGER NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, hotel_id) -- Kunci utama komposit untuk memastikan keunikan
);

-- (OPSIONAL TAPI SANGAT DIREKOMENDASIKAN)
-- Hapus kolom hotel_id yang lama dari tabel users setelah migrasi data.
-- ALTER TABLE users DROP COLUMN IF EXISTS hotel_id;
-- =================================================================

-- Membuat fungsi trigger generik untuk memperbarui kolom 'updated_at'
-- Fungsi ini akan dibuat hanya jika belum ada.
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Membuat tabel untuk menyimpan data budget
CREATE TABLE IF NOT EXISTS budgets (
    id SERIAL PRIMARY KEY,
    hotel_id INTEGER NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    account_code VARCHAR(100) NOT NULL,
    values JSONB NOT NULL, -- Menyimpan array 12 nilai bulanan [jan, feb, ..., dec]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(hotel_id, year, account_code) -- Memastikan setiap akun unik per hotel per tahun
);

-- Membuat tabel untuk menyimpan data Budget DSR (Daily Summary Report)
CREATE TABLE IF NOT EXISTS budget_dsr (
    id SERIAL PRIMARY KEY,
    hotel_id INTEGER NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    room_available INTEGER DEFAULT 0,
    room_ooo INTEGER DEFAULT 0,
    room_com_and_hu INTEGER DEFAULT 0,
    room_sold INTEGER DEFAULT 0,
    number_of_guest INTEGER DEFAULT 0,
    occp_r_sold_percent NUMERIC(5, 2) DEFAULT 0.00,
    arr NUMERIC(15, 2) DEFAULT 0.00,
    revpar NUMERIC(15, 2) DEFAULT 0.00,
    lodging_revenue NUMERIC(15, 2) DEFAULT 0.00,
    others_room_revenue NUMERIC(15, 2) DEFAULT 0.00,
    room_revenue NUMERIC(15, 2) DEFAULT 0.00,
    breakfast_revenue NUMERIC(15, 2) DEFAULT 0.00,
    restaurant_revenue NUMERIC(15, 2) DEFAULT 0.00,
    room_service NUMERIC(15, 2) DEFAULT 0.00,
    banquet_revenue NUMERIC(15, 2) DEFAULT 0.00,
    fnb_others_revenue NUMERIC(15, 2) DEFAULT 0.00,
    fnb_revenue NUMERIC(15, 2) DEFAULT 0.00,
    others_revenue NUMERIC(15, 2) DEFAULT 0.00,
    total_revenue NUMERIC(15, 2) DEFAULT 0.00,
    service NUMERIC(15, 2) DEFAULT 0.00,
    tax NUMERIC(15, 2) DEFAULT 0.00,
    gross_revenue NUMERIC(15, 2) DEFAULT 0.00,
    shared_payable NUMERIC(15, 2) DEFAULT 0.00,
    deposit_reservation NUMERIC(15, 2) DEFAULT 0.00,
    cash_fo NUMERIC(15, 2) DEFAULT 0.00,
    cash_outlet NUMERIC(15, 2) DEFAULT 0.00,
    bank_transfer NUMERIC(15, 2) DEFAULT 0.00,
    qris NUMERIC(15, 2) DEFAULT 0.00,
    credit_debit_card NUMERIC(15, 2) DEFAULT 0.00,
    city_ledger NUMERIC(15, 2) DEFAULT 0.00,
    total_settlement NUMERIC(15, 2) DEFAULT 0.00,
    gab NUMERIC(15, 2) DEFAULT 0.00,
    balance NUMERIC(15, 2) DEFAULT 0.00,
    is_locked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(hotel_id, date)
);

-- BARU: Sinkronisasi untuk memastikan kolom is_locked ada di budget_dsr
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='budget_dsr' AND column_name='is_locked') THEN
        ALTER TABLE budget_dsr ADD COLUMN is_locked BOOLEAN DEFAULT FALSE;
    END IF;
END$$;

-- Membuat tabel untuk menyimpan data Actual DSR (Daily Summary Report)
CREATE TABLE IF NOT EXISTS actual_dsr (
    id SERIAL PRIMARY KEY,
    hotel_id INTEGER NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    -- Kolom-kolom lainnya sama persis dengan tabel budget_dsr
    -- Untuk mempersingkat, kita bisa menyalin definisi kolom dari atas
    -- Namun, untuk kejelasan, kita akan menulisnya kembali
    room_available INTEGER DEFAULT 0, room_ooo INTEGER DEFAULT 0, room_com_and_hu INTEGER DEFAULT 0, room_sold INTEGER DEFAULT 0, number_of_guest INTEGER DEFAULT 0, occp_r_sold_percent NUMERIC(5, 2) DEFAULT 0.00, arr NUMERIC(15, 2) DEFAULT 0.00, revpar NUMERIC(15, 2) DEFAULT 0.00, lodging_revenue NUMERIC(15, 2) DEFAULT 0.00, others_room_revenue NUMERIC(15, 2) DEFAULT 0.00, room_revenue NUMERIC(15, 2) DEFAULT 0.00, breakfast_revenue NUMERIC(15, 2) DEFAULT 0.00, restaurant_revenue NUMERIC(15, 2) DEFAULT 0.00, room_service NUMERIC(15, 2) DEFAULT 0.00, banquet_revenue NUMERIC(15, 2) DEFAULT 0.00, fnb_others_revenue NUMERIC(15, 2) DEFAULT 0.00, fnb_revenue NUMERIC(15, 2) DEFAULT 0.00, others_revenue NUMERIC(15, 2) DEFAULT 0.00, total_revenue NUMERIC(15, 2) DEFAULT 0.00, service NUMERIC(15, 2) DEFAULT 0.00, tax NUMERIC(15, 2) DEFAULT 0.00, gross_revenue NUMERIC(15, 2) DEFAULT 0.00, shared_payable NUMERIC(15, 2) DEFAULT 0.00, deposit_reservation NUMERIC(15, 2) DEFAULT 0.00, cash_fo NUMERIC(15, 2) DEFAULT 0.00, cash_outlet NUMERIC(15, 2) DEFAULT 0.00, bank_transfer NUMERIC(15, 2) DEFAULT 0.00, qris NUMERIC(15, 2) DEFAULT 0.00, credit_debit_card NUMERIC(15, 2) DEFAULT 0.00, city_ledger NUMERIC(15, 2) DEFAULT 0.00, total_settlement NUMERIC(15, 2) DEFAULT 0.00, gab NUMERIC(15, 2) DEFAULT 0.00, balance NUMERIC(15, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(hotel_id, date)
);

-- Sinkronisasi kolom tabel actual_dsr dari budget_dsr
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='actual_dsr' AND column_name='room_available') THEN
        ALTER TABLE actual_dsr ADD COLUMN room_available INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='actual_dsr' AND column_name='room_ooo') THEN
        ALTER TABLE actual_dsr ADD COLUMN room_ooo INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='actual_dsr' AND column_name='room_com_and_hu') THEN
        ALTER TABLE actual_dsr ADD COLUMN room_com_and_hu INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='actual_dsr' AND column_name='room_sold') THEN
        ALTER TABLE actual_dsr ADD COLUMN room_sold INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='actual_dsr' AND column_name='number_of_guest') THEN
        ALTER TABLE actual_dsr ADD COLUMN number_of_guest INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='actual_dsr' AND column_name='occp_r_sold_percent') THEN
        ALTER TABLE actual_dsr ADD COLUMN occp_r_sold_percent NUMERIC(5, 2) DEFAULT 0.00;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='actual_dsr' AND column_name='arr') THEN
        ALTER TABLE actual_dsr ADD COLUMN arr NUMERIC(15, 2) DEFAULT 0.00;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='actual_dsr' AND column_name='revpar') THEN
        ALTER TABLE actual_dsr ADD COLUMN revpar NUMERIC(15, 2) DEFAULT 0.00;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='actual_dsr' AND column_name='lodging_revenue') THEN
        ALTER TABLE actual_dsr ADD COLUMN lodging_revenue NUMERIC(15, 2) DEFAULT 0.00;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='actual_dsr' AND column_name='others_room_revenue') THEN
        ALTER TABLE actual_dsr ADD COLUMN others_room_revenue NUMERIC(15, 2) DEFAULT 0.00;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='actual_dsr' AND column_name='room_revenue') THEN
        ALTER TABLE actual_dsr ADD COLUMN room_revenue NUMERIC(15, 2) DEFAULT 0.00;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='actual_dsr' AND column_name='breakfast_revenue') THEN
        ALTER TABLE actual_dsr ADD COLUMN breakfast_revenue NUMERIC(15, 2) DEFAULT 0.00;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='actual_dsr' AND column_name='restaurant_revenue') THEN
        ALTER TABLE actual_dsr ADD COLUMN restaurant_revenue NUMERIC(15, 2) DEFAULT 0.00;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='actual_dsr' AND column_name='room_service') THEN
        ALTER TABLE actual_dsr ADD COLUMN room_service NUMERIC(15, 2) DEFAULT 0.00;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='actual_dsr' AND column_name='banquet_revenue') THEN
        ALTER TABLE actual_dsr ADD COLUMN banquet_revenue NUMERIC(15, 2) DEFAULT 0.00;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='actual_dsr' AND column_name='fnb_others_revenue') THEN
        ALTER TABLE actual_dsr ADD COLUMN fnb_others_revenue NUMERIC(15, 2) DEFAULT 0.00;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='actual_dsr' AND column_name='fnb_revenue') THEN
        ALTER TABLE actual_dsr ADD COLUMN fnb_revenue NUMERIC(15, 2) DEFAULT 0.00;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='actual_dsr' AND column_name='others_revenue') THEN
        ALTER TABLE actual_dsr ADD COLUMN others_revenue NUMERIC(15, 2) DEFAULT 0.00;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='actual_dsr' AND column_name='total_revenue') THEN
        ALTER TABLE actual_dsr ADD COLUMN total_revenue NUMERIC(15, 2) DEFAULT 0.00;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='actual_dsr' AND column_name='service') THEN
        ALTER TABLE actual_dsr ADD COLUMN service NUMERIC(15, 2) DEFAULT 0.00;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='actual_dsr' AND column_name='tax') THEN
        ALTER TABLE actual_dsr ADD COLUMN tax NUMERIC(15, 2) DEFAULT 0.00;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='actual_dsr' AND column_name='gross_revenue') THEN
        ALTER TABLE actual_dsr ADD COLUMN gross_revenue NUMERIC(15, 2) DEFAULT 0.00;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='actual_dsr' AND column_name='shared_payable') THEN
        ALTER TABLE actual_dsr ADD COLUMN shared_payable NUMERIC(15, 2) DEFAULT 0.00;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='actual_dsr' AND column_name='deposit_reservation') THEN
        ALTER TABLE actual_dsr ADD COLUMN deposit_reservation NUMERIC(15, 2) DEFAULT 0.00;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='actual_dsr' AND column_name='cash_fo') THEN
        ALTER TABLE actual_dsr ADD COLUMN cash_fo NUMERIC(15, 2) DEFAULT 0.00;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='actual_dsr' AND column_name='cash_outlet') THEN
        ALTER TABLE actual_dsr ADD COLUMN cash_outlet NUMERIC(15, 2) DEFAULT 0.00;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='actual_dsr' AND column_name='bank_transfer') THEN
        ALTER TABLE actual_dsr ADD COLUMN bank_transfer NUMERIC(15, 2) DEFAULT 0.00;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='actual_dsr' AND column_name='qris') THEN
        ALTER TABLE actual_dsr ADD COLUMN qris NUMERIC(15, 2) DEFAULT 0.00;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='actual_dsr' AND column_name='credit_debit_card') THEN
        ALTER TABLE actual_dsr ADD COLUMN credit_debit_card NUMERIC(15, 2) DEFAULT 0.00;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='actual_dsr' AND column_name='city_ledger') THEN
        ALTER TABLE actual_dsr ADD COLUMN city_ledger NUMERIC(15, 2) DEFAULT 0.00;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='actual_dsr' AND column_name='total_settlement') THEN
        ALTER TABLE actual_dsr ADD COLUMN total_settlement NUMERIC(15, 2) DEFAULT 0.00;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='actual_dsr' AND column_name='gab') THEN
        ALTER TABLE actual_dsr ADD COLUMN gab NUMERIC(15, 2) DEFAULT 0.00;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='actual_dsr' AND column_name='balance') THEN
        ALTER TABLE actual_dsr ADD COLUMN balance NUMERIC(15, 2) DEFAULT 0.00;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='actual_dsr' AND column_name='updated_at') THEN
        ALTER TABLE actual_dsr ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='actual_dsr' AND column_name='is_locked') THEN
        ALTER TABLE actual_dsr ADD COLUMN is_locked BOOLEAN DEFAULT FALSE;
    END IF;
END$$;

-- Membuat tabel untuk menyimpan data actual (duplikat dari budgets)
CREATE TABLE IF NOT EXISTS actuals (
    id SERIAL PRIMARY KEY,
    hotel_id INTEGER NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    account_code VARCHAR(100) NOT NULL,
    values JSONB NOT NULL, -- Menyimpan array 12 nilai bulanan [jan, feb, ..., dec]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(hotel_id, year, account_code) -- Memastikan setiap akun unik per hotel per tahun
);

-- Membuat tabel untuk menyimpan data Opening Balance DSR
CREATE TABLE IF NOT EXISTS dsr_opening_balances (
    id SERIAL PRIMARY KEY,
    hotel_id INTEGER NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    effective_date DATE NOT NULL,
    balance_value NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(hotel_id) -- Setiap hotel hanya punya satu baris opening balance
);

-- Membuat tabel untuk menyimpan data Room Production
CREATE TABLE IF NOT EXISTS room_production (
    id SERIAL PRIMARY KEY,
    hotel_id INTEGER NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    segment VARCHAR(255),
    company VARCHAR(255),
    room INTEGER DEFAULT 0,
    guest INTEGER DEFAULT 0,
    arr NUMERIC(15, 2) DEFAULT 0,
    lodging_revenue NUMERIC(15, 2) DEFAULT 0,
    pic_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Constraint untuk memastikan setiap baris unik per hotel per tanggal, segmen, perusahaan, dan nama
    UNIQUE(hotel_id, date, segment, company, pic_name)
);

-- MIGRATION: Menambahkan kolom lodging_revenue jika belum ada (aman dijalankan ulang)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='room_production' AND column_name='lodging_revenue') THEN
        ALTER TABLE room_production ADD COLUMN lodging_revenue NUMERIC(15, 2) DEFAULT 0;
    END IF;
END$$;

-- MIGRATION: Menambahkan kolom pic_name jika belum ada (aman dijalankan ulang)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='room_production' AND column_name='pic_name') THEN
        ALTER TABLE room_production ADD COLUMN pic_name VARCHAR(255);
    END IF;
END$$;

-- Menambahkan trigger untuk otomatis memperbarui 'updated_at' pada tabel room_production
DROP TRIGGER IF EXISTS set_timestamp_room_production ON room_production;
CREATE TRIGGER set_timestamp_room_production
BEFORE UPDATE ON room_production
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- =================================================================
-- TABEL UNTUK ROLE-BASED ACCESS CONTROL (RBAC)
-- =================================================================

-- 1. Tabel Roles (Menggantikan ENUM 'user_role')
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger untuk updated_at pada roles
DROP TRIGGER IF EXISTS set_timestamp_roles ON roles;
CREATE TRIGGER set_timestamp_roles
BEFORE UPDATE ON roles
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- 2. Tabel Permissions (Daftar semua hak akses yang ada di aplikasi)
CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    action VARCHAR(100) NOT NULL UNIQUE, -- e.g., 'users:create', 'users:read', 'users:update', 'users:delete'
    group_name VARCHAR(50) NOT NULL, -- e.g., 'Users', 'Hotels', 'Reports'
    description TEXT
);

-- 3. Tabel Penghubung Role-Permission (Many-to-Many)
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 4. Migrasi Data Awal (Hanya dijalankan sekali)
-- Memasukkan role dasar dari ENUM yang lama
INSERT INTO roles (id, name, description) VALUES
(1, 'admin', 'Akses penuh ke semua fitur.'),
(2, 'manager', 'Akses ke fitur manajerial dan laporan.'),
(3, 'staff', 'Akses terbatas sesuai tugas operasional.'),
(4, 'engineering', 'Akses ke dashboard inspeksi dan daftar tugas.'),
(5, 'direksi', 'Akses lihat-saja ke semua laporan dan dashboard.'),
(6, 'auditor', 'Akses untuk melakukan dan mengelola agenda audit.'),
(7, 'e-commerce', 'Akses hanya ke fitur Guest Review.'),
(8, 'night_audit', 'Akses ke menu Daily Income dan submenunya berdasarkan hotel.')
ON CONFLICT (id) DO NOTHING;

-- Memasukkan daftar permission yang ada di aplikasi
INSERT INTO permissions (action, group_name, description) VALUES
-- Menu & Submenu Access
('menu:dashboard', 'Menu Access', 'Akses menu Dashboard'),
('menu:achievement', 'Menu Access', 'Akses menu Achievement'),
('submenu:slides_corporate', 'Menu Access', 'Akses submenu Slides Corporate'),
('submenu:slides_hotel', 'Menu Access', 'Akses submenu Slides Hotel'),
('submenu:ebook', 'Menu Access', 'Akses submenu Budget Ebook'),
('submenu:input_budget_pl', 'Menu Access', 'Akses submenu Input Budget P&L'),
('submenu:input_actual_pl', 'Menu Access', 'Akses submenu Input Actual P&L'),
('menu:daily_income', 'Menu Access', 'Akses menu Daily Income'),
('submenu:daily_income_dashboard', 'Menu Access', 'Akses submenu Dashboard Daily Income'),
('submenu:input_budget_dsr', 'Menu Access', 'Akses submenu Input Budget DSR'),
('submenu:input_actual_dsr', 'Menu Access', 'Akses submenu Input Actual DSR'),
('submenu:input_room_production', 'Menu Access', 'Akses submenu Input Room Production'),
('submenu:input_hotel_competitor', 'Menu Access', 'Akses submenu Input Hotel Competitor'),
('menu:ar_aging', 'Menu Access', 'Akses menu AR Aging'),
('submenu:input_ar_aging', 'Menu Access', 'Akses submenu Input AR Aging'),
('menu:inspection', 'Menu Access', 'Akses menu Inspection'),
('submenu:inspection_dashboard', 'Menu Access', 'Akses submenu Dashboard Inspection'),
('submenu:hotel_inspection', 'Menu Access', 'Akses submenu Hotel Inspection'),
('submenu:task_to_do', 'Menu Access', 'Akses submenu Task to Do'),
('menu:reports', 'Menu Access', 'Akses menu Reports'),
('menu:settings', 'Menu Access', 'Akses menu Settings'),
-- Action Permissions
('users:manage', 'User Management', 'Bisa menambah, mengedit, dan menghapus pengguna'),
('hotels:manage', 'Hotel Management', 'Bisa menambah, mengedit, dan menghapus hotel'),
('roles:manage', 'Role Management', 'Bisa mengelola role dan hak aksesnya'),
('inspection_types:manage', 'Inspection Settings', 'Bisa mengelola tipe dan item inspeksi'),
-- BARU: Hak akses untuk menu-menu baru
('submenu:ar_summary', 'Menu Access', 'Akses submenu AR Aging Summary'),
('submenu:trial_balance', 'Menu Access', 'Akses submenu Trial Balance'),
('menu:guest_review', 'Menu Access', 'Akses menu Guest Review'),
('submenu:guest_review_dashboard', 'Menu Access', 'Akses submenu Dashboard Guest Review'),
('submenu:guest_review_settings', 'Menu Access', 'Akses submenu Pengaturan Guest Review'),
('submenu:guest_review_replies', 'Menu Access', 'Akses submenu Balasan Guest Review'),
('menu:audit', 'Menu Access', 'Akses menu Audit'),
('submenu:agenda_audit', 'Menu Access', 'Akses submenu Agenda Audit'),
('submenu:audit_calendar', 'Menu Access', 'Akses submenu Kalender Audit'),
('settings:audit_checklists', 'Settings', 'Bisa mengelola checklist untuk audit'),
-- BARU: Hak akses spesifik untuk tindakan audit
('audit_agendas:manage', 'Audit', 'Bisa membuat, mengedit, dan menghapus agenda audit'),
('audit_results:submit', 'Audit', 'Bisa mengisi dan mengirimkan hasil audit'),
-- BARU: Hak akses spesifik untuk data finansial
('financials:pl:manage', 'Financials', 'Bisa input budget dan actual P&L'),
('financials:dsr:manage', 'Financials', 'Bisa input budget, actual, dan opening balance DSR'),
('financials:room_prod:manage', 'Financials', 'Bisa input data room production'),
('financials:ar_aging:manage', 'Financials', 'Bisa input data AR Aging'),
('financials:competitor:manage', 'Financials', 'Bisa input data hotel competitor')
ON CONFLICT (action) DO NOTHING;

-- BARU: Tambahkan permission untuk voucher
INSERT INTO permissions (action, group_name, description) VALUES
('submenu:guest_review_vouchers', 'Menu Access', 'Akses submenu Penggunaan Voucher')
ON CONFLICT (action) DO NOTHING;

-- BARU: Tetapkan hak akses untuk peran "engineering"
DO $$
DECLARE
    engineering_role_id INTEGER;
    perm_dashboard_id INTEGER;
    perm_task_id INTEGER;
BEGIN
    SELECT id INTO engineering_role_id FROM roles WHERE name = 'engineering';
    SELECT id INTO perm_dashboard_id FROM permissions WHERE action = 'submenu:inspection_dashboard';
    SELECT id INTO perm_task_id FROM permissions WHERE action = 'submenu:task_to_do';

    IF engineering_role_id IS NOT NULL AND perm_dashboard_id IS NOT NULL THEN
        INSERT INTO role_permissions (role_id, permission_id) VALUES (engineering_role_id, perm_dashboard_id) ON CONFLICT (role_id, permission_id) DO NOTHING;
    END IF;
    IF engineering_role_id IS NOT NULL AND perm_task_id IS NOT NULL THEN
        INSERT INTO role_permissions (role_id, permission_id) VALUES (engineering_role_id, perm_task_id) ON CONFLICT (role_id, permission_id) DO NOTHING;
    END IF;
END $$;

-- BARU: Tetapkan hak akses untuk peran "Direksi" (read-only)
DO $$
DECLARE
    direksi_role_id INTEGER;
    permissions_to_grant TEXT[] := ARRAY[
        'menu:dashboard',
        'menu:achievement',
        'submenu:slides_corporate',
        'submenu:slides_hotel',
        'submenu:ebook',
        'menu:daily_income',
        'submenu:daily_income_dashboard',
        'menu:ar_aging',
        'menu:inspection',
        'submenu:inspection_dashboard',
        'submenu:hotel_inspection',
        'submenu:task_to_do',
        'menu:reports'
    ];
    perm_action TEXT;
    perm_id INTEGER;
BEGIN
    SELECT id INTO direksi_role_id FROM roles WHERE name = 'direksi';
    FOREACH perm_action IN ARRAY permissions_to_grant LOOP
        SELECT id INTO perm_id FROM permissions WHERE action = perm_action;
        IF direksi_role_id IS NOT NULL AND perm_id IS NOT NULL THEN
            INSERT INTO role_permissions (role_id, permission_id) VALUES (direksi_role_id, perm_id) ON CONFLICT (role_id, permission_id) DO NOTHING;
        END IF;
    END LOOP;
END $$;

-- PERBAIKAN: Tetapkan SEMUA hak akses yang seharusnya untuk peran "manager"
DO $$
DECLARE
    manager_role_id INTEGER;
    permissions_to_grant TEXT[] := ARRAY[
        -- Menu & Submenu Access
        'menu:dashboard', 'menu:achievement', 'submenu:slides_corporate', 'submenu:slides_hotel', 'submenu:ebook',
        'submenu:input_budget_pl', 'submenu:input_actual_pl', 'menu:daily_income', 'submenu:daily_income_dashboard',
        'submenu:input_budget_dsr', 'submenu:input_actual_dsr', 'submenu:input_room_production', 'submenu:input_hotel_competitor', 'menu:ar_aging',
        'submenu:input_ar_aging', 'submenu:ar_summary', 'menu:inspection', 'submenu:inspection_dashboard',
        'submenu:hotel_inspection', 'submenu:task_to_do', 'menu:reports', 'menu:settings', 'submenu:trial_balance',
        'menu:guest_review', 'submenu:guest_review_dashboard', 'submenu:guest_review_settings', 'submenu:guest_review_replies',
        'menu:audit', 'submenu:agenda_audit', 'submenu:audit_calendar',
        -- Action & Settings Permissions
        'users:manage', 'hotels:manage', 'inspection_types:manage', 'settings:audit_checklists',
        'audit_agendas:manage', 'audit_results:submit',
        'financials:pl:manage', 'financials:dsr:manage', 'financials:room_prod:manage', 'financials:ar_aging:manage', 'financials:competitor:manage'
        -- 'roles:manage' sengaja tidak diberikan ke manager, hanya untuk admin
    ];
    perm_action TEXT;
    perm_id INTEGER;
BEGIN
    SELECT id INTO manager_role_id FROM roles WHERE name = 'manager';
    IF manager_role_id IS NOT NULL THEN
        -- Berikan semua permission yang terdefinisi di atas
        FOREACH perm_action IN ARRAY permissions_to_grant LOOP
            SELECT id INTO perm_id FROM permissions WHERE action = perm_action;
            IF perm_id IS NOT NULL THEN
                INSERT INTO role_permissions (role_id, permission_id) VALUES (manager_role_id, perm_id) ON CONFLICT (role_id, permission_id) DO NOTHING;
            END IF;
        END LOOP;
    END IF;
END $$;

-- BARU: Tetapkan SEMUA hak akses untuk peran "admin" secara eksplisit di database
DO $$
DECLARE
    admin_role_id INTEGER;
    perm_id INTEGER;
BEGIN
    SELECT id INTO admin_role_id FROM roles WHERE name = 'admin';
    IF admin_role_id IS NOT NULL THEN
        -- Loop melalui semua permission yang ada dan berikan ke admin
        FOR perm_id IN (SELECT id FROM permissions) LOOP
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES (admin_role_id, perm_id)
            ON CONFLICT (role_id, permission_id) DO NOTHING;
        END LOOP;
    END IF;
END $$;

-- BARU: Tetapkan hak akses untuk peran "auditor"
DO $$
DECLARE
    auditor_role_id INTEGER;
    permissions_to_grant TEXT[] := ARRAY[
        'menu:audit',
        'submenu:agenda_audit',
        'submenu:audit_calendar',
        'audit_agendas:manage',
        'audit_results:submit',
        'settings:audit_checklists' -- Auditor perlu melihat checklist, jadi kita berikan akses ini juga
    ];
    perm_action TEXT;
    perm_id INTEGER;
BEGIN
    SELECT id INTO auditor_role_id FROM roles WHERE name = 'auditor';
    FOREACH perm_action IN ARRAY permissions_to_grant LOOP
        SELECT id INTO perm_id FROM permissions WHERE action = perm_action;
        IF auditor_role_id IS NOT NULL AND perm_id IS NOT NULL THEN
            INSERT INTO role_permissions (role_id, permission_id) VALUES (auditor_role_id, perm_id) ON CONFLICT (role_id, permission_id) DO NOTHING;
        END IF;
    END LOOP;
END $$;

-- BARU: Tetapkan hak akses untuk peran "e-commerce"
DO $$
DECLARE
    ecommerce_role_id INTEGER;
    permissions_to_grant TEXT[] := ARRAY[
        'menu:guest_review',
        'submenu:guest_review_dashboard',
        'submenu:guest_review_settings',
        'submenu:guest_review_replies',
        'submenu:guest_review_vouchers'
    ];
    perm_action TEXT;
    perm_id INTEGER;
BEGIN
    SELECT id INTO ecommerce_role_id FROM roles WHERE name = 'e-commerce';
    FOREACH perm_action IN ARRAY permissions_to_grant LOOP
        SELECT id INTO perm_id FROM permissions WHERE action = perm_action;
        IF ecommerce_role_id IS NOT NULL AND perm_id IS NOT NULL THEN
            INSERT INTO role_permissions (role_id, permission_id) VALUES (ecommerce_role_id, perm_id) ON CONFLICT (role_id, permission_id) DO NOTHING;
        END IF;
    END LOOP;
END $$;

-- BARU: Tetapkan hak akses untuk peran "Night Audit"
DO $$
DECLARE
    night_audit_role_id INTEGER;
    permissions_to_grant TEXT[] := ARRAY[
        'menu:daily_income',
        'submenu:daily_income_dashboard',
        'submenu:input_budget_dsr',
        'submenu:input_actual_dsr',
        'submenu:input_room_production',
        'submenu:input_hotel_competitor'
    ];
    perm_action TEXT;
    perm_id INTEGER;
BEGIN
    SELECT id INTO night_audit_role_id FROM roles WHERE name = 'night_audit';
    FOREACH perm_action IN ARRAY permissions_to_grant LOOP
        SELECT id INTO perm_id FROM permissions WHERE action = perm_action;
        IF night_audit_role_id IS NOT NULL AND perm_id IS NOT NULL THEN
            INSERT INTO role_permissions (role_id, permission_id) VALUES (night_audit_role_id, perm_id) ON CONFLICT (role_id, permission_id) DO NOTHING;
        END IF;
    END LOOP;
END $$;

-- BARU: Tetapkan hak akses untuk peran "staff" agar bisa melihat Trial Balance
DO $$
DECLARE
    staff_role_id INTEGER;
    permissions_to_grant TEXT[] := ARRAY[
        'menu:audit',
        'submenu:trial_balance',
        'submenu:input_budget_dsr',
        'submenu:input_actual_dsr'
    ];
    perm_action TEXT;
    perm_id INTEGER;
BEGIN
    SELECT id INTO staff_role_id FROM roles WHERE name = 'staff';
    FOREACH perm_action IN ARRAY permissions_to_grant LOOP
        SELECT id INTO perm_id FROM permissions WHERE action = perm_action;
        IF staff_role_id IS NOT NULL AND perm_id IS NOT NULL THEN
            INSERT INTO role_permissions (role_id, permission_id) VALUES (staff_role_id, perm_id) ON CONFLICT (role_id, permission_id) DO NOTHING;
        END IF;
    END LOOP;
END $$;

-- Atur ulang sequence agar ID selanjutnya tidak konflik
SELECT setval('roles_id_seq', (SELECT MAX(id) FROM roles));
SELECT setval('permissions_id_seq', (SELECT MAX(id) FROM permissions));
-- =================================================================
-- TABEL UNTUK AR AGING
-- =================================================================
CREATE TABLE IF NOT EXISTS ar_aging (
    id SERIAL PRIMARY KEY,
    hotel_id INTEGER NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    company_name VARCHAR(255),
    invoice_number VARCHAR(100),
    invoice_date DATE,
    total_bill NUMERIC(15, 2) DEFAULT 0,
    current NUMERIC(15, 2) DEFAULT 0,
    days_1_30 NUMERIC(15, 2) DEFAULT 0,
    days_31_60 NUMERIC(15, 2) DEFAULT 0,
    days_61_90 NUMERIC(15, 2) DEFAULT 0,
    days_over_90 NUMERIC(15, 2) DEFAULT 0,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =================================================================
-- TABEL UNTUK GOOGLE SLIDES PRESENTATION
-- =================================================================
CREATE TABLE IF NOT EXISTS slides (
    id SERIAL PRIMARY KEY,
    hotel_id INTEGER REFERENCES hotels(id) ON DELETE SET NULL, -- PERBAIKAN: Izinkan NULL dan gunakan SET NULL on delete
    title VARCHAR(255) NOT NULL,
    link TEXT, -- PERBAIKAN: Izinkan NULL untuk link
    thumbnail_url TEXT,
    position INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menambahkan trigger untuk otomatis memperbarui 'updated_at' pada tabel slides
DROP TRIGGER IF EXISTS set_timestamp_slides ON slides;
CREATE TRIGGER set_timestamp_slides
BEFORE UPDATE ON slides
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- Membuat index untuk mempercepat pengurutan slide berdasarkan posisi
CREATE INDEX IF NOT EXISTS idx_slides_position ON slides(position);

-- =================================================================
-- TABEL UNTUK FITUR HOTEL INSPECTION
-- =================================================================

-- 1. Tipe Inspeksi (Template)
CREATE TABLE IF NOT EXISTS inspection_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger untuk updated_at pada inspection_types
DROP TRIGGER IF EXISTS set_timestamp_inspection_types ON inspection_types;
CREATE TRIGGER set_timestamp_inspection_types
BEFORE UPDATE ON inspection_types
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- 2. Item Checklist untuk setiap Tipe Inspeksi
CREATE TABLE IF NOT EXISTS inspection_items (
    id SERIAL PRIMARY KEY,
    inspection_type_id INTEGER NOT NULL REFERENCES inspection_types(id) ON DELETE CASCADE,
    category VARCHAR(255),
    name TEXT NOT NULL,
    standard TEXT,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger untuk updated_at pada inspection_items
DROP TRIGGER IF EXISTS set_timestamp_inspection_items ON inspection_items;
CREATE TRIGGER set_timestamp_inspection_items
BEFORE UPDATE ON inspection_items
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- 3. Inspeksi Utama (Header)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inspection_status') THEN
        CREATE TYPE inspection_status AS ENUM ('in_progress', 'completed', 'pending_review');
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS inspections (
    id SERIAL PRIMARY KEY,
    hotel_id INTEGER NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    inspection_type_id INTEGER NOT NULL REFERENCES inspection_types(id) ON DELETE CASCADE,
    inspector_name VARCHAR(255),
    room_number_or_area VARCHAR(255),
    inspection_date TIMESTAMPTZ DEFAULT NOW(),
    status inspection_status DEFAULT 'in_progress',
    score NUMERIC(5, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MIGRATION: Memastikan kolom inspector_name ada di tabel inspections
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inspections' AND column_name='inspector_name') THEN
        ALTER TABLE inspections ADD COLUMN inspector_name VARCHAR(255);
    END IF;
END$$;

-- MIGRATION: Memastikan kolom room_number_or_area ada di tabel inspections
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inspections' AND column_name='room_number_or_area') THEN
        ALTER TABLE inspections ADD COLUMN room_number_or_area VARCHAR(255);
    END IF;
END$$;

-- MIGRATION: Menambahkan kolom pic_name ke tabel inspections jika belum ada
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inspections' AND column_name='pic_name') THEN
        ALTER TABLE inspections ADD COLUMN pic_name VARCHAR(255);
    END IF;
END$$;

-- 4. Hasil Detail dari setiap Item Inspeksi
CREATE TABLE IF NOT EXISTS inspection_results (
    id SERIAL PRIMARY KEY,
    inspection_id INTEGER NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
    item_id INTEGER NOT NULL REFERENCES inspection_items(id) ON DELETE CASCADE,
    result VARCHAR(10), -- Contoh: 'pass', 'fail', 'n/a'
    notes TEXT,
    image_url VARCHAR(255),
    UNIQUE(inspection_id, item_id),
    priority task_priority DEFAULT 'medium' -- PERBAIKAN: Tambahkan kolom priority
);

-- MIGRATION: Menambahkan kolom priority ke inspection_results jika belum ada
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inspection_results' AND column_name='priority') THEN
        ALTER TABLE inspection_results ADD COLUMN priority task_priority DEFAULT 'medium';
    END IF;
END $$;

-- 5. Tugas yang Dihasilkan dari Temuan Inspeksi
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
        CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_priority') THEN
        CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS inspection_tasks (
    id SERIAL PRIMARY KEY,
    inspection_id INTEGER NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
    item_id INTEGER NOT NULL REFERENCES inspection_items(id) ON DELETE CASCADE,
    hotel_id INTEGER NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    notes TEXT,
    status task_status DEFAULT 'pending',
    priority task_priority DEFAULT 'medium',
    assigned_to VARCHAR(255),
    due_date DATE,
    completion_photo_url VARCHAR(255),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MIGRATION: Memastikan kolom completion_photo_url ada di tabel inspection_tasks
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inspection_tasks' AND column_name='completion_photo_url') THEN
        ALTER TABLE inspection_tasks ADD COLUMN completion_photo_url VARCHAR(255);
    END IF;
END$$;

-- =================================================================
-- CONTOH DATA UNTUK FITUR INSPEKSI (AMAN DIJALANKAN BERULANG)
-- =================================================================

-- Masukkan tipe-tipe inspeksi dasar
INSERT INTO inspection_types (id, name) VALUES
(1, 'Inspeksi Kamar'),
(2, 'Inspeksi Area Publik'),
(3, 'Inspeksi Dapur')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Atur ulang sequence agar ID selanjutnya tidak konflik jika data dimasukkan manual
SELECT setval('inspection_types_id_seq', (SELECT MAX(id) FROM inspection_types));

-- Hapus item lama untuk memastikan data bersih sebelum insert baru
DELETE FROM inspection_items WHERE inspection_type_id IN (1, 2, 3);

-- Masukkan item-item untuk "Inspeksi Kamar" (type_id = 1)
INSERT INTO inspection_items (inspection_type_id, category, name, standard, position) VALUES
-- Kategori: Kebersihan
(1, 'Kebersihan', 'Lantai bersih dan tidak berdebu', 'Lantai harus disapu dan dipel, bebas dari kotoran dan debu.', 1),
(1, 'Kebersihan', 'Jendela dan cermin bersih', 'Tidak ada noda, sidik jari, atau debu pada permukaan kaca.', 2),
(1, 'Kebersihan', 'Tempat tidur rapi dan sprei bersih', 'Sprei dan bed cover terpasang kencang, rapi, dan tidak ada noda.', 3),
(1, 'Kebersihan', 'Tidak ada sarang laba-laba', 'Periksa seluruh sudut ruangan, langit-langit, dan di balik perabotan.', 4),
-- Kategori: Fasilitas Kamar
(1, 'Fasilitas Kamar', 'AC berfungsi dengan baik', 'AC menyala, suhu bisa diatur, dan tidak mengeluarkan suara bising.', 1),
(1, 'Fasilitas Kamar', 'TV berfungsi dan remote tersedia', 'TV menyala, semua channel berfungsi, remote ada dan berfungsi.', 2),
(1, 'Fasilitas Kamar', 'Semua lampu berfungsi', 'Periksa semua lampu di kamar dan kamar mandi.', 3),
-- Kategori: Kamar Mandi
(1, 'Kamar Mandi', 'Toilet bersih dan higienis', 'Toilet bowl, seat, dan area sekitar bersih dan sudah disanitasi.', 1),
(1, 'Kamar Mandi', 'Shower berfungsi (air panas & dingin)', 'Aliran air lancar untuk panas dan dingin.', 2),
(1, 'Kamar Mandi', 'Handuk bersih dan lengkap', 'Tersedia handuk sesuai standar jumlah dan dalam kondisi bersih.', 3);

-- Masukkan item-item untuk "Inspeksi Area Publik" (type_id = 2)
INSERT INTO inspection_items (inspection_type_id, category, name, standard, position) VALUES
(2, 'Lobi', 'Kebersihan lantai lobi', 'Lantai lobi bersih, kering, dan tidak licin.', 1),
(2, 'Lobi', 'Kerapian sofa dan meja', 'Sofa dan meja tertata rapi, bebas dari debu dan sampah.', 2),
(2, 'Koridor', 'Penerangan koridor cukup', 'Semua lampu koridor menyala dan tidak ada yang redup atau mati.', 1),
(2, 'Koridor', 'Tidak ada barang penghalang', 'Koridor bebas dari troli, sampah, atau barang lain yang menghalangi jalan.', 2);

-- Masukkan item-item untuk "Inspeksi Dapur" (type_id = 3)
INSERT INTO inspection_items (inspection_type_id, category, name, standard, position) VALUES
(3, 'Kebersihan Peralatan', 'Kompor dan oven bersih', 'Bebas dari sisa makanan, minyak, dan kerak.', 1),
(3, 'Kebersihan Peralatan', 'Kulkas dan Freezer bersih', 'Bersih dari tumpahan, tidak berbau, dan suhu sesuai standar.', 2),
(3, 'Penyimpanan Makanan', 'Penerapan sistem FIFO', 'Bahan makanan lama berada di depan untuk digunakan lebih dulu.', 1),
(3, 'Keamanan', 'Tabung pemadam api (APAR) tersedia', 'APAR berada di lokasi yang mudah dijangkau dan belum kedaluwarsa.', 1);

-- =================================================================
-- TABEL UNTUK FITUR TRIAL BALANCE
-- =================================================================

-- Membuat tipe data ENUM untuk status audit, hanya jika belum ada
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audit_status') THEN
        CREATE TYPE audit_status AS ENUM ('not_audited', 'in_audit', 'closed');
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS trial_balances (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    link TEXT NOT NULL,
    status audit_status NOT NULL DEFAULT 'not_audited',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    thumbnail_url TEXT -- Menggantikan hotel_id dengan link thumbnail langsung
);

-- Migrasi: Tambahkan kolom drive_folder_link jika belum ada
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trial_balances' AND column_name='drive_folder_link') THEN
        ALTER TABLE trial_balances ADD COLUMN drive_folder_link TEXT;
    END IF;
END$$;

-- Migrasi: Hapus kolom hotel_id jika ada
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trial_balances' AND column_name='hotel_id') THEN
        ALTER TABLE trial_balances DROP COLUMN hotel_id;
    END IF;
END$$;

-- Migrasi: Tambahkan kolom thumbnail_url jika belum ada
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trial_balances' AND column_name='thumbnail_url') THEN ALTER TABLE trial_balances ADD COLUMN thumbnail_url TEXT; END IF; END $$;

-- Migrasi: Tambahkan kolom position jika belum ada
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trial_balances' AND column_name='position') THEN
        ALTER TABLE trial_balances ADD COLUMN position INTEGER;
    END IF;
END$$;

-- Membuat index untuk mempercepat pengurutan berdasarkan posisi
CREATE INDEX IF NOT EXISTS idx_trial_balances_position ON trial_balances(position);

-- Trigger untuk otomatis memperbarui 'updated_at'
DROP TRIGGER IF EXISTS set_timestamp_trial_balances ON trial_balances;
CREATE TRIGGER set_timestamp_trial_balances
BEFORE UPDATE ON trial_balances
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- =================================================================
-- TABEL UNTUK FITUR GUEST REVIEW
-- =================================================================

-- 1. Membuat tipe data ENUM untuk status review, jika belum ada
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'review_status') THEN
        CREATE TYPE review_status AS ENUM ('pending', 'approved', 'rejected');
    END IF;
END$$;

-- 2. Tabel Utama untuk Ulasan Tamu
CREATE TABLE IF NOT EXISTS guest_reviews (
    id SERIAL PRIMARY KEY,
    hotel_id INTEGER NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    guest_name VARCHAR(255) NOT NULL,
    room_number VARCHAR(50),
    guest_email VARCHAR(255),
    voucher_number VARCHAR(100), -- BARU: Kolom untuk nomor voucher
    checkin_date DATE, -- Dibuat opsional
    rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5), -- Mengganti nama dari overall_rating
    cleanliness_rating SMALLINT CHECK (cleanliness_rating BETWEEN 1 AND 5),
    service_rating SMALLINT CHECK (service_rating BETWEEN 1 AND 5),
    facilities_rating SMALLINT CHECK (facilities_rating BETWEEN 1 AND 5),
    comment TEXT,
    reply_text TEXT, -- BARU: Kolom untuk menyimpan balasan
    replied_at TIMESTAMPTZ, -- BARU: Kolom untuk menyimpan waktu balasan
    status review_status DEFAULT 'approved', -- PERUBAHAN: Ulasan baru akan langsung disetujui
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrasi: Menambahkan kolom voucher_number jika belum ada
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='guest_reviews' AND column_name='voucher_number') THEN
        ALTER TABLE guest_reviews ADD COLUMN voucher_number VARCHAR(100);
    END IF;
END$$;

-- Migrasi: Mengubah nama kolom dari overall_rating menjadi rating jika ada
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='guest_reviews' AND column_name='overall_rating')
    AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='guest_reviews' AND column_name='rating') THEN
        ALTER TABLE guest_reviews RENAME COLUMN overall_rating TO rating;
    END IF;
END$$;

-- Migrasi: Menambahkan kolom untuk fitur balasan (reply) jika belum ada
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='guest_reviews' AND column_name='reply_text') THEN
        ALTER TABLE guest_reviews ADD COLUMN reply_text TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='guest_reviews' AND column_name='replied_at') THEN
        ALTER TABLE guest_reviews ADD COLUMN replied_at TIMESTAMPTZ;
    END IF;
END$$;

-- Migrasi: Menambahkan kolom untuk status penggunaan voucher
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='guest_reviews' AND column_name='voucher_used_at') THEN
        ALTER TABLE guest_reviews ADD COLUMN voucher_used_at TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='guest_reviews' AND column_name='voucher_used_by_guest') THEN
        ALTER TABLE guest_reviews ADD COLUMN voucher_used_by_guest VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='guest_reviews' AND column_name='voucher_used_room_number') THEN
        ALTER TABLE guest_reviews ADD COLUMN voucher_used_room_number VARCHAR(50);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='guest_reviews' AND column_name='voucher_used_folio_number') THEN
        ALTER TABLE guest_reviews ADD COLUMN voucher_used_folio_number VARCHAR(100);
    END IF;
END$$;

-- 3. Tabel untuk menyimpan media (foto/video) yang terkait dengan ulasan
CREATE TABLE IF NOT EXISTS review_media (
    id SERIAL PRIMARY KEY,
    review_id INTEGER NOT NULL REFERENCES guest_reviews(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL, -- Mengganti nama dari file_url agar konsisten
    media_type VARCHAR(20), -- 'image' atau 'video'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrasi: Mengubah nama kolom dari file_url menjadi file_path jika ada
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='review_media' AND column_name='file_url') THEN
        ALTER TABLE review_media RENAME COLUMN file_url TO file_path;
    END IF;
END$$;

-- 4. Trigger untuk otomatis memperbarui 'updated_at' pada tabel guest_reviews
DROP TRIGGER IF EXISTS set_timestamp_guest_reviews ON guest_reviews;
CREATE TRIGGER set_timestamp_guest_reviews
BEFORE UPDATE ON guest_reviews
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- =================================================================
-- TABEL UNTUK PENGATURAN FORM GUEST REVIEW
-- =================================================================

CREATE TABLE IF NOT EXISTS guest_review_settings (
    id SERIAL PRIMARY KEY,
    hotel_id INTEGER NOT NULL UNIQUE REFERENCES hotels(id) ON DELETE CASCADE,
    logo_url TEXT,
    header_text VARCHAR(255) DEFAULT 'Bagaimana Pengalaman Menginap Anda?',
    subheader_text TEXT DEFAULT 'Kami sangat menghargai masukan Anda untuk menjadi lebih baik.',
    promo_enabled BOOLEAN DEFAULT false,
    promo_title VARCHAR(255),
    promo_description TEXT,
    promo_image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger untuk otomatis memperbarui 'updated_at' pada tabel guest_review_settings
DROP TRIGGER IF EXISTS set_timestamp_guest_review_settings ON guest_review_settings;
CREATE TRIGGER set_timestamp_guest_review_settings
BEFORE UPDATE ON guest_review_settings
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- =================================================================
-- TABEL UNTUK AGENDA AUDIT (BARU)
-- =================================================================

-- 1. Membuat tipe data ENUM untuk status agenda audit, jika belum ada
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audit_agenda_status') THEN
        CREATE TYPE audit_agenda_status AS ENUM ('planned', 'on_progress', 'completed', 'cancelled');
    END IF;
END$$;

-- 2. Tabel Utama untuk Agenda Audit
CREATE TABLE IF NOT EXISTS audit_agendas (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    hotel_id INTEGER NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    auditor VARCHAR(255) NOT NULL,
    status audit_agenda_status NOT NULL DEFAULT 'planned',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Trigger untuk otomatis memperbarui 'updated_at' pada tabel audit_agendas
DROP TRIGGER IF EXISTS set_timestamp_audit_agendas ON audit_agendas;
CREATE TRIGGER set_timestamp_audit_agendas
BEFORE UPDATE ON audit_agendas
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- =================================================================
-- TABEL UNTUK CHECKLIST AUDIT (BARU)
-- =================================================================

-- 1. Kategori untuk item checklist
CREATE TABLE IF NOT EXISTS audit_checklist_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger untuk updated_at pada audit_checklist_categories
DROP TRIGGER IF EXISTS set_timestamp_audit_checklist_categories ON audit_checklist_categories;
CREATE TRIGGER set_timestamp_audit_checklist_categories
BEFORE UPDATE ON audit_checklist_categories
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- 2. Item-item checklist
CREATE TABLE IF NOT EXISTS audit_checklist_items (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES audit_checklist_categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    standard TEXT,
    position INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger untuk updated_at pada audit_checklist_items
DROP TRIGGER IF EXISTS set_timestamp_audit_checklist_items ON audit_checklist_items;
CREATE TRIGGER set_timestamp_audit_checklist_items
BEFORE UPDATE ON audit_checklist_items
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- 3. Hasil dari checklist saat audit berlangsung
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audit_result_status') THEN
        CREATE TYPE audit_result_status AS ENUM ('pass', 'fail', 'n/a');
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS audit_results (
    id SERIAL PRIMARY KEY,
    agenda_id INTEGER NOT NULL REFERENCES audit_agendas(id) ON DELETE CASCADE,
    item_id INTEGER NOT NULL REFERENCES audit_checklist_items(id) ON DELETE CASCADE,
    result audit_result_status NOT NULL,
    notes TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(agenda_id, item_id)
);

-- Trigger untuk updated_at pada audit_results
DROP TRIGGER IF EXISTS set_timestamp_audit_results ON audit_results;
CREATE TRIGGER set_timestamp_audit_results
BEFORE UPDATE ON audit_results
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- =================================================================
-- TABEL UNTUK HOTEL COMPETITOR
-- =================================================================
CREATE TABLE IF NOT EXISTS hotel_competitor_data (
    id SERIAL PRIMARY KEY,
    hotel_id INTEGER NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    competitor_name VARCHAR(255) NOT NULL,
    number_of_rooms INTEGER,
    room_available INTEGER,
    room_sold INTEGER,
    arr NUMERIC(15, 2),
    -- Kolom-kolom berikut dihitung dan disimpan dari frontend
    occupancy_percent NUMERIC(5, 2),
    revenue NUMERIC(15, 2),
    revpar NUMERIC(15, 2),
    ari NUMERIC(15, 2),
    rgi NUMERIC(15, 2),
    mpi NUMERIC(15, 2),
    rank_mpi INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(hotel_id, date, competitor_name)
);

-- Trigger untuk updated_at pada hotel_competitor_data
DROP TRIGGER IF EXISTS set_timestamp_hotel_competitor_data ON hotel_competitor_data;
CREATE TRIGGER set_timestamp_hotel_competitor_data
BEFORE UPDATE ON hotel_competitor_data
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- =================================================================
-- OTOMASI PERHITUNGAN MPI (Market Penetration Index)
-- =================================================================
-- Fungsi dan trigger `calculate_competitor_metrics` dihapus karena perhitungan dipindahkan ke frontend.
DROP FUNCTION IF EXISTS calculate_competitor_metrics() CASCADE;

-- =================================================================
-- VIEW `compset_report_view` dihapus karena semua perhitungan sekarang dilakukan di sisi frontend (JavaScript).
DROP VIEW IF EXISTS compset_report_view;
