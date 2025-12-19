document.addEventListener('DOMContentLoaded', () => {
    // Fungsi ini akan dipanggil oleh router utama di script.js saat hash #guest-review-dashboard aktif
});

// Variabel global untuk menyimpan instance Chart.js agar bisa dihancurkan sebelum render ulang
let ratingDistributionChartInstance = null;
let monthlyTrendChartInstance = null;
let hotelRatingChartInstance = null; // BARU

/**
 * Inisialisasi Dasbor Ulasan Tamu.
 * Mengisi filter dan memuat data awal.
 */
async function initGuestReviewDashboard() {
    console.log("Menginisialisasi Dasbor Ulasan Tamu...");
    const hotelFilter = document.getElementById('review-dashboard-hotel-filter');
    const applyFilterBtn = document.getElementById('review-dashboard-filter-apply-btn');

    // Setup event listener untuk tombol filter
    if (applyFilterBtn) {
        applyFilterBtn.addEventListener('click', loadReviewDashboardData);
    }

    try {
        // 1. Isi dropdown hotel
        const hotels = await fetchAPI('/api/hotels');
        hotelFilter.innerHTML = '<option value="all" selected>Semua Hotel</option>'; // Opsi default
        hotels.forEach(hotel => {
            const option = document.createElement('option');
            option.value = hotel.id;
            option.textContent = hotel.name;
            hotelFilter.appendChild(option);
        });

        // 2. Muat data dasbor untuk pertama kali dengan filter default
        await loadReviewDashboardData();

    } catch (error) {
        console.error("Gagal menginisialisasi dasbor ulasan tamu:", error);
        showErrorState("Tidak dapat memuat data awal. Periksa koneksi dan coba lagi.");
    }
}

/**
 * Memuat data utama untuk dasbor dari API berdasarkan filter yang dipilih.
 */
async function loadReviewDashboardData() {
    console.log("Memuat data dasbor ulasan...");
    showLoadingState();

    const hotelId = document.getElementById('review-dashboard-hotel-filter').value;
    const period = document.getElementById('review-dashboard-date-filter').value;

    try {
        // Endpoint API ini diharapkan mengembalikan data statistik.
        // Contoh: /api/reviews/dashboard-stats?hotel_id=all&period=last30days
        const data = await fetchAPI(`/api/reviews/dashboard-stats?hotel_id=${hotelId}&period=${period}`);

        // Pastikan data yang diterima adalah objek dan bukan array kosong atau null
        if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
            console.warn("API mengembalikan data kosong atau tidak valid.");
            showEmptyState();
            return;
        }

        // Panggil fungsi untuk memperbarui setiap bagian UI
        updateReviewStats(data.stats);
        renderRatingDistributionChart(data.ratingDistribution);
        renderMonthlyTrendChart(data.monthlyTrend);
        renderHotelRatingChart(data.hotelRatings); // BARU
        renderRecentActivities(data.recentActivities); // BARU

    } catch (error) {
        console.error("Gagal memuat data dasbor ulasan:", error);
        showErrorState(error.message || "Terjadi kesalahan saat mengambil data.");
    } finally {
        hideLoadingState();
    }
}

/**
 * Memperbarui kartu statistik (Total Ulasan, Rata-rata Rating, dll).
 * @param {object} stats - Objek berisi data statistik.
 * Diharapkan: { totalReviews: 150, averageRating: 4.5, unreplied: 12, responseRate: 92.0 }
 */
