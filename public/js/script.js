// --- GLOBAL VARIABLES ---
let realizationChartInstance = null;
let gopChartInstance = null;
let ratioComparisonChartInstance = null;
let hotelAchievementChartInstance = null;
let roomProductionSegmentChartInstance = null;
let roomProductionArrChartInstance = null;
let occupancyArrChartInstance = null; // BARU
let dailyIncomeChartInstance = null;
let dailyOccupancyGaugeChartInstance = null;
let pageFlip = null; 
// BARU: Variabel untuk chart di Inspection Dashboard
let inspectionScoreTrendChartInstance = null;
let inspectionTypeDistributionChartInstance = null;
let inspectionTaskPriorityChartInstance = null;

let pdfUploadQueue = []; 
let currentDsrOpeningBalance = 0;
let currentZoom = 1.0;

// --- AUDIO SOUND EFFECT ---
const flipSound = new Audio('assets/sounds/flip-sound.mp3');
flipSound.volume = 0.5;

// --- MAIN INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        // Jika di halaman selain login dan tidak ada token, redirect
        if (!window.location.pathname.endsWith('login.html')) {
            window.location.href = 'login.html';
        }
        return; // Hentikan eksekusi jika tidak ada token
    }

    // Inisialisasi halaman utama
    loadBooksFromAPI(); // initDashboardPage() sekarang dipanggil dari ui.js
    initEbookPage();

    // Event listener umum
    document.getElementById('dashboard-year-filter')?.addEventListener('change', loadDashboardStats);
    document.getElementById('dashboard-month-filter')?.addEventListener('change', loadDashboardStats);
    document.getElementById('ebook-hotel-filter')?.addEventListener('change', loadBooksFromAPI);
    document.getElementById('dashboard-brand-filter')?.addEventListener('change', handleDashboardBrandFilterChange);
    initHotelFilterDropdown('dashboard-hotel-filter-btn', 'dashboard-hotel-filter-dropdown', 'dashboard-hotel-filter-search', 'dashboard-hotel-filter-select-all', 'dashboard-hotel-checklist-container', 'dashboard-hotel-filter-apply', 'dashboard-hotel-filter-label');
    document.getElementById('profile-button')?.addEventListener('click', openProfileModal);
    document.getElementById('change-password-form')?.addEventListener('submit', handleChangePasswordSubmit);
    document.getElementById('reset-arr-chart-btn')?.addEventListener('click', loadDashboardStats);
    
    // Inisialisasi halaman input
    if (document.getElementById('page-input-budget')) initBudgetPage();
    if (document.getElementById('page-input-actual')) initActualPage();
    
    // Inisialisasi halaman inspection
    // PERUBAHAN: Gunakan async/await untuk memastikan filter terisi sebelum data dimuat
    if (document.getElementById('page-inspection-dashboard')) { (async () => {
        // Panggil fungsi inisialisasi dasar dari dashboard.js
        initInspectionDashboard(); 
        
        // Inisialisasi filter spesifik untuk dashboard inspeksi
        const yearFilter = document.getElementById('inspection-dashboard-year-filter');
        const monthFilter = document.getElementById('inspection-dashboard-month-filter');
        const brandFilter = document.getElementById('inspection-dashboard-brand-filter'); // BARU
        
        // PERUBAHAN: Tunggu semua dropdown selesai diisi
        await Promise.all([
            populateYearDropdown('inspection-dashboard-year-filter'),
            populateMonthDropdown('inspection-dashboard-month-filter', true),
            populateBrandFilterDropdown('inspection-dashboard-brand-filter'), // BARU
            populateHotelChecklist('inspection-dashboard-hotel-checklist-container', 'inspection-dashboard-hotel-filter-select-all', 'inspection-dashboard-hotel-filter-label') // BARU
        ]);

        // BARU: Inisialisasi filter hotel multi-pilih
        initHotelFilterDropdown(
            'inspection-dashboard-hotel-filter-btn', 
            'inspection-dashboard-hotel-filter-dropdown', 
            'inspection-dashboard-hotel-filter-search', 
            'inspection-dashboard-hotel-filter-select-all', 
            'inspection-dashboard-hotel-checklist-container', 
            'inspection-dashboard-hotel-filter-apply', 
            'inspection-dashboard-hotel-filter-label'
        );

        // Tambahkan event listener untuk semua filter
        if(yearFilter) yearFilter.addEventListener('change', loadInspectionDashboardData);
        if(monthFilter) monthFilter.addEventListener('change', loadInspectionDashboardData);
        if(brandFilter) brandFilter.addEventListener('change', loadInspectionDashboardData);
        // Tombol apply pada filter hotel akan memanggil loadInspectionDashboardData
        document.getElementById('inspection-dashboard-hotel-filter-apply')?.addEventListener('click', loadInspectionDashboardData);
        
        await loadInspectionDashboardData(); // Muat data awal setelah filter siap
    })();}
    if (document.getElementById('page-hotel-inspection')) initHotelInspectionPage(); // Tetap
    if (document.getElementById('page-task-to-do')) initTaskToDoPage(); // Tetap
    if (document.getElementById('page-settings')) initInspectionTypesManagementPage();

    if (document.getElementById('page-input-budget-dsr') || document.getElementById('page-input-actual-dsr')) {
        initDsrPage('budget');
        initDsrPage('actual');
        initArSummaryPage();
    }
    if (document.getElementById('page-input-room-production')) initRoomProductionPage();
    if (document.getElementById('page-input-ar-aging')) initArAgingPage();
    if (document.getElementById('page-input-hotel-competitor')) initHotelCompetitorPage();

    // Inisialisasi halaman slides
    if (document.getElementById('page-slides')) initSlidesPage();
    if (document.getElementById('page-slides-corporate')) initSlidesCorporatePage();
    
    // Inisialisasi dashboard lain
    if (document.getElementById('page-daily-income-dashboard')) initDailyIncomeDashboard();

    // --- ROUTING & USER PROFILE ---
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        document.querySelector('.profile-name').textContent = user.full_name || user.username;
        document.querySelector('.profile-email').textContent = user.email;
        document.querySelector('.profile-avatar').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || user.username)}&background=random`;
        
        // BARU: Terapkan hak akses untuk menampilkan/menyembunyikan menu sidebar secara dinamis
        applyUserPermissions();
        
        handleHashChange();
        window.addEventListener('hashchange', handleHashChange);
        initReportListeners();
    }
});
