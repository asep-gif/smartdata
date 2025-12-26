// --- GLOBAL DASHBOARD STATE ---
let currentStatsView = 'revenue'; // 'revenue', 'expenses', or 'gop'
let dashboardStatsData = {}; // To store the fetched stats data

// --- DASHBOARD FUNCTIONS ---

/**
 * Inisialisasi halaman Dashboard dengan mengisi semua filter yang diperlukan.
 */
async function initDashboardPage() {
    // Muat semua filter secara paralel
    await Promise.all([ 
        populateYearDropdown('dashboard-year-filter'),
        populateMonthDropdown('dashboard-month-filter', true),
        populateBrandFilterDropdown('dashboard-brand-filter'),
        populateHotelChecklist('dashboard-hotel-checklist-container', 'dashboard-hotel-filter-select-all', 'dashboard-hotel-filter-label')
    ]);

    // Initialize hotel filter dropdown functionality
    initHotelFilterDropdown(
        'dashboard-hotel-filter-btn',
        'dashboard-hotel-filter-dropdown',
        'dashboard-hotel-filter-search',
        'dashboard-hotel-filter-select-all',
        'dashboard-hotel-checklist-container',
        'dashboard-hotel-filter-apply',
        'dashboard-hotel-filter-label'
    );

    // Add event listeners for filters
    document.getElementById('dashboard-year-filter')?.addEventListener('change', loadDashboardStats);
    document.getElementById('dashboard-month-filter')?.addEventListener('change', loadDashboardStats);

    const brandFilter = document.getElementById('dashboard-brand-filter');
    if (brandFilter) {
        brandFilter.addEventListener('change', () => {
            // Reset hotel filter if brand is changed
            const hotelCheckboxes = document.querySelectorAll('#dashboard-hotel-checklist-container input[type="checkbox"]');
            hotelCheckboxes.forEach(cb => cb.checked = false);
            updateHotelFilterLabel('dashboard-hotel-filter-label', 'dashboard-hotel-checklist-container');
            loadDashboardStats();
        });
    }

    const applyHotelFilterBtn = document.getElementById('dashboard-hotel-filter-apply');
    if (applyHotelFilterBtn) {
        applyHotelFilterBtn.addEventListener('click', () => {
            // Reset brand filter if hotel filter is applied
            document.getElementById('dashboard-brand-filter').value = 'all';
            document.getElementById('dashboard-hotel-filter-dropdown').classList.add('hidden');
            loadDashboardStats();
        });
    }

    // Inisialisasi fungsionalitas drag-and-drop untuk chart
    initDashboardDragAndDrop();

    // BARU: Tambahkan event listener untuk tombol toggle statistik
    const statsToggleButtons = document.getElementById('stats-toggle-buttons');
    if (statsToggleButtons) {
        statsToggleButtons.addEventListener('click', (event) => {
            const button = event.target.closest('.stat-toggle-btn');
            if (button && !button.classList.contains('active-stat-toggle-btn')) {
                currentStatsView = button.dataset.type;
                
                document.querySelectorAll('.stat-toggle-btn').forEach(btn => {
                    btn.classList.remove('active-stat-toggle-btn');
                });
                button.classList.add('active-stat-toggle-btn');

                updateStatsCardsView();
            }
        });
    }

    // Panggil loadDashboardStats secara eksplisit setelah semua filter dan event siap.
    await loadDashboardStats();
}

/**
 * Mengatur urutan kartu chart berdasarkan data dari localStorage.
 */
function loadChartOrder() {
    const grid = document.getElementById('dashboard-charts-grid');
    const savedOrder = localStorage.getItem('dashboardChartOrder');
    if (savedOrder && grid) {
        const order = JSON.parse(savedOrder);
        const items = Array.from(grid.children);
        const itemMap = new Map(items.map(item => [item.dataset.id, item]));
        
        // Hapus semua anak dari grid
        while (grid.firstChild) {
            grid.removeChild(grid.firstChild);
        }

        // Tambahkan kembali anak sesuai urutan yang tersimpan
        order.forEach(id => {
            const item = itemMap.get(id);
            if (item) {
                grid.appendChild(item);
            }
        });
    }
}

/**
 * Inisialisasi SortableJS untuk memungkinkan drag-and-drop pada kartu chart.
 */
function initDashboardDragAndDrop() {
    // Pertama, muat urutan yang tersimpan sebelum menginisialisasi Sortable
    loadChartOrder();

    const grid = document.getElementById('dashboard-charts-grid');
    if (grid) {
        new Sortable(grid, {
            animation: 150,
            handle: '.drag-handle', // Tentukan elemen handle untuk drag
            ghostClass: 'sortable-ghost',
            onEnd: function (evt) {
                const order = Array.from(grid.children).map(item => item.dataset.id);
                localStorage.setItem('dashboardChartOrder', JSON.stringify(order));
            }
        });
    }
}

/**
 * Mengambil data teragregasi per hotel untuk grafik achievement.
 * Ini menggunakan endpoint laporan yang ada dan memprosesnya kembali.
 * @param {URLSearchParams} params - Parameter filter yang sama dengan `loadDashboardStats`.
 * @returns {Promise<Object>} - Promise yang resolve dengan { budgetData, actualData, allHotels }.
 */
async function getHotelAchievementData(params) {
    const user = JSON.parse(localStorage.getItem('user'));
    let hotelsPromise;

    // BARU: Jika staff, ambil data hotel dari user object. Jika bukan, fetch dari API.
    if (user && user.role === 'staff') {
        hotelsPromise = Promise.resolve(user.hotels || []);
    } else {
        hotelsPromise = fetchAPI('/api/hotels');
    }

    // Ambil semua hotel dan data laporan achievement secara paralel
    const [hotelsResponse, reportData] = await Promise.all([
        hotelsPromise,
        fetchAPI(`/api/reports/hotel-achievement?${params.toString()}`) // Endpoint sudah benar
    ]);

    const allHotels = hotelsResponse; // Sudah dalam format JSON

    // Dengan endpoint baru, `reportData` sekarang memiliki format yang benar:
    // { budget: { hotel_id_1: { total_revenue: [...] } }, actual: { hotel_id_1: { ... } } }

    return { budgetData: reportData.budget, actualData: reportData.actual, allHotels };
}