function updateReviewStats(stats = {}) {
    document.getElementById('review-stats-total-reviews').textContent = stats.totalReviews ?? '0';
    document.getElementById('review-stats-avg-rating').textContent = (stats.averageRating ?? 0).toFixed(1);
    document.getElementById('review-stats-unreplied').textContent = stats.unreplied ?? '0';
    document.getElementById('review-stats-response-rate').textContent = `${(stats.responseRate ?? 0).toFixed(1)}%`;

    // Update bintang rating
    const avgRating = stats.averageRating ?? 0;
    const starContainer = document.getElementById('review-stats-avg-rating-stars');
    starContainer.innerHTML = ''; // Kosongkan dulu
    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('i');
        star.classList.add('fa-solid', 'fa-star');
        if (i <= avgRating) {
            star.classList.add('text-amber-400');
        } else if (i - 0.5 <= avgRating) {
            star.classList.remove('fa-star');
            star.classList.add('fa-star-half-alt', 'text-amber-400');
        } else {
            star.classList.add('text-slate-300');
        }
        starContainer.appendChild(star);
    }
}

/**
 * Merender grafik distribusi rating (Pie/Doughnut Chart).
 * @param {object} distribution - Objek berisi distribusi rating.
 * Diharapkan: { "5": 100, "4": 30, "3": 10, "2": 5, "1": 5 }
 */
function renderRatingDistributionChart(distribution = {}) {
    const ctx = document.getElementById('ratingDistributionChart').getContext('2d');
    if (ratingDistributionChartInstance) {
        ratingDistributionChartInstance.destroy();
    }

    const labels = ['★★★★★', '★★★★☆', '★★★☆☆', '★★☆☆☆', '★☆☆☆☆'];
    const data = [
        distribution['5'] ?? 0,
        distribution['4'] ?? 0,
        distribution['3'] ?? 0,
        distribution['2'] ?? 0,
        distribution['1'] ?? 0,
    ];

    ratingDistributionChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                label: 'Jumlah Rating',
                data: data,
                backgroundColor: ['#10B981', '#34D399', '#FBBF24', '#F59E0B', '#EF4444'],
                borderColor: '#ffffff',
                borderWidth: 2,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' },
                tooltip: { callbacks: { label: (context) => `${context.label}: ${context.raw} ulasan` } }
            }
        }
    });
}

/**
 * Merender grafik tren rating bulanan (Line Chart).
 * @param {Array<object>} trend - Array objek berisi tren bulanan.
 * Diharapkan: [ { month: 'Jan', rating: 4.2 }, { month: 'Feb', rating: 4.5 }, ... ]
 */
function renderMonthlyTrendChart(trend = []) {
    const ctx = document.getElementById('monthlyTrendChart').getContext('2d');
    if (monthlyTrendChartInstance) {
        monthlyTrendChartInstance.destroy();
    }

    const labels = trend.map(item => item.month);
    const data = trend.map(item => item.rating);

    monthlyTrendChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Rata-rata Rating',
                data: data,
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    min: 1,
                    max: 5,
                    ticks: { stepSize: 1 }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

/**
 * BARU: Merender grafik rata-rata rating per hotel (Bar Chart).
 * @param {Array<object>} hotelRatings - Array objek berisi rating per hotel.
 * Diharapkan: [ { hotel_name: 'Hotel A', average_rating: 4.5 }, { hotel_name: 'Hotel B', average_rating: 4.2 } ]
 */
function renderHotelRatingChart(hotelRatings = []) {
    const ctx = document.getElementById('hotelRatingChart')?.getContext('2d');
    if (!ctx) return;

    if (hotelRatingChartInstance) {
        hotelRatingChartInstance.destroy();
    }

    // BARU: Urutkan data dari rating terendah ke tertinggi agar bar tertinggi muncul di atas
    const sortedRatings = [...(hotelRatings || [])].sort((a, b) => a.average_rating - b.average_rating);

    const labels = sortedRatings.map(item => item.hotel_name);
    const data = sortedRatings.map(item => item.average_rating);

    // Generate dynamic colors based on rating value
    const backgroundColors = data.map(rating => {
        if (rating >= 4.5) return 'rgba(16, 185, 129, 0.8)';   // Green-500
        if (rating >= 4.0) return 'rgba(52, 211, 153, 0.8)';  // Green-400
        if (rating >= 3.0) return 'rgba(251, 191, 36, 0.8)';  // Amber-400
        return 'rgba(239, 68, 68, 0.8)';                     // Red-500
    });

    hotelRatingChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Rata-rata Rating',
                data: data,
                backgroundColor: backgroundColors,
                borderColor: backgroundColors.map(color => color.replace('0.8', '1')),
                borderWidth: 1,
                borderRadius: 4,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y', // PERUBAHAN: 'x' menjadi 'y' untuk grafik horizontal
            scales: {
                // PERUBAHAN: Sumbu X sekarang untuk nilai, Y untuk label
                x: {
                    beginAtZero: false,
                    min: 1,
                    max: 5,
                    title: {
                        display: true,
                        text: 'Rata-rata Rating (1-5)'
                    },
                    grid: { display: true, color: '#e2e8f0' } // Tambahkan grid untuk membantu pembacaan
                },
                y: { grid: { display: false } }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => `Rating: ${Number(context.raw).toFixed(2)}`
                    }
                }
            }
        }
    });
}

