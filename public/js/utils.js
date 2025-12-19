// --- UTILS.JS ---
// Berisi fungsi-fungsi helper umum yang digunakan di berbagai modul.

// --- KONFIGURASI API ---
const API_BASE_URL = 'http://localhost:3000';

// --- HELPER OTENTIKASI & ERROR ---

/**
 * Menangani error otentikasi (misal: 401, 403) dengan mengarahkan pengguna ke halaman login.
 * @param {Response} response - Objek response dari fetch API.
 */
function handleAuthError(response) {
    if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        alert('Sesi Anda telah berakhir atau tidak valid. Silakan login kembali.');
        window.location.href = 'login.html';
    }
}

/**
 * BARU: Wrapper untuk fetch API yang menangani otentikasi dan error secara otomatis.
 * @param {string} endpoint - Endpoint API (misal: '/api/users').
 * @param {object} [options={}] - Opsi untuk fetch (method, body, dll.).
 * @returns {Promise<any>} - Promise yang resolve dengan data JSON dari response.
 */
async function fetchAPI(endpoint, options = {}) {
    const isFormData = options.body instanceof FormData;

    // Correctly merge headers, ensuring Content-Type is not set for FormData
    const config = {
        ...options,
        headers: {
            ...getAuthHeaders(isFormData), // Base headers (Auth, and conditional Content-Type)
            ...options.headers,            // Call-specific header overrides
        }
    };
    
    // If a method isn't provided, default to GET
    if (!config.method) {
        config.method = 'GET';
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

        handleAuthError(response);

        if (!response.ok) {
            try {
                const errorData = await response.json();
                throw new Error(errorData.message || `Terjadi kesalahan pada server (Status: ${response.status})`);
            } catch (e) {
                throw new Error(`Terjadi kesalahan pada server (Status: ${response.status})`);
            }
        }

        // Handle potentially empty or non-JSON responses gracefully
        const text = await response.text();
        if (!text) {
            return null; // Return null for empty responses
        }
        try {
            return JSON.parse(text); // Try parsing as JSON
        } catch (e) {
            return text; // If parsing fails, return as plain text
        }

    } catch (error) {
        console.error('API Fetch Error:', error);
        // Re-throw the error to be caught by the calling function's catch block
        throw error;
    }
}

/**
 * BARU: Mengompres gambar di sisi klien sebelum di-upload.
 * @param {File} file - File gambar yang akan dikompres.
 * @param {object} options - Opsi kompresi.
 * @param {number} [options.maxWidth=1024] - Lebar maksimum gambar.
 * @param {number} [options.quality=0.7] - Kualitas gambar (0-1).
 * @returns {Promise<File>} - Promise yang resolve dengan file gambar yang sudah dikompres.
 */
function compressImage(file, options = {}) {
    return new Promise((resolve, reject) => {
        const { maxWidth = 1024, quality = 0.7 } = options;
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = event => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const scale = Math.min(1, maxWidth / img.width);
                const width = img.width * scale;
                const height = img.height * scale;
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob(blob => {
                    const compressedFile = new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() });
                    resolve(compressedFile);
                }, 'image/jpeg', quality);
            };
            img.onerror = error => reject(error);
        };
        reader.onerror = error => reject(error);
    });
}

/**
 * BARU: Menghasilkan konfigurasi options untuk combo chart (bar + line) dengan dua sumbu Y.
 * @param {string} yLeftLabel - Label untuk sumbu Y kiri.
 * @param {string} yRightLabel - Label untuk sumbu Y kanan.
 * @returns {object} - Objek konfigurasi options untuk Chart.js.
 */
function getComboChartOptions(yLeftLabel, yRightLabel) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        scales: {
            yOcc: { // Sumbu Y Kiri untuk Occupancy
                type: 'linear',
                display: true,
                position: 'left',
                grid: {
                    drawOnChartArea: false, // only want the grid lines for one axis to show up
                },
                ticks: {
                    callback: (value) => `${Math.round(value)}%` // PERUBAHAN: Bulatkan nilai occupancy
                },
                title: {
                    display: true,
                    text: yLeftLabel
                }
            },
            yArr: { // Sumbu Y Kanan untuk ARR
                type: 'linear',
                display: true,
                position: 'right',
                ticks: {
                    callback: (value) => {
                        if (value >= 1000000) return `${(value / 1000000).toFixed(1)} Jt`;
                        if (value >= 1000) return `${(value / 1000).toFixed(0)} Rb`;
                        return value;
                    }
                },
                title: {
                    display: true,
                    text: yRightLabel
                }
            }
        },
        plugins: {
            legend: {
                position: 'bottom'
            },
            // BARU: Kustomisasi tooltip untuk memformat angka tanpa desimal
            tooltip: {
                callbacks: {
                    label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            // Jika ini adalah data occupancy (%), bulatkan. Jika ARR, format sebagai mata uang.
                            const isOccupancy = context.dataset.yAxisID === 'yOcc';
                            label += isOccupancy ? `${Math.round(context.parsed.y)}%` : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(context.parsed.y);
                        }
                        return label;
                    }
                }
            }
        }
    };
}

/**
 * Membuat header otentikasi untuk request API.
 * @param {boolean} [isFormData=false] - Set true jika request mengirim FormData.
 * @returns {Object} - Objek header untuk fetch.
 */
function getAuthHeaders(isFormData = false) {
    const token = localStorage.getItem('authToken');
    const headers = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    if (!isFormData) {
        headers['Content-Type'] = 'application/json';
    }
    return headers;
}

/**
 * BARU: Memformat tanggal menjadi string "time ago" (misal: "2 jam lalu").
 * @param {string | Date} date - Tanggal dalam format string ISO atau objek Date.
 * @returns {string} - String "time ago".
 */
window.formatTimeAgo = function(date) {
    if (!date) return '';
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now - past) / 1000);

    const intervals = {
        tahun: 31536000,
        bulan: 2592000,
        hari: 86400,
        jam: 3600,
        menit: 60,
        detik: 1
    };

    for (const intervalName in intervals) {
        const interval = intervals[intervalName];
        const count = Math.floor(diffInSeconds / interval);
        if (count > 0) {
            return `${count} ${intervalName} yang lalu`;
        }
    }
    return 'Baru saja';
};

// --- HELPER FORMAT ANGKA ---

/**
 * Memformat angka menjadi string dengan pemisah ribuan.
 * @param {number} num - Angka yang akan diformat.
 * @returns {string} - String angka yang sudah diformat.
 */
function formatNumber(num) {
    if (num === null || num === undefined) return '0';
    return Math.round(num).toLocaleString('en-US');
}

/**
 * Mengurai string angka yang diformat kembali menjadi tipe number.
 * @param {string} str - String yang akan diurai.
 * @returns {number} - Angka hasil parse.
 */
function parseFormattedNumber(str) {
    if (typeof str !== 'string') return parseFloat(str) || 0;
    return parseFloat(str.replace(/,/g, '')) || 0;
}

// --- HELPER POPULASI DROPDOWN & FILTER ---

/**
 * Mengisi dropdown pilihan tahun.
 * @param {string} selectId - ID dari elemen select tahun.
 */
function populateYearDropdown(selectId) {
    const yearSelect = document.getElementById(selectId);
    if (!yearSelect) return;

    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 5;
    const endYear = currentYear + 5;

    yearSelect.innerHTML = ''; // Kosongkan pilihan

    for (let year = endYear; year >= startYear; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        if (year === currentYear) {
            option.selected = true;
        }
        yearSelect.appendChild(option);
    }
}

/**
 * Mengisi dropdown pilihan bulan.
 * @param {string} selectId - ID dari elemen select bulan.
 * @param {boolean} [includeAllOption=false] - Jika true, tambahkan opsi "Semua Bulan".
 */
function populateMonthDropdown(selectId, includeAllOption = false) {
    const monthSelect = document.getElementById(selectId);
    if (!monthSelect) return;

    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const currentMonth = new Date().getMonth(); 

    while (monthSelect.firstChild) {
        monthSelect.removeChild(monthSelect.firstChild);
    }

    if (includeAllOption) {
        const allOption = document.createElement('option');
        allOption.value = 'all';
        allOption.textContent = '-- Semua Bulan --';
        monthSelect.appendChild(allOption);
    }

    months.forEach((month, index) => {
        const option = document.createElement('option');
        option.value = index + 1; 
        option.textContent = month;
        if (!includeAllOption && index === currentMonth) {
            option.selected = true;
        }
        monthSelect.appendChild(option);
    });
}

/**
 * Mengambil data hotel dari API dan mengisi dropdown pilihan hotel.
 * @param {string} selectId - ID dari elemen select hotel.
 * @param {boolean} [addPublicOption=false] - Jika true, tambahkan opsi "Publik".
 * @param {boolean} [addAllOption=false] - BARU: Jika true, tambahkan opsi "Semua Hotel".
 */
async function populateHotelDropdown(selectId, addAllOption = false) {
    const hotelSelect = document.getElementById(selectId);
    if (!hotelSelect) return;

    // PERUBAHAN: Logika untuk opsi default yang lebih fleksibel
    if (addAllOption) {
        hotelSelect.innerHTML = '<option value="all">-- Semua Hotel --</option>';
    } else {
        hotelSelect.innerHTML = '<option value="">-- Pilih Hotel --</option>';
    }

    try {
        const user = JSON.parse(localStorage.getItem('user'));
        let hotels = [];

        if (user && user.role === 'staff') {
            hotels = user.hotels || [];
        } else {
            const response = await fetch(`${API_BASE_URL}/api/hotels`, { headers: getAuthHeaders() });
            if (!response.ok) {
                handleAuthError(response);
                throw new Error('Gagal memuat data hotel.');
            }
            hotels = await response.json();
        }

        hotels.forEach(hotel => {
            const option = document.createElement('option');
            option.value = hotel.id;
            option.textContent = hotel.name;
            hotelSelect.appendChild(option);
        });
    } catch (error) {
        console.error(error);
        hotelSelect.innerHTML = `<option value="">Error: ${error.message}</option>`;
        hotelSelect.disabled = true;
    }
}

/**
 * Mengambil data brand unik dari API dan mengisi dropdown filter.
 * @param {string} selectId - ID dari elemen select brand.
 */
async function populateBrandFilterDropdown(selectId) {
    const brandSelect = document.getElementById(selectId);
    if (!brandSelect) return;

    try {
        const user = JSON.parse(localStorage.getItem('user'));
        let hotels = [];

        if (user && user.role === 'staff') {
            hotels = user.hotels || [];
        } else {
            const response = await fetch(`${API_BASE_URL}/api/hotels`, { headers: getAuthHeaders() });
            if (!response.ok) {
                handleAuthError(response);
                throw new Error('Gagal memuat data brand.');
            }
            hotels = await response.json();
        }
        const brands = [...new Set(hotels.map(hotel => hotel.brand).filter(Boolean))];

        brandSelect.innerHTML = '<option value="all">-- Semua Brand --</option>';

        brands.forEach(brand => {
            const option = document.createElement('option');
            option.value = brand;
            option.textContent = brand;
            brandSelect.appendChild(option);
        });
    } catch (error) {
        console.error(error);
        brandSelect.innerHTML = `<option value="">Error: ${error.message}</option>`;
    }
}


/**
 * Mengisi dropdown checklist dengan data hotel dari API.
 * @param {string} containerId ID kontainer checklist.
 * @param {string} selectAllId ID checkbox "Pilih Semua".
 * @param {string|null} labelId ID label untuk update (opsional).
 */
async function populateHotelChecklist(containerId = 'hotel-checklist-container', selectAllId = 'hotel-filter-select-all', labelId = null) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '<p class="p-2 text-sm text-slate-400">Memuat hotel...</p>';

    try {
        const user = JSON.parse(localStorage.getItem('user'));
        let hotels = [];
        let staffHotelIds = new Set();

        if (user && user.role === 'staff') {
            hotels = user.hotels || [];
            staffHotelIds = new Set(hotels.map(h => h.id));
        } else {
            const response = await fetch(`${API_BASE_URL}/api/hotels`, { headers: getAuthHeaders() });
            if (!response.ok) throw new Error('Gagal memuat daftar hotel.');
            hotels = await response.json();
        }
        
        container.innerHTML = '';

        if (hotels.length === 0) {
            container.innerHTML = '<p class="p-2 text-sm text-slate-500">Tidak ada hotel ditemukan.</p>';
            return;
        }

        hotels.forEach(hotel => {
            const label = document.createElement('label');
            label.className = 'flex items-center space-x-3 p-2 rounded-md hover:bg-slate-100 cursor-pointer';

            const isChecked = (user.role === 'staff') ? staffHotelIds.has(hotel.id) : true;

            label.innerHTML = `
                <input type="checkbox" value="${hotel.id}" ${isChecked ? 'checked' : ''} class="form-checkbox h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500">
                <span class="text-sm text-slate-700">${hotel.name}</span>
            `;
            container.appendChild(label);

            const checkbox = label.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('change', () => {
                updateSelectAllCheckboxState(containerId, selectAllId);
            });
        });

        if (labelId) {
            updateHotelFilterLabel(labelId, containerId);
        }
        updateSelectAllCheckboxState(containerId, selectAllId);
    } catch (error) {
        console.error(error);
        container.innerHTML = `<p class="p-2 text-sm text-red-500">Error: ${error.message}</p>`;
    }
}

/**
 * Inisialisasi fungsionalitas untuk dropdown filter hotel.
 */
function initHotelFilterDropdown(btnId, dropdownId, searchId, selectAllId, containerId, applyId, labelId) {
    const btn = document.getElementById(btnId);
    const dropdown = document.getElementById(dropdownId);
    const searchInput = document.getElementById(searchId);
    const selectAllCheckbox = document.getElementById(selectAllId);
    const applyBtn = document.getElementById(applyId);

    if (!btn || !dropdown || !searchInput || !selectAllCheckbox) return;

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('hidden');
    });

    searchInput.addEventListener('keyup', () => {
        const filter = searchInput.value.toLowerCase();
        const labels = document.querySelectorAll(`#${containerId} label`);
        labels.forEach(label => {
            const text = label.textContent.toLowerCase();
            label.style.display = text.includes(filter) ? '' : 'none';
        });
        updateSelectAllCheckboxState(containerId, selectAllId);
    });

    selectAllCheckbox.addEventListener('change', () => {
        const visibleCheckboxes = document.querySelectorAll(`#${containerId} label:not([style*="display: none"]) input[type="checkbox"]`);
        visibleCheckboxes.forEach(cb => {
            cb.checked = selectAllCheckbox.checked;
        });
    });

    if (applyBtn) {
        applyBtn.addEventListener('click', () => {
            updateHotelFilterLabel(labelId, containerId);
            dropdown.classList.add('hidden');
            if (btnId === 'dashboard-hotel-filter-btn') {
                loadDashboardStats();
            }
        });
    }

    document.addEventListener('click', (e) => {
        if (dropdown && !dropdown.contains(e.target) && !btn.contains(e.target)) {
            dropdown.classList.add('hidden');
        }
    });

    const container = document.getElementById(containerId);
    container.addEventListener('change', () => {
        updateHotelFilterLabel(labelId, containerId);
    });
}

/**
 * Memperbarui status checkbox "Pilih Semua" berdasarkan checkbox hotel yang terlihat.
 */
function updateSelectAllCheckboxState(containerId, selectAllId) {
    const selectAllCheckbox = document.getElementById(selectAllId);
    const visibleCheckboxes = Array.from(document.querySelectorAll(`#${containerId} label:not([style*="display: none"]) input[type="checkbox"]`));
    
    if (visibleCheckboxes.length === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
        return;
    }

    const allChecked = visibleCheckboxes.every(cb => cb.checked);
    const someChecked = visibleCheckboxes.some(cb => cb.checked);

    selectAllCheckbox.checked = allChecked;
    selectAllCheckbox.indeterminate = !allChecked && someChecked;
}

/**
 * Memperbarui label pada tombol filter hotel untuk menunjukkan jumlah yang dipilih.
 */
function updateHotelFilterLabel(labelId, containerId) {
    const label = document.getElementById(labelId);
    if (!label) return;
    const checkedCount = document.querySelectorAll(`#${containerId} input:checked`).length;

    if (checkedCount === 0) {
        label.textContent = '-- Pilih Hotel --';
    } else {
        label.textContent = `${checkedCount} hotel dipilih`;
    }
}

/**
 * BARU: Mengambil data tipe inspeksi dari API dan mengisi dropdown.
 * @param {string} selectId - ID dari elemen select.
 * @param {boolean} [addAllOption=false] - Jika true, tambahkan opsi "Semua Tipe".
 */
async function populateInspectionTypeDropdown(selectId, addAllOption = false) {
    const selectEl = document.getElementById(selectId);
    if (!selectEl) return;

    if (addAllOption) {
        selectEl.innerHTML = '<option value="all">-- Semua Tipe --</option>';
    } else {
        selectEl.innerHTML = '<option value="">-- Pilih Tipe --</option>';
    }

    try {
                const types = await fetchAPI('/api/inspections/types');
                if (!Array.isArray(types)) {
                    throw new Error('API did not return an array for inspection types.');
                }
                types.forEach(type => { 
                    const option = new Option(type.name, type.id);
                    selectEl.appendChild(option);
                });    } catch (error) {
        console.error('Error populating inspection types:', error);
        selectEl.innerHTML = `<option value="">Error: ${error.message}</option>`;
        selectEl.disabled = true;
    }
}

/**
 * Fungsi generik untuk mendapatkan ID hotel yang dipilih dari checklist.
 * @param {string} prefix - Prefix ID container.
 * @returns {string[]} - Array berisi ID hotel yang dipilih.
 */
function getSelectedHotels(prefix) {
    const hotelCheckboxes = document.querySelectorAll(`#${prefix}-hotel-checklist-container input[type="checkbox"]:checked`);
    return Array.from(hotelCheckboxes).map(cb => cb.value);
}