/**
 * BARU: Memperbarui kartu statistik berdasarkan tampilan yang dipilih (Revenue, Expenses, GOP).
 */
function updateStatsCardsView() {
    const stats = dashboardStatsData;
    if (!stats || Object.keys(stats).length === 0) {
        ['stats-total-budget', 'stats-total-actual', 'stats-remaining-budget'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = '...';
        });
        return;
    }

    const budgetEl = document.getElementById('stats-total-budget');
    const actualEl = document.getElementById('stats-total-actual');
    const varianceEl = document.getElementById('stats-remaining-budget');

    const budgetLabelEl = document.getElementById('stats-budget-label');
    const actualLabelEl = document.getElementById('stats-actual-label');
    const varianceLabelEl = document.getElementById('stats-variance-label');

    let budgetValue, actualValue;
    let budgetLabel, actualLabel, varianceLabel;
    let isExpense = false;

    switch (currentStatsView) {
        case 'expenses':
            budgetLabel = 'Total Budget Expenses';
            actualLabel = 'Total Actual Expenses';
            varianceLabel = 'Selisih Budget Expenses';
            budgetValue = stats.totalBudgetExpenses || 0;
            actualValue = stats.totalActualExpenses || 0;
            isExpense = true;
            break;
        case 'gop':
            budgetLabel = 'Total Budget GOP';
            actualLabel = 'Total Actual GOP';
            varianceLabel = 'Selisih Budget GOP';
            budgetValue = stats.totalBudgetGop || 0;
            actualValue = stats.totalActualGop || 0;
            break;
        case 'revenue':
        default:
            budgetLabel = 'Total Budget Revenue';
            actualLabel = 'Total Actual Revenue';
            varianceLabel = 'Selisih Budget Revenue';
            budgetValue = stats.totalBudgetRevenue || 0;
            actualValue = stats.totalActualRevenue || 0;
            break;
    }

    // Update labels
    if(budgetLabelEl) budgetLabelEl.textContent = budgetLabel;
    if(actualLabelEl) actualLabelEl.textContent = actualLabel;
    if(varianceLabelEl) varianceLabelEl.textContent = varianceLabel;

    // Update values
    const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);
    if(budgetEl) budgetEl.textContent = formatCurrency(budgetValue);
    if(actualEl) actualEl.textContent = formatCurrency(actualValue);

    const varianceValue = actualValue - budgetValue;
    if(varianceEl) varianceEl.textContent = formatCurrency(varianceValue);

    // Update variance color
    if(varianceEl) {
        varianceEl.classList.remove('text-green-600', 'text-red-600', 'text-slate-800');
        // For expenses, a negative variance (less spending) is good. For others, positive is good.
        const varianceForColor = isExpense ? varianceValue * -1 : varianceValue;
        if (varianceForColor > 0) {
            varianceEl.classList.add('text-green-600');
        } else if (varianceForColor < 0) {
            varianceEl.classList.add('text-red-600');
        } else {
            varianceEl.classList.add('text-slate-800');
        }
    }
}

/**
 * Initializes the Inspection Dashboard page.
 * This function is called when the Inspection Dashboard page is loaded.
 */
function initInspectionDashboard() {
    console.log("Inspection Dashboard page initialized.");
    // Logika inisialisasi filter dan pemuatan data awal telah dipindahkan ke script.js
    // untuk memastikan `populateYearFilter` terdefinisi.
}

/**
 * Fetches and displays data for the inspection dashboard.
 */
async function loadInspectionDashboardData() {
    console.log("Loading inspection dashboard data from API...");
    
    // Ambil nilai filter
    const year = document.getElementById('inspection-dashboard-year-filter')?.value;
    const month = document.getElementById('inspection-dashboard-month-filter')?.value;
    const brand = document.getElementById('inspection-dashboard-brand-filter')?.value;
    const selectedHotels = getSelectedHotels('inspection-dashboard'); // Gunakan helper

    const params = new URLSearchParams();
    if (year) params.append('year', year);
    if (month && month !== 'all') params.append('month', month);

    if (selectedHotels.length > 0) {
        params.append('hotelId', selectedHotels.join(','));
    }
    if (brand && brand !== 'all') {
        params.append('brand', brand);
    }

    try {
        const data = await fetchAPI(`/api/inspections/dashboard?${params.toString()}`);

        // 1. Update Stat Cards
        document.getElementById('inspection-stats-total').textContent = data.stats.totalInspections;
        document.getElementById('inspection-stats-avg-score').textContent = data.stats.averageScore;
        document.getElementById('inspection-stats-open-tasks').textContent = data.stats.openTasks;
        document.getElementById('inspection-stats-overdue-tasks').textContent = data.stats.overdueTasks;

        // 2. Initialize or Update Charts
        initScoreTrendChart(data.scoreTrend);
        initTypeDistributionChart(data.typeDistribution);
        initTaskPriorityChart(data.taskPriority);

        // 3. Populate Recent Activity
        const activityList = document.getElementById('inspection-recent-activity-list');
        if (data.recentActivity && data.recentActivity.length > 0) {
            activityList.innerHTML = data.recentActivity.map(item => {
                const areaInfo = item.room_number_or_area ? ` di <strong>${item.room_number_or_area}</strong>` : '';
                const description = item.type === 'inspection'
                    ? `<i>${item.item_name || 'Inspeksi'}</i> selesai di ${item.hotel_name || 'Unknown Hotel'}${areaInfo}`
                    : `Tugas prioritas tinggi baru di ${item.hotel_name || 'Unknown Hotel'}${areaInfo}`;
                
                return `
                    <li class="flex items-start gap-3">
                        <div class="w-8 h-8 ${item.iconBg} ${item.iconColor} rounded-full flex items-center justify-center flex-shrink-0 text-sm"><i class="fa-solid ${item.icon}"></i></div>
                        <div>
                            <p class="text-sm text-slate-800">${description}</p>
                            <p class="text-xs text-slate-500">${item.time}</p>
                        </div>
                    </li>`;
            }).join('');
        } else {
            activityList.innerHTML = '<p class="text-sm text-slate-500">No recent activity.</p>';
        }

    } catch (error) {
        console.error("Failed to load inspection dashboard data:", error);
        showToast("Gagal memuat data dashboard inspeksi.", "error");
        // Optionally, clear the dashboard or show error states
        document.getElementById('inspection-stats-total').textContent = 'N/A';
        document.getElementById('inspection-stats-avg-score').textContent = 'N/A';
        document.getElementById('inspection-stats-open-tasks').textContent = 'N/A';
        document.getElementById('inspection-stats-overdue-tasks').textContent = 'N/A';
    }
}