/**
 * BARU: Merender daftar aktivitas ulasan terbaru.
 * @param {Array<object>} activities - Array objek berisi aktivitas terbaru.
 * Diharapkan: [ { guest_name: 'John D', hotel_name: 'Hotel A', rating: 5, created_at: '...' }, ... ]
 */
function renderRecentActivities(activities = []) {
    const listContainer = document.getElementById('review-recent-activity-list');
    if (!listContainer) return;

    listContainer.innerHTML = ''; // Kosongkan daftar

    if (activities.length === 0) {
        listContainer.innerHTML = '<li class="text-center text-slate-500 pt-10">Tidak ada aktivitas terbaru.</li>';
        return;
    }

    activities.forEach(activity => {
        const li = document.createElement('li');
        li.className = 'flex items-start gap-3';

        // Tentukan ikon dan warna berdasarkan rating
        let iconHtml = '';
        if (activity.rating >= 4) {
            iconHtml = '<div class="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center flex-shrink-0 text-sm"><i class="fa-solid fa-star"></i></div>';
        } else if (activity.rating >= 3) {
            iconHtml = '<div class="w-8 h-8 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center flex-shrink-0 text-sm"><i class="fa-solid fa-comment-dots"></i></div>';
        } else {
            iconHtml = '<div class="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center flex-shrink-0 text-sm"><i class="fa-solid fa-comment-slash"></i></div>';
        }

        li.innerHTML = `
            ${iconHtml}
            <div>
                <p class="text-sm font-medium text-slate-800">
                    <strong>${activity.guest_name}</strong> memberikan ulasan <span class="font-bold text-amber-500">${activity.rating} ★</span> untuk <strong>${activity.hotel_name}</strong>
                </p>
                <p class="text-xs text-slate-500">${formatTimeAgo(activity.created_at)}</p>
            </div>
        `;
        listContainer.appendChild(li);
    });
}

// --- Helper untuk UI State ---

function showLoadingState() {
    // Anda bisa menambahkan overlay loading di sini jika ada
    console.log("Menampilkan status loading...");
}

function hideLoadingState() {
    // Sembunyikan overlay loading
    console.log("Menyembunyikan status loading...");
}

function showEmptyState() {
    // Reset semua data ke nol atau status kosong
    updateReviewStats(); // Panggil tanpa argumen untuk reset
    renderRatingDistributionChart();
    renderMonthlyTrendChart();
    renderHotelRatingChart(); // BARU
    renderRecentActivities(); // BARU
    // Anda bisa menampilkan pesan "Tidak ada data" di tengah-tengah grafik
    document.getElementById('review-stats-total-reviews').textContent = '0';
    alert("Tidak ada data ulasan yang ditemukan untuk filter yang dipilih.");
}

function showErrorState(message) {
    // Tampilkan pesan error
    alert(`Error: ${message}`);
    // Reset UI ke status kosong
    showEmptyState();
}