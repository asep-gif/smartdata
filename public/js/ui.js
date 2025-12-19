// --- UI & NAVIGATION FUNCTIONS ---

/**
 * Menampilkan halaman yang dipilih dan menyembunyikan yang lain.
 * @param {string} pageId - ID halaman yang akan ditampilkan (tanpa 'page-').
 */
function showPage(pageId) {
    const pageTitles = {
        'dashboard': 'Dashboard Keuangan',
        'ebook': 'Budget E-Book Library',
        'input-budget': 'Input Budget P&L',
        'input-actual': 'Input Actual P&L',
        'reports': 'Laporan Keuangan',
        'settings': 'Pengaturan',
        'daily-income-dashboard': 'Dashboard Daily Income',
        'input-budget-dsr': 'Input Budget DSR',
        'input-actual-dsr': 'Input Actual DSR',
        'input-room-production': 'Input Room Production',
        'input-ar-aging': 'Input AR Aging',
        'slides': 'Slides Hotel',
        'ar-summary': 'AR Aging Summary',
        'slides-corporate': 'Slides Corporate',
        'inspection-dashboard': 'Dashboard Inspeksi',
        'hotel-inspection': 'Manajemen Inspeksi',
        'task-to-do': 'Daftar Tugas',
        'guest-review-dashboard': 'Dashboard Guest Review',
        'guest-review-settings': 'Pengaturan Form Guest Review',
        'guest-review-replies': 'Balasan Guest Review',
        'agenda-audit': 'Agenda Audit', // BARU
        'audit-calendar': 'Kalender Audit' // BARU
    };
    document.getElementById('header-title').textContent = pageTitles[pageId] || 'Kagum Smartdata';

    document.querySelectorAll('.page-content-wrapper').forEach(el => {
        el.classList.add('hidden');
        el.classList.remove('block');
    });
    const pageElement = document.getElementById(`page-${pageId}`);
    if (pageElement) {
        pageElement.classList.remove('hidden');
        pageElement.classList.add('block');

        // Panggil fungsi inisialisasi HANYA setelah halaman ditampilkan
        if (pageId === 'dashboard') {
            initDashboardPage();
        } else if (pageId === 'settings') {
            // BARU: Panggil inisialisasi untuk halaman pengaturan
            initSettingsPage();
        }
    }

    document.querySelectorAll('aside button').forEach(btn => {
        btn.classList.remove('active-menu', 'border-blue-800', 'bg-slate-100', 'text-blue-800');
    });
    
    const activeBtn = document.getElementById(`nav-${pageId}`);
    if(activeBtn) {
        activeBtn.classList.add('active-menu', 'border-blue-800', 'bg-slate-100', 'text-blue-800');
    }

    if(window.innerWidth < 768) {
        toggleSidebar(false);
    }
}

/**
 * Mengatur visibilitas sidebar.
 * @param {boolean|null} forceOpen - true untuk paksa buka, false untuk paksa tutup.
 */
function toggleSidebar(forceOpen = null) {
    const body = document.body;
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    if (window.innerWidth < 768) {
        const isHidden = sidebar.classList.contains('-translate-x-full');
        if (forceOpen === true || (forceOpen === null && isHidden)) {
            sidebar.classList.remove('-translate-x-full');
            overlay.classList.remove('hidden');
        } else {
            sidebar.classList.add('-translate-x-full');
            overlay.classList.add('hidden');
        }
    } else {
        body.classList.toggle('sidebar-collapsed');
    }
}

/**
 * BARU: Menerapkan hak akses pengguna dengan menampilkan/menyembunyikan item menu.
 * Fungsi ini membaca izin dari localStorage dan menyesuaikan visibilitas sidebar.
 */
function applyUserPermissions() {
    const user = JSON.parse(localStorage.getItem('user'));
    // Jika tidak ada data user atau permissions, paksa logout sebagai fallback aman.
    if (!user || !user.permissions) {
        console.warn('Data pengguna atau hak akses tidak ditemukan. Mengarahkan ke login.');
        if (typeof handleLogout === 'function') {
            handleLogout();
        } else {
            // Fallback jika handleLogout tidak ada
            localStorage.clear();
            window.location.href = 'login.html';
        }
        return;
    }

    // BARU: Jika pengguna adalah admin, tampilkan semua item menu dan sub-menu
    if (user.role === 'admin') {
        document.querySelectorAll('aside nav ul li').forEach(li => {
            li.classList.remove('hidden');
        });
        return; // Hentikan eksekusi lebih lanjut untuk admin
    }

    const permissions = new Set(user.permissions);

    // Mapping dari string permission di DB ke ID elemen di HTML
    const permissionMap = {
        'menu:dashboard': 'nav-dashboard',
        'menu:achievement': 'nav-achievement',
        'submenu:slides_corporate': 'nav-slides-corporate',
        'submenu:slides_hotel': 'nav-slides',
        'submenu:ebook': 'nav-ebook',
        'submenu:input_budget_pl': 'nav-input-budget',
        'submenu:input_actual_pl': 'nav-input-actual',
        'menu:daily_income': 'nav-daily_income',
        'submenu:daily_income_dashboard': 'nav-daily-income-dashboard',
        'submenu:input_budget_dsr': 'nav-input-budget-dsr',
        'submenu:input_actual_dsr': 'nav-input-actual-dsr',
        'submenu:input_room_production': 'nav-input-room-production',
        'menu:ar_aging': 'nav-ar_aging',
        'submenu:input_ar_aging': 'nav-input-ar-aging',
        'submenu:ar_summary': 'nav-ar-summary',
        'menu:inspection': 'nav-inspection',
        'submenu:inspection_dashboard': 'nav-inspection-dashboard',
        'submenu:hotel_inspection': 'nav-hotel-inspection',
        'submenu:task_to_do': 'nav-task-to-do',
        'menu:reports': 'nav-reports',
        'menu:settings': 'nav-settings',
        'menu:trial_balance': 'nav-trial-balance',
        'menu:guest_review': 'nav-guest-review',
        'submenu:guest_review_dashboard': 'nav-guest-review-dashboard',
        'submenu:guest_review_settings': 'nav-guest-review-settings',
        'submenu:guest_review_replies': 'nav-guest-review-replies',
        'menu:audit': 'nav-audit',
        'submenu:agenda_audit': 'nav-agenda-audit',
        'submenu:audit_calendar': 'nav-audit-calendar'
    };

    // Sembunyikan semua item menu yang ada di map terlebih dahulu
    document.querySelectorAll('aside nav ul li').forEach(li => li.classList.add('hidden'));

    // Tampilkan item menu yang dimiliki pengguna
    permissions.forEach(permission => {
        const elementId = permissionMap[permission];
        const element = elementId ? document.getElementById(elementId) : null;
        if (element) {
            const parentLi = element.closest('li');
            if (parentLi) {
                parentLi.classList.remove('hidden');
                // Juga tampilkan parent menu dropdown jika ada submenu yang terlihat
                const parentDropdown = parentLi.closest('li.relative.group');
                if (parentDropdown) {
                    parentDropdown.classList.remove('hidden');
                }
            }
        }
    });
}

/**
 * BARU: Membuka modal untuk menambah pengguna baru.
 */
function openAddUserModal() {
    const modal = document.getElementById('add-user-modal');
    if (modal) {
        document.getElementById('add-user-form').reset();
        document.getElementById('add-user-error').classList.add('hidden');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        // BARU: Panggil fungsi untuk mengisi checklist hotel di modal tambah
        populateHotelChecklist('user-add-hotel-checklist-container', 'user-add-hotel-filter-select-all');
        initHotelFilterDropdown('user-add-hotel-filter-btn', 'user-add-hotel-filter-dropdown', 'user-add-hotel-filter-search', 'user-add-hotel-filter-select-all', 'user-add-hotel-checklist-container', null, 'user-add-hotel-filter-label');
    }
}

/**
 * BARU: Menutup modal tambah pengguna.
 */
function closeAddUserModal() {
    const modal = document.getElementById('add-user-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

/**
 * BARU: Menutup modal edit pengguna.
 */
function closeEditUserModal() {
    const modal = document.getElementById('edit-user-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

/**
 * BARU: Membuka modal untuk menambah Trial Balance.
 * Fungsi ini juga me-reset form ke keadaan awal.
 * @param {boolean} isEditMode - Jika true, form tidak akan di-reset.
 */
function openAddTrialBalanceModal(isEditMode = false) {
    const modal = document.getElementById('add-trial-balance-modal');
    if (modal) {
        if (!isEditMode) {
            // Reset form dan state modal hanya jika bukan mode edit
            document.getElementById('add-trial-balance-form').reset();
            document.getElementById('add-trial-balance-modal-title').textContent = 'Tambah Trial Balance Baru';
            document.getElementById('trial-balance-id').value = '';
            document.getElementById('add-trial-balance-error').classList.add('hidden');
        }

        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

/**
 * BARU: Menutup modal Trial Balance.
 */
function closeAddTrialBalanceModal() {
    const modal = document.getElementById('add-trial-balance-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

/**
 * Menangani perubahan hash di URL untuk routing sisi klien.
 */
function handleHashChange() {
    const hash = window.location.hash;

    if (hash === '#dashboard' || hash === '') {
        showPage('dashboard');
        showMainSettings();
        showMainReports();
    } else if (hash === '#ebook') {
        showPage('ebook');
        showMainSettings();
        showMainReports();
    } else if (hash === '#input-budget') {
        showPage('input-budget');
        showMainSettings();
        showMainReports();
    } else if (hash === '#input-actual') {
        showPage('input-actual');
        showMainSettings();
        showMainReports();
    } else if (hash === '#daily-income-dashboard') {
        showPage('daily-income-dashboard');
        showMainSettings();
        showMainReports();
    } else if (hash === '#input-budget-dsr') {
        showPage('input-budget-dsr');
        showMainSettings();
        showMainReports();
    } else if (hash === '#input-room-production') {
        showPage('input-room-production');
        showMainSettings();
        showMainReports();
    } else if (hash === '#input-actual-dsr') {
        showPage('input-actual-dsr');
        showMainSettings();
        showMainReports();
    } else if (hash === '#slides') {
        showPage('slides');
        showMainSettings();
        showMainReports();
    } else if (hash === '#slides-corporate') {
        showPage('slides-corporate');
        showMainSettings();
        showMainReports();
    } else if (hash === '#input-ar-aging') {
        showPage('input-ar-aging');
        showMainSettings();
        showMainReports();
    } else if (hash === '#ar-summary') {
        showPage('ar-summary');
        showMainSettings();
        showMainReports();
    } else if (hash === '#inspection-dashboard') {
        showPage('inspection-dashboard');
        showMainSettings();
        showMainReports();
    } else if (hash === '#hotel-inspection') {
        showPage('hotel-inspection');
        initHotelInspectionPage(); // Panggil inisialisasi untuk memuat ulang data
        showMainSettings();
        showMainReports();
    } else if (hash === '#task-to-do') {
        showPage('task-to-do');
        showMainSettings();
        showMainReports();
    } else if (hash === '#trial-balance') {
        showPage('trial-balance');
        showMainSettings();
        showMainReports();
    } else if (hash === '#guest-review-dashboard') {
        showPage('guest-review-dashboard');
        initGuestReviewDashboard(); // Panggil inisialisasi untuk dasbor ulasan
        showMainSettings();
        showMainReports();
    } else if (hash === '#guest-review-settings') {
        showPage('guest-review-settings');
        initGuestReviewSettingsPage(); // Panggil inisialisasi
        showMainSettings();
        showMainReports();
    } else if (hash === '#guest-review-replies') {
        showPage('guest-review-replies');
        initGuestReviewRepliesPage(); // PERBAIKAN: Panggil fungsi inisialisasi dari sini
        showMainSettings();
        showMainReports();
    } else if (hash === '#agenda-audit') { // BARU
        showPage('agenda-audit');
        initAuditAgendaPage(); // Panggil inisialisasi untuk halaman agenda audit
        showMainSettings();
        showMainReports();
    } else if (hash === '#audit-calendar') { // BARU
        showPage('audit-calendar');
        initializeAuditCalendar();
        showMainSettings();
        showMainReports();
    } else if (hash.startsWith('#audit-report/')) {
        const agendaId = hash.split('/')[1];
        showPage('audit-report');
        initAuditReportPage(agendaId);
        showMainSettings();
        showMainReports();
    } else if (hash === '#google-drive') {
        showPage('google-drive');
        showMainSettings();
        showMainReports();
    } else if (hash.startsWith('#inspection/form/')) {
        // BARU: Tangani rute untuk menampilkan formulir inspeksi
        const inspectionId = hash.split('/')[2].split('?')[0]; // Ambil ID sebelum tanda tanya
        showInspectionFormPage(inspectionId);
        showMainReports();
    } else if (hash.startsWith('#reports')) {
        showPage('reports');
        showMainSettings(); // Reset halaman settings saat masuk ke reports
        if (hash === '#reports/income-statement') {
            showReportDetail('income-statement');
            initIncomeStatementReport();
        } else if (hash === '#reports/room-division') {
            showReportDetail('room-division');
            initializeReportFilters('rd');
        } else if (hash === '#reports/fnb-division') {
            showReportDetail('fnb-division');
            initializeReportFilters('fnb');
        } else if (hash === '#reports/monthly-summary') {
            showReportDetail('monthly-summary');
            initMonthlySummaryReport();
        } else {
            showMainReports();
        }
    } else if (hash.startsWith('#settings')) {
        showPage('settings');
        showMainReports();
        if (hash === '#settings/users') {
            showUserManagement();
            loadUsersTable(); // Panggil fungsi untuk memuat data pengguna
        } else if (hash === '#settings/hotels') {
            showHotelManagement();
        } else if (hash === '#settings/audit-checklists') { // BARU
            showAuditChecklistsManagement();
        } else if (hash === '#settings/opening-balance-dsr') {
            showOpeningBalanceManagement();
        } else if (hash === '#settings/inspection-types') {
            showInspectionTypesManagement();
        } else if (hash === '#settings/roles') {
            showRoleManagement();
        } else {
            showMainSettings();
        }
    } else {
        window.location.hash = '#dashboard';
    }
}

/**
 * Menampilkan menu utama di halaman Laporan (grid kartu).
 */
function showMainReports() {
    document.getElementById('reports-grid').classList.remove('hidden');
    document.querySelectorAll('.report-detail-content').forEach(el => el.classList.add('hidden'));
}

/**
 * Menampilkan konten detail laporan yang spesifik dan menyembunyikan grid utama.
 * @param {string} reportName - Nama laporan (misal: 'income-statement').
 */
function showReportDetail(reportName) {
    document.getElementById('reports-grid').classList.add('hidden');
    document.querySelectorAll('.report-detail-content').forEach(el => el.classList.add('hidden'));
    document.getElementById(`report-${reportName}`).classList.remove('hidden');
}

/**
 * Menampilkan menu utama di halaman Pengaturan.
 */
function showMainSettings() {
    document.getElementById('settings-grid').classList.remove('hidden');
    document.getElementById('user-management-section').classList.add('hidden');
    document.getElementById('opening-balance-dsr-section').classList.add('hidden');
    document.getElementById('hotel-management-section').classList.add('hidden');
    document.getElementById('audit-checklists-management-section')?.classList.add('hidden'); // BARU
    document.getElementById('inspection-types-management-section').classList.add('hidden');
    document.getElementById('role-management-section').classList.add('hidden');
}

/**
 * Menampilkan bagian Kelola Pengguna dan menyembunyikan yang lain.
 */
function showUserManagement() {
    showMainSettings(); // Sembunyikan semua dulu
    document.getElementById('settings-grid').classList.add('hidden');
    document.getElementById('user-management-section').classList.remove('hidden');
    if (typeof loadUsersTable === 'function') loadUsersTable();
}

/**
 * Menampilkan bagian Kelola Hotel dan menyembunyikan yang lain.
 */
function showHotelManagement() {
    showMainSettings(); // Sembunyikan semua dulu
    document.getElementById('settings-grid').classList.add('hidden');
    document.getElementById('hotel-management-section').classList.remove('hidden');
    if (typeof loadHotelsTable === 'function') loadHotelsTable();
}

/**
 * Menampilkan bagian Opening Balance DSR dan menyembunyikan yang lain.
 */
function showOpeningBalanceManagement() {
    showMainSettings(); // Sembunyikan semua dulu
    document.getElementById('settings-grid').classList.add('hidden');
    document.getElementById('opening-balance-dsr-section').classList.remove('hidden');
    if (typeof loadOpeningBalanceTable === 'function') loadOpeningBalanceTable();
}

/**
 * Menampilkan bagian Kelola Role & Hak Akses dan menyembunyikan yang lain.
 */
function showRoleManagement() {
    showMainSettings(); // Sembunyikan semua dulu
    document.getElementById('settings-grid').classList.add('hidden');
    document.getElementById('role-management-section').classList.remove('hidden');
    if (typeof initRoleManagement === 'function') {
        initRoleManagement();
    }
}

/**
 * BARU: Menampilkan bagian Kelola Checklist Audit dan menyembunyikan yang lain.
 */
function showAuditChecklistsManagement() {
    showMainSettings(); // Sembunyikan semua dulu
    document.getElementById('settings-grid').classList.add('hidden');
    const section = document.getElementById('audit-checklists-management-section');
    if (section) {
        section.classList.remove('hidden');
    }
    // Panggil fungsi inisialisasi di sini jika sudah ada
    if (typeof initAuditChecklistManagementPage === 'function') {
        initAuditChecklistManagementPage();
    }
}

/**
 * BARU: Menampilkan bagian Kelola Tipe Inspeksi dan menyembunyikan yang lain.
 */
function showInspectionTypesManagement() {
    document.getElementById('settings-grid').classList.add('hidden');
    document.getElementById('user-management-section').classList.add('hidden');
    document.getElementById('hotel-management-section').classList.add('hidden');
    document.getElementById('opening-balance-dsr-section').classList.add('hidden');
    document.getElementById('audit-checklists-management-section')?.classList.add('hidden');
    document.getElementById('role-management-section').classList.add('hidden');
    document.getElementById('inspection-types-management-section').classList.remove('hidden');
    initInspectionTypesManagementPage(); // Panggil inisialisasi
}

/**
 * BARU: Menampilkan modal untuk melihat foto.
 * @param {string} imageUrl - URL lengkap dari gambar yang akan ditampilkan.
 */
function showPhotoModal(imageUrl) {
    const modal = document.getElementById('photo-viewer-modal');
    const img = document.getElementById('photo-viewer-img');
    if (modal && img) {
        img.src = imageUrl;
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

/**
 * BARU: Menutup modal penampil foto.
 */
function closePhotoModal() {
    document.getElementById('photo-viewer-modal')?.classList.add('hidden');
}

/**
 * BARU: Menampilkan modal detail tugas.
 */
function showTaskDetailModal() {
    const modal = document.getElementById('task-detail-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

/**
 * BARU: Menutup modal detail tugas.
 */
function closeTaskDetailModal() {
    document.getElementById('task-detail-modal')?.classList.add('hidden');
}

/**
 * Memvalidasi apakah sebuah URL adalah link Google Drive yang valid.
 * @param {string} url - URL yang akan divalidasi.
 * @returns {boolean} - True jika valid, false jika tidak.
 */
function isGoogleDriveLink(url) {
    if (!url) return false;
    // Regex untuk mencocokkan URL Google Drive (docs, sheets, slides, forms)
    const googleDriveRegex = /^(https?:\/\/)?(www\.)?(docs\.google\.com\/(document|spreadsheets|presentation|forms)\/d\/[a-zA-Z0-9_-]+|drive\.google\.com\/(file\/d\/[a-zA-Z0-9_-]+|open\?id=[a-zA-Z0-9_-]+))/;
    return googleDriveRegex.test(url);
}

/**
 * Menampilkan atau menyembunyikan indikator validasi di sebelah input field.
 * @param {string} inputId - ID dari input field.
 * @param {boolean} isValid - Status validasi.
 */
function showValidationIndicator(inputId, isValid) {
    const inputElement = document.getElementById(inputId);
    const indicator = document.getElementById(`${inputId}-validation`);
    if (!indicator || !inputElement) return;

    if (isValid) {
        indicator.innerHTML = '<i class="fa-solid fa-check-circle text-green-500"></i>';
        indicator.classList.remove('hidden');
        inputElement.classList.add('is-valid');
        inputElement.classList.remove('is-invalid');
    } else {
        indicator.innerHTML = '<i class="fa-solid fa-times-circle text-red-500"></i>';
        indicator.classList.remove('hidden');
        inputElement.classList.add('is-invalid');
        inputElement.classList.remove('is-valid');
    }
}