/**
 * Initializes the Average Score Trend line chart.
 * @param {object} data - Data for the chart.
 */
function initScoreTrendChart(data) {
    const ctx = document.getElementById('inspection-score-trend-chart').getContext('2d');
    if (window.inspectionScoreTrendChartInstance) {
        window.inspectionScoreTrendChartInstance.destroy();
    }
    window.inspectionScoreTrendChartInstance = new Chart(ctx, {
        type: 'line',
        data: { labels: data.labels, datasets: [{ label: 'Average Score', data: data.scores, borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', fill: true, tension: 0.4 }] },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: false, max: 100 } } }
    });
}

/**
 * Initializes the Inspections by Type doughnut chart.
 * @param {object} data - Data for the chart.
 */
function initTypeDistributionChart(data) {
    const ctx = document.getElementById('inspection-type-distribution-chart').getContext('2d');
    if (window.inspectionTypeDistributionChartInstance) {
        window.inspectionTypeDistributionChartInstance.destroy();
    }
    window.inspectionTypeDistributionChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: { labels: data.labels, datasets: [{ label: 'Inspections', data: data.counts, backgroundColor: ['#3b82f6', '#10b981', '#f97316', '#ef4444', '#8b5cf6', '#d946ef'] }] },
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            plugins: { 
                legend: { 
                    position: 'bottom', // PERUBAHAN: Pindahkan legenda ke bawah
                    labels: {
                        boxWidth: 12, // Perkecil kotak warna
                        font: { size: 11 } // Perkecil ukuran font
                    }
                } 
            },
            // Sesuaikan padding agar grafik tidak terlalu besar
            layout: { 
                padding: 20
            }
        }
    });
}

/**
 * Initializes the Tasks by Priority bar chart.
 * @param {object} data - Data for the chart.
 */
function initTaskPriorityChart(data) {
    const ctx = document.getElementById('inspection-task-priority-chart').getContext('2d');
    if (window.inspectionTaskPriorityChartInstance) {
        window.inspectionTaskPriorityChartInstance.destroy();
    }
    window.inspectionTaskPriorityChartInstance = new Chart(ctx, {
        type: 'bar',
        data: { labels: data.labels, datasets: [{ label: 'Task Count', data: data.counts, backgroundColor: ['#ef4444', '#f97316', '#3b82f6'] }] },
        options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false } } }
    });
}

// --- FUNGSI UNTUK MEMUAT STATISTIK DASHBOARD ---
async function loadDashboardStats() {
    const yearFilter = document.getElementById('dashboard-year-filter');
    const monthFilter = document.getElementById('dashboard-month-filter');
    const brandFilter = document.getElementById('dashboard-brand-filter');
    
    // Dynamically update P&L summary title
    const plSummaryTitle = document.querySelector('#pl-summary-table-card h4');
    if (plSummaryTitle) {
        const isYTD = monthFilter.value === 'all';
        const periodText = isYTD ? 'YTD' : 'MTD';
        const periodColor = isYTD ? 'text-green-600' : 'text-blue-600';
        plSummaryTitle.innerHTML = `Ringkasan Performa Hotel (P&L) <span class="${periodColor} ml-2">(${periodText})</span>`;
    }

    const params = new URLSearchParams();

    if (yearFilter && yearFilter.value) {
        params.append('year', yearFilter.value);
    }
    if (monthFilter && monthFilter.value && monthFilter.value !== 'all') {
        params.append('month', monthFilter.value);
    }

    // Untuk admin/manager, tambahkan filter brand/hotel. Untuk staff, backend akan menanganinya.
    const user = JSON.parse(localStorage.getItem('user'));

    const selectedHotelIds = getSelectedHotels('dashboard');
    if (selectedHotelIds.length > 0) {
        params.append('hotels', selectedHotelIds.join(','));
    } else if (brandFilter && brandFilter.value && brandFilter.value !== 'all') {
        const selectedBrand = brandFilter.value;
        params.append('brand', selectedBrand);
    }

    // Ambil elemen-elemen statistik
    const hotelCountEl = document.getElementById('stats-hotel-count');
    const budgetYearLabel = document.getElementById('stats-budget-year-label');
    const actualYearLabel = document.getElementById('stats-actual-year-label');

    // Jika elemen tidak ada, hentikan fungsi
    if (!hotelCountEl || !budgetYearLabel || !actualYearLabel) return;

    try {
        const queryString = params.toString();
        const stats = await fetchAPI(`/api/dashboard/stats${queryString ? '?' + queryString : ''}`);
        
        // BARU: Simpan data statistik secara global
        dashboardStatsData = stats;

        // Update label tahun pada kartu statistik
        const selectedYear = yearFilter.value;
        budgetYearLabel.textContent = `Data Tahun ${selectedYear}`;
        actualYearLabel.textContent = `Realisasi Tahun ${selectedYear}`;

        // Update jumlah hotel
        hotelCountEl.textContent = `${stats.hotelCount} Hotel`;

        // BARU: Update kartu Occupancy dan ARR
        const occupancyActualEl = document.getElementById('stats-occupancy-actual');
        const occupancyBudgetEl = document.getElementById('stats-occupancy-budget');
        const occupancyVarianceEl = document.getElementById('stats-occupancy-variance');
        const arrActualEl = document.getElementById('stats-arr-actual');
        const arrBudgetEl = document.getElementById('stats-arr-budget');
        const arrVarianceEl = document.getElementById('stats-arr-variance');

        const formatPercent = (val) => `${(val || 0).toFixed(1)}%`;
        const formatCurrencyShort = (val) => {
            if (val >= 1_000_000) return `Rp ${(val / 1_000_000).toFixed(1)} Jt`;
            if (val >= 1_000) return `Rp ${(val / 1_000).toFixed(0)} Rb`;
            return `Rp ${formatNumber(val || 0, { decimalPlaces: 0 })}`;
        };
        const getVarianceColor = (variance) => variance > 0 ? 'text-green-600' : (variance < 0 ? 'text-red-600' : 'text-slate-500');

        if (occupancyActualEl) occupancyActualEl.textContent = formatPercent(stats.occupancy.actual);
        if (occupancyBudgetEl) occupancyBudgetEl.textContent = formatPercent(stats.occupancy.budget);
        if (occupancyVarianceEl) {
            const variance = stats.occupancy.actual - stats.occupancy.budget;
            occupancyVarianceEl.textContent = `${variance > 0 ? '+' : ''}${formatPercent(variance)}`;
            occupancyVarianceEl.className = `text-xs font-semibold ${getVarianceColor(variance)}`;
        }

        if (arrActualEl) arrActualEl.textContent = formatCurrencyShort(stats.arr.actual);
        if (arrBudgetEl) arrBudgetEl.textContent = formatCurrencyShort(stats.arr.budget);
        if (arrVarianceEl) {
            const variance = stats.arr.actual - stats.arr.budget;
            const varianceSign = variance > 0 ? '+' : '';
            // Tampilkan variance sebagai persentase jika budget > 0
            const varianceText = stats.arr.budget > 0 ? `${varianceSign}${((variance / stats.arr.budget) * 100).toFixed(0)}%` : formatCurrencyShort(variance);
            arrVarianceEl.textContent = varianceText;
            arrVarianceEl.className = `text-xs font-semibold ${getVarianceColor(variance)}`;
        }

        // BARU: Panggil fungsi untuk update kartu statistik sesuai view yg aktif
        updateStatsCardsView();

        // Update chart realisasi bulanan
        initRealizationChart(stats.monthlyBudgetRevenue, stats.monthlyActualRevenue);

        // Update chart realisasi GOP bulanan
        initGopChart(stats.monthlyBudgetGop, stats.monthlyActualGop);

        // BARU: Update chart perbandingan Occupancy & ARR
        initOccupancyArrChart(stats.monthlyOccArr);

        // BARU: Update chart perbandingan rasio
        initRatioComparisonChart(stats.ratios.budget, stats.ratios.actual);

        // --- BARU: Logika Sinkronisasi Warna Grafik Segment ---
        const segmentLabels = stats.roomProductionBySegment?.labels || [];
        const segmentData = stats.roomProductionBySegment?.data || [];
        const arrLabels = stats.roomProductionByArr?.labels || [];
        const arrData = stats.roomProductionByArr?.data || [];

        // 1. Buat palet warna dan peta warna berdasarkan data segment (pie chart)
        const colorMap = new Map();
        const segmentColors = segmentLabels.map((label, index) => {
            const hue = (index * 360 / segmentLabels.length) % 360;
            const color = `hsl(${hue}, 70%, 60%)`;
            colorMap.set(label, color); // Simpan warna untuk setiap segment
            return color;
        });

        // 2. Tentukan warna untuk grafik ARR berdasarkan peta warna yang sudah dibuat
        const arrColors = arrLabels.map(label => colorMap.get(label) || '#cccccc'); // Gunakan abu-abu jika segment tidak ada di pie chart

        // 3. Inisialisasi kedua grafik dengan warna yang sudah sinkron
        initRoomProductionSegmentChart(segmentLabels, segmentData, segmentColors);
        initRoomProductionArrChart(arrLabels, arrData, arrColors);
        
        // --- RESET TAMPILAN GRAFIK ARR ---
        document.getElementById('arr-chart-title').textContent = 'ARR Room Production by Market Segment';
        document.getElementById('reset-arr-chart-btn').classList.add('hidden');
        
        // Concurrently load data for all dashboard components
        await Promise.all([
            (async () => {
                const achievementData = await getHotelAchievementData(params);
                renderHotelAchievementChart(achievementData.budgetData, achievementData.actualData, achievementData.allHotels);
            })(),
            loadPLSummaryData(params) // Load P&L summary table data
        ]);

    } catch (error) {
        console.error('Error in loadDashboardStats:', error);
        hotelCountEl.textContent = 'N/A';
        
        // BARU: Kosongkan data dan reset kartu
        dashboardStatsData = {};
        updateStatsCardsView();
        
        // Reset kartu Occupancy & ARR
        ['stats-occupancy-actual', 'stats-occupancy-budget', 'stats-occupancy-variance', 
         'stats-arr-actual', 'stats-arr-budget', 'stats-arr-variance'].forEach(id => {
            document.getElementById(id).textContent = '...';
        });

        initRealizationChart();
        initGopChart();
        initOccupancyArrChart(); // BARU
        initRatioComparisonChart();
        initRoomProductionSegmentChart();
        initRoomProductionArrChart();
        renderHotelAchievementChart([], [], []);
        document.getElementById('pl-summary-table-body').innerHTML = `<tr><td colspan="19" class="p-4 text-center text-red-500">Gagal memuat data: ${error.message}</td></tr>`;
    }
}

/**
 * Memuat dan merender data untuk tabel ringkasan P&L.
 * @param {URLSearchParams} params - Parameter filter.
 */
async function loadPLSummaryData(params) {
    const tableBody = document.getElementById('pl-summary-table-body');
    try {
        const summaryData = await fetchAPI(`/api/dashboard/pl-summary?${params.toString()}`);
        renderPLSummaryTable(summaryData);
    } catch (error) {
        console.error('Error loading P&L summary data:', error);
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="19" class="p-4 text-center text-red-500">${error.message}</td></tr>`;
        }
    }
}

/**
 * Merender tabel ringkasan performa P&L hotel.
 * @param {Array<Object>} summaryData - Data ringkasan dari API.
 */
function renderPLSummaryTable(summaryData) {
    const table = document.getElementById('pl-summary-table');
    if (!table) return;

    let tableBody = table.querySelector('tbody');
    if (!tableBody) {
        tableBody = document.createElement('tbody');
        tableBody.id = 'pl-summary-table-body';
        table.appendChild(tableBody);
    }

    let tableFoot = table.querySelector('tfoot');
    if (!tableFoot) {
        tableFoot = document.createElement('tfoot');
        table.appendChild(tableFoot);
    }

    tableBody.innerHTML = ''; // Kosongkan body
    tableFoot.innerHTML = ''; // Kosongkan footer

    const totals = {
        budget: { occupancy: 0, arr: 0, total_revenue: 0, total_expenses: 0, gop: 0, gop_percent: 0, room_sold: 0, room_available: 0 },
        actual: { occupancy: 0, arr: 0, total_revenue: 0, total_expenses: 0, gop: 0, gop_percent: 0, room_sold: 0, room_available: 0 }
    };

    if (!summaryData || summaryData.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="19" class="p-4 text-center text-slate-400">Tidak ada data ringkasan P&L untuk ditampilkan.</td></tr>`;
        return;
    }

    const formatPercent = (val) => `${(val || 0).toFixed(1)}%`;
    const formatCurrency = (val) => formatNumber(val || 0, { decimalPlaces: 0 });
    const getVarianceColor = (variance) => variance > 0 ? 'text-green-600' : (variance < 0 ? 'text-red-600' : 'text-slate-500');

    summaryData.forEach(item => {
        const row = document.createElement('tr');
        row.className = 'bg-white border-b group hover:bg-slate-50';

        const b = item.budget;
        const a = item.actual;

        const budgetExpenses = b.total_expenses || 0;
        const actualExpenses = a.total_expenses || 0;

        const budgetGop = (b.total_revenue || 0) - budgetExpenses;
        const actualGop = (a.total_revenue || 0) - actualExpenses;

        const budgetGopPercent = b.total_revenue ? (budgetGop / b.total_revenue) * 100 : 0;
        const actualGopPercent = a.total_revenue ? (actualGop / a.total_revenue) * 100 : 0;

        // Hitung Variances dengan data yang sudah benar
        const varOcc = (a.occupancy || 0) - (b.occupancy || 0);
        const varArr = (a.arr || 0) - (b.arr || 0);
        const varRevenue = (a.total_revenue || 0) - (b.total_revenue || 0);
        const varExpenses = actualExpenses - budgetExpenses; // Lower is better
        const varGop = actualGop - budgetGop;
        const varGopPercent = actualGopPercent - budgetGopPercent;

        // Akumulasi total untuk baris footer
        totals.budget.total_revenue += b.total_revenue || 0;
        totals.budget.total_expenses += budgetExpenses;
        totals.budget.gop += budgetGop;
        
        totals.actual.total_revenue += a.total_revenue || 0;
        totals.actual.total_expenses += actualExpenses;
        totals.actual.gop += actualGop;
        
        row.innerHTML = `
            <td class="px-4 py-3 font-medium text-slate-900 whitespace-nowrap sticky left-0 bg-white group-hover:bg-slate-50">${item.hotel_name}</td>
            
            <!-- Budget -->
            <td class="px-3 py-2 text-right font-mono border-l border-slate-200">${formatPercent(b.occupancy)}</td>
            <td class="px-3 py-2 text-right font-mono">${formatCurrency(b.arr)}</td>
            <td class="px-3 py-2 text-right font-mono">${formatCurrency(b.total_revenue)}</td>
            <td class="px-3 py-2 text-right font-mono">${formatCurrency(budgetExpenses)}</td>
            <td class="px-3 py-2 text-right font-mono">${formatCurrency(budgetGop)}</td>
            <td class="px-3 py-2 text-right font-mono">${formatPercent(budgetGopPercent)}</td>

            <!-- Actual -->
            <td class="px-3 py-2 text-right font-mono border-l border-slate-200">${formatPercent(a.occupancy)}</td>
            <td class="px-3 py-2 text-right font-mono">${formatCurrency(a.arr)}</td>
            <td class="px-3 py-2 text-right font-mono">${formatCurrency(a.total_revenue)}</td>
            <td class="px-3 py-2 text-right font-mono">${formatCurrency(actualExpenses)}</td>
            <td class="px-3 py-2 text-right font-mono">${formatCurrency(actualGop)}</td>
            <td class="px-3 py-2 text-right font-mono">${formatPercent(actualGopPercent)}</td>

            <!-- Variance -->
            <td class="px-3 py-2 text-right font-mono border-l border-slate-200 ${getVarianceColor(varOcc)}">${formatPercent(varOcc)}</td>
            <td class="px-3 py-2 text-right font-mono ${getVarianceColor(varArr)}">${formatCurrency(varArr)}</td>
            <td class="px-3 py-2 text-right font-mono ${getVarianceColor(varRevenue)}">${formatCurrency(varRevenue)}</td>
            <td class="px-3 py-2 text-right font-mono ${getVarianceColor(varExpenses * -1)}">${formatCurrency(varExpenses)}</td>
            <td class="px-3 py-2 text-right font-mono ${getVarianceColor(varGop)}">${formatCurrency(varGop)}</td>
            <td class="px-3 py-2 text-right font-mono ${getVarianceColor(varGopPercent)}">${formatPercent(varGopPercent)}</td>
        `;

        tableBody.appendChild(row);
    });

    // --- PERBAIKAN: Hitung rata-rata tertimbang untuk total Occupancy dan ARR ---
    // Gunakan data statistik kamar yang sekarang tersedia di `dashboardStatsData`
    const totalBudgetRoomSold = dashboardStatsData.totalBudgetRoomSold || 0;
    const totalBudgetRoomAvailable = dashboardStatsData.totalBudgetRoomAvailable || 0;
    const totalBudgetRoomRevenue = dashboardStatsData.totalBudgetRoomRevenue || 0;
    const totalActualRoomSold = dashboardStatsData.totalActualRoomSold || 0;
    const totalActualRoomAvailable = dashboardStatsData.totalActualRoomAvailable || 0;
    const totalActualRoomRevenue = dashboardStatsData.totalActualRoomRevenue || 0;

    const totalBudgetOcc = totalBudgetRoomAvailable > 0 ? (totalBudgetRoomSold / totalBudgetRoomAvailable) * 100 : 0;
    const totalBudgetArr = totalBudgetRoomSold > 0 ? totalBudgetRoomRevenue / totalBudgetRoomSold : 0;
    const totalActualOcc = totalActualRoomAvailable > 0 ? (totalActualRoomSold / totalActualRoomAvailable) * 100 : 0;
    const totalActualArr = totalActualRoomSold > 0 ? totalActualRoomRevenue / totalActualRoomSold : 0;
    // yang sudah mencakup semua hotel yang difilter.
    const totalBudgetRevenue = dashboardStatsData.totalBudgetRevenue || 0;
    const totalActualRevenue = dashboardStatsData.totalActualRevenue || 0;
    const totalBudgetExpenses = dashboardStatsData.totalBudgetExpenses || 0;
    const totalActualExpenses = dashboardStatsData.totalActualExpenses || 0;
    const totalBudgetGop = dashboardStatsData.totalBudgetGop || 0;
    const totalActualGop = dashboardStatsData.totalActualGop || 0;

    // Hitung GOP percent untuk total
    const totalBudgetGopPercent = totalBudgetRevenue > 0 ? (totalBudgetGop / totalBudgetRevenue) * 100 : 0;
    const totalActualGopPercent = totalActualRevenue > 0 ? (totalActualGop / totalActualRevenue) * 100 : 0;

    // Hitung variance untuk total
    const totalVarRevenue = totalActualRevenue - totalBudgetRevenue;
    const totalVarExpenses = totalActualExpenses - totalBudgetExpenses;
    const totalVarGop = totalActualGop - totalBudgetGop;
    const totalVarOcc = totalActualOcc - totalBudgetOcc;
    const totalVarArr = totalActualArr - totalBudgetArr;
    const totalVarGopPercent = totalActualGopPercent - totalBudgetGopPercent;

    // Buat baris Total di tfoot
    const totalRow = document.createElement('tr');
    totalRow.className = 'bg-slate-100 font-bold text-slate-800 border-t-2 border-slate-300';
    totalRow.innerHTML = `
        <td class="px-4 py-3 sticky left-0 bg-slate-100">TOTAL</td>
        
        <!-- Budget Total -->
        <td class="px-3 py-2 text-right font-mono border-l border-slate-300">${formatPercent(totalBudgetOcc)}</td>
        <td class="px-3 py-2 text-right font-mono">${formatCurrency(totalBudgetArr)}</td>
        <td class="px-3 py-2 text-right font-mono">${formatCurrency(totalBudgetRevenue)}</td>
        <td class="px-3 py-2 text-right font-mono">${formatCurrency(totalBudgetExpenses)}</td>
        <td class="px-3 py-2 text-right font-mono">${formatCurrency(totalBudgetGop)}</td>
        <td class="px-3 py-2 text-right font-mono">${formatPercent(totalBudgetGopPercent)}</td>

        <!-- Actual Total -->
        <td class="px-3 py-2 text-right font-mono border-l border-slate-300">${formatPercent(totalActualOcc)}</td>
        <td class="px-3 py-2 text-right font-mono">${formatCurrency(totalActualArr)}</td>
        <td class="px-3 py-2 text-right font-mono">${formatCurrency(totalActualRevenue)}</td>
        <td class="px-3 py-2 text-right font-mono">${formatCurrency(totalActualExpenses)}</td>
        <td class="px-3 py-2 text-right font-mono">${formatCurrency(totalActualGop)}</td>
        <td class="px-3 py-2 text-right font-mono">${formatPercent(totalActualGopPercent)}</td>

        <!-- Variance Total -->
        <td class="px-3 py-2 text-right font-mono border-l border-slate-300 ${getVarianceColor(totalVarOcc)}">${formatPercent(totalVarOcc)}</td>
        <td class="px-3 py-2 text-right font-mono ${getVarianceColor(totalVarArr)}">${formatCurrency(totalVarArr)}</td>
        <td class="px-3 py-2 text-right font-mono ${getVarianceColor(totalVarRevenue)}">${formatCurrency(totalVarRevenue)}</td>
        <td class="px-3 py-2 text-right font-mono ${getVarianceColor(totalVarExpenses * -1)}">${formatCurrency(totalVarExpenses)}</td>
        <td class="px-3 py-2 text-right font-mono ${getVarianceColor(totalVarGop)}">${formatCurrency(totalVarGop)}</td>
        <td class="px-3 py-2 text-right font-mono ${getVarianceColor(totalVarGopPercent)}">${formatPercent(totalVarGopPercent)}</td>
    `;
    tableFoot.appendChild(totalRow);
}


/**
 * Menangani perubahan pada filter brand dashboard.
 */
function handleDashboardBrandFilterChange() {
    // Saat brand diubah, kita uncheck semua hotel untuk menghindari filter ganda.
    const hotelCheckboxes = document.querySelectorAll('#dashboard-hotel-checklist-container input[type="checkbox"]');
    hotelCheckboxes.forEach(cb => cb.checked = false);
    updateHotelFilterLabel('dashboard-hotel-filter-label', 'dashboard-hotel-checklist-container');

    loadDashboardStats(); // Panggil load stats setelah state diubah
}

// --- CHART RENDERING FUNCTIONS ---

/**
 * Inisialisasi atau update chart "Realisasi Bulanan" dengan data budget vs actual.
 * @param {number[]} budgetData - Array 12 angka untuk budget revenue bulanan.
 * @param {number[]} actualData - Array 12 angka untuk actual revenue bulanan.
 */
function initRealizationChart(budgetData = [], actualData = []) {
    const ctx = document.getElementById('realizationChart');
    if (!ctx) return;

    if (realizationChartInstance) {
        realizationChartInstance.destroy();
    }

    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    realizationChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Budget',
                    data: budgetData,
                    backgroundColor: '#a5b4fc', // Indigo-300
                    borderRadius: 4
                },
                {
                    label: 'Actual',
                    data: actualData,
                    backgroundColor: '#4f46e5', // Indigo-600
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, grid: { display: false } } },
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

/**
 * Inisialisasi atau update chart "Realisasi Bulanan GOP" dengan data budget vs actual.
 * @param {number[]} budgetData - Array 12 angka untuk budget GOP bulanan.
 * @param {number[]} actualData - Array 12 angka untuk actual GOP bulanan.
 */
function initGopChart(budgetData = [], actualData = []) {
    const ctx = document.getElementById('gopChart');
    if (!ctx) return;

    if (gopChartInstance) {
        gopChartInstance.destroy();
    }

    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    gopChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Budget GOP',
                    data: budgetData,
                    backgroundColor: '#a7f3d0', // Emerald-200
                    borderRadius: 4
                },
                {
                    label: 'Actual GOP',
                    data: actualData,
                    backgroundColor: '#10b981', // Emerald-500
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, grid: { display: false } } },
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

/**
 * BARU: Inisialisasi atau update chart perbandingan bulanan Occupancy & ARR.
 * @param {object} data - Objek berisi array data bulanan { budgetOcc, actualOcc, budgetArr, actualArr }.
 */
function initOccupancyArrChart(data = {}) {
    const ctx = document.getElementById('occupancyArrChart');
    if (!ctx) return;

    if (occupancyArrChartInstance) {
        occupancyArrChartInstance.destroy();
    }

    const {
        budgetOcc = [],
        actualOcc = [],
        budgetArr = [],
        actualArr = []
    } = data;

    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    occupancyArrChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Budget Occ (%)',
                    data: budgetOcc,
                    backgroundColor: 'rgba(167, 243, 208, 0.6)', // emerald-200 with opacity
                    borderColor: '#6ee7b7',
                    yAxisID: 'yOcc',
                    order: 2 // Render bars behind lines
                },
                {
                    label: 'Actual Occ (%)',
                    data: actualOcc,
                    backgroundColor: 'rgba(16, 185, 129, 0.8)', // emerald-500 with opacity
                    borderColor: '#059669',
                    yAxisID: 'yOcc',
                    order: 2
                },
                {
                    label: 'Budget ARR',
                    data: budgetArr,
                    type: 'line',
                    borderColor: '#fca5a5', // red-300
                    backgroundColor: '#fca5a5',
                    yAxisID: 'yArr',
                    tension: 0.3,
                    order: 1
                },
                {
                    label: 'Actual ARR',
                    data: actualArr,
                    type: 'line',
                    borderColor: '#ef4444', // red-500
                    backgroundColor: '#ef4444',
                    yAxisID: 'yArr',
                    tension: 0.3,
                    order: 1
                }
            ]
        },
        options: getComboChartOptions('Occupancy (%)', 'ARR (Rp)')
    });
}

/**
 * Inisialisasi atau update chart "Perbandingan Rasio Kunci".
 * @param {object} budgetRatios - Objek rasio budget dari API.
 * @param {object} actualRatios - Objek rasio actual dari API.
 */
function initRatioComparisonChart(budgetRatios = {}, actualRatios = {}) {
    const ctx = document.getElementById('ratioComparisonChart');
    if (!ctx) return;

    if (ratioComparisonChartInstance) {
        ratioComparisonChartInstance.destroy();
    }

    const labels = [
        '% Salary & Wages',
        '% Energy Cost',
        '% Room GoI',
        '% F&B GoI',
        '% S&M Expenses',
        '% A & G Expenses'
    ];

    const budgetData = [
        budgetRatios.salaryWages || 0,
        budgetRatios.energyCost || 0,
        budgetRatios.roomGoi || 0,
        budgetRatios.fnbGoi || 0,
        budgetRatios.smExpenses || 0,
        budgetRatios.agExpenses || 0,
    ];

    const actualData = [
        actualRatios.salaryWages || 0,
        actualRatios.energyCost || 0,
        actualRatios.roomGoi || 0,
        actualRatios.fnbGoi || 0,
        actualRatios.smExpenses || 0,
        actualRatios.agExpenses || 0,
    ];

    ratioComparisonChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                { label: 'Budget (%)', data: budgetData, backgroundColor: '#fca5a5', borderRadius: 4 }, // red-300
                { label: 'Actual (%)', data: actualData, backgroundColor: '#ef4444', borderRadius: 4 }  // red-500
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, grid: { display: false }, ticks: { callback: (value) => value + '%' } } },
            plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${context.raw.toFixed(0)}%` } } }
        }
    });
}

/**
 * Merender atau memperbarui grafik batang horizontal untuk Hotel Achievement Ratio.
 * @param {Array<Object>} budgetData Data budget yang sudah diagregasi per hotel.
 * @param {Array<Object>} actualData Data actual yang sudah diagregasi per hotel.
 * @param {Array<Object>} allHotels Daftar semua hotel untuk mendapatkan nama.
 */
function renderHotelAchievementChart(budgetData, actualData, allHotels) {
    const chartContainer = document.getElementById('hotelAchievementChartContainer');
    const ctx = document.getElementById('hotelAchievementChart')?.getContext('2d');
    if (!ctx || !chartContainer) return;

    if (hotelAchievementChartInstance) {
        hotelAchievementChartInstance.destroy();
    }

    const safeBudgetData = Array.isArray(budgetData) ? {} : budgetData || {};
    const safeActualData = Array.isArray(actualData) ? {} : actualData || {};
    const safeAllHotels = allHotels || [];

    const hotelMap = safeAllHotels.reduce((map, hotel) => {
        map[hotel.id] = hotel.name;
        return map;
    }, {});

    const allHotelIds = new Set([...Object.keys(safeBudgetData), ...Object.keys(safeActualData)]);
    let processedData = [];

    allHotelIds.forEach(hotelId => {
        const name = hotelMap[hotelId];
        if (!name) return; 

        const budgetRevenue = safeBudgetData[hotelId]?.total_revenue;
        const budget = Array.isArray(budgetRevenue) ? budgetRevenue.reduce((a, b) => a + b, 0) : (budgetRevenue || 0);

        const actualRevenue = safeActualData[hotelId]?.total_revenue;
        const actual = Array.isArray(actualRevenue) ? actualRevenue.reduce((a, b) => a + b, 0) : (actualRevenue || 0);

        if (budget > 0 || actual > 0) {
            const ratio = budget > 0 ? (actual / budget) * 100 : (actual > 0 ? 100 : 0);
            processedData.push({ name, x: ratio, budget, actual });
        }
    });

    processedData.sort((a, b) => b.x - a.x);

    const chartLabels = processedData.map(d => d.name);
    const chartData = processedData; 
    const backgroundColors = processedData.map(dataPoint => {
        const cappedRatio = Math.min(dataPoint.x, 150); 
        const opacity = 0.3 + (cappedRatio / 150) * 0.7; 
        return `rgba(20, 184, 166, ${opacity})`; 
    });

    const barHeight = 30; 
    const padding = 80;  
    const newHeight = Math.max(200, chartLabels.length * barHeight + padding); 
    
    chartContainer.style.height = `${newHeight}px`;
    
    ctx.canvas.style.width = '100%';
    ctx.canvas.style.height = `${newHeight}px`;

    hotelAchievementChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartLabels,
            datasets: [{
                label: 'Achievement Ratio (%)',
                data: chartData,
                backgroundColor: backgroundColors,
                borderColor: backgroundColors.map(color => color.replace(/, [0-9\.]+\)/, ', 1)')), 
                borderWidth: 1,
                borderRadius: 4,
                barThickness: barHeight * 0.6 
            }]
        },
        options: {
            indexAxis: 'y', 
            responsive: true,
            maintainAspectRatio: false,
            parsing: {
                yAxisKey: 'name', 
                xAxisKey: 'x'     
            },
            scales: {
                x: {
                    beginAtZero: true,
                    title: { display: true, text: 'Achievement Ratio (%)', font: { size: 14 } },
                    ticks: { callback: value => value.toFixed(0) + '%' }
                },
                y: { 
                    ticks: { autoSkip: false, font: { size: 12 } },
                    grid: { display: false }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1e293b', 
                    titleFont: { size: 14 },
                    bodyFont: { size: 12 },
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            const raw = context.raw;
                            if (!raw) return '';
                            const formatCurrency = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
                            const ratioLine = `Ratio  : ${parseFloat(raw.x).toFixed(0)}%`;
                            const actualLine = `Actual : ${formatCurrency(raw.actual)}`;
                            const budgetLine = `Budget : ${formatCurrency(raw.budget)}`;
                            return [ratioLine, actualLine, budgetLine];
                        }
                    }
                }
            }
        }
    });
}

/**
 * Inisialisasi atau update chart pie "Room Production by Market Segment".
 * @param {string[]} labels - Array label untuk setiap segmen.
 * @param {number[]} data - Array data jumlah kamar untuk setiap segmen.
 */
function initRoomProductionSegmentChart(labels = [], data = [], backgroundColors = []) {
    const ctx = document.getElementById('roomProductionSegmentChart');
    if (!ctx) return;

    if (roomProductionSegmentChartInstance) {
        roomProductionSegmentChartInstance.destroy();
    };

    roomProductionSegmentChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Rooms',
                data: data,
                backgroundColor: backgroundColors,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        padding: 15,
                        boxWidth: 12
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => ` ${context.label}: ${formatNumber(context.raw, { decimalPlaces: 0 })} Rooms`
                    }
                }
            },
            onClick: (event, elements) => {
                if (elements.length > 0) {
                    const clickedElementIndex = elements[0].index;
                    const chart = elements[0].element.$context.chart;
                    const segmentLabel = chart.data.labels[clickedElementIndex];
                    
                    if (segmentLabel) {
                        displayArrByCompany(segmentLabel);
                    } else {
                        console.warn('Segment label not found for clicked element.');
                    }
                }
            }
        }
    });
}

/**
 * Inisialisasi atau update chart batang "ARR by Market Segment".
 * @param {string[]} labels - Array label untuk setiap segmen pasar.
 * @param {number[]} data - Array data rata-rata ARR untuk setiap segmen.
 */
function initRoomProductionArrChart(labels = [], data = [], backgroundColors = []) {
    const ctx = document.getElementById('roomProductionArrChart');
    if (!ctx) return;

    if (roomProductionArrChartInstance) {
        roomProductionArrChartInstance.destroy();
    }

    roomProductionArrChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Average Room Rate (ARR)',
                data: data,
                backgroundColor: backgroundColors,
                borderColor: backgroundColors,
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { display: false },
                    ticks: {
                        callback: (value) => `Rp ${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)}`
                    }
                },
                x: { grid: { display: false } }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1e293b',
                    titleFont: { size: 14 },
                    bodyFont: { size: 12 },
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            const raw = context.raw;
                            const formatMoney = (value) => `Rp ${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)}`;
                            return `ARR: ${formatMoney(raw)}`;
                        }
                    }
                }
            }
        }
    });
}
        
/**
 * Mengambil data ARR yang dikelompokkan per perusahaan untuk segmen pasar tertentu dan memperbarui grafik.
 * @param {string} segment - Segmen pasar yang dipilih.
 */
async function displayArrByCompany(segment) {
    const yearFilter = document.getElementById('dashboard-year-filter');
    const monthFilter = document.getElementById('dashboard-month-filter');
    const brandFilter = document.getElementById('dashboard-brand-filter');
    
    const params = new URLSearchParams();

    if (yearFilter && yearFilter.value) {
        params.append('year', yearFilter.value);
    }
    if (monthFilter && monthFilter.value && monthFilter.value !== 'all') {
        params.append('month', monthFilter.value);
    }

    const selectedHotelIds = getSelectedHotels('dashboard');
    if (selectedHotelIds.length > 0) {
        params.append('hotels', selectedHotelIds.join(','));
    } else if (brandFilter && brandFilter.value && brandFilter.value !== 'all') {
        const selectedBrand = brandFilter.value;
        params.append('brand', selectedBrand);
    }

    params.append('segment', segment);

    try {
        const queryString = params.toString();
        const result = await fetchAPI(`/api/reports/arr-by-company?${queryString}`);
        
        if (Array.isArray(result)) {
            const labels = result.map(item => item.company);
            const data = result.map(item => parseFloat(item.average_arr));

            const newColors = labels.map((_, index) => {
                const hue = (index * 137.508) % 360; 
                return `hsl(${hue}, 70%, 60%)`;
            });

            initRoomProductionArrChart(labels, data, newColors);
            
            document.getElementById('arr-chart-title').textContent = `ARR per Perusahaan di Segmen "${segment}"`;
            document.getElementById('reset-arr-chart-btn').classList.remove('hidden');
        } else {
            throw new Error("Format data yang diterima dari server tidak valid.");
        }

    } catch (error) {
        console.error(`Error mengambil data ARR untuk segmen '${segment}':`, error);
        alert(`Tidak dapat menampilkan detail untuk segmen ${segment}: ${error.message}`);
    }
}