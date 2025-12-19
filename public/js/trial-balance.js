// --- TRIAL BALANCE MANAGEMENT FUNCTIONS ---

document.addEventListener('DOMContentLoaded', function () {
    // Inisialisasi hanya jika halaman trial balance aktif
    if (document.getElementById('page-trial-balance')) {
        initTrialBalancePage();
    }
});

/**
 * Inisialisasi halaman Trial Balance.
 */
function initTrialBalancePage() {
    const form = document.getElementById('add-trial-balance-form');
    if (form) {
        // Hapus event listener lama untuk mencegah duplikasi
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        newForm.addEventListener('submit', handleSaveTrialBalance);
    }

    const trialBalanceGrid = document.getElementById('trial-balance-grid');
    if (trialBalanceGrid) {
        new Sortable(trialBalanceGrid, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            onEnd: async function (evt) {
                const orderedIds = Array.from(trialBalanceGrid.children)
                    .map(card => card.dataset.id)
                    .filter(id => id); // Pastikan tidak ada ID yang null atau undefined

                // Cek apakah ada ID yang tidak valid (bukan angka)
                if (orderedIds.some(id => isNaN(parseInt(id, 10)))) {
                    showToast('Error: Terdapat ID yang tidak valid.', 'error');
                    loadTrialBalances(); // Muat ulang untuk sinkronisasi
                    return;
                }

                // Jangan lakukan apa-apa jika tidak ada item untuk diurutkan
                if (orderedIds.length === 0) {
                    return;
                }

                try {
                    const response = await fetch(`${API_BASE_URL}/api/trial-balances/reorder`, {
                        method: 'PUT',
                        headers: getAuthHeaders(),
                        body: JSON.stringify({ order: orderedIds }),
                    });

                    if (!response.ok) {
                        const errData = await response.json().catch(() => ({ error: 'Gagal memproses respons dari server.' }));
                        throw new Error(errData.error || 'Gagal menyimpan urutan.');
                    }

                    showToast('Urutan berhasil disimpan.', 'success');
                    // Tidak perlu memuat ulang jika hanya ingin konfirmasi,
                    // karena secara visual sudah di-update oleh SortableJS.
                    // Namun, jika ingin memastikan data 100% sinkron, panggil loadTrialBalances().

                } catch (error) {
                    showToast(`Terjadi kesalahan: ${error.message}`, 'error');
                    // Jika gagal, muat ulang untuk mengembalikan ke urutan semula dari server
                    loadTrialBalances();
                }
            },
        });
    }

    // BARU: Tambahkan event listener untuk filter status
    const statusFilter = document.getElementById('trial-balance-status-filter');
    if (statusFilter) {
        statusFilter.addEventListener('change', loadTrialBalances);
    }

    loadTrialBalances();
}

/**
 * Memuat data Trial Balance dari API dan menampilkannya.
 */
async function loadTrialBalances() {
    const grid = document.getElementById('trial-balance-grid');
    const message = document.getElementById('no-trial-balance-message');
    const statusFilter = document.getElementById('trial-balance-status-filter');
    
    if (!grid || !message || !statusFilter) return;

    const selectedStatus = statusFilter.value;
    let url = '/api/trial-balances';
    if (selectedStatus && selectedStatus !== 'all') {
        url += `?status=${selectedStatus}`;
    }

    grid.innerHTML = '<p class="col-span-full text-center p-4"><i class="fa-solid fa-circle-notch fa-spin"></i> Memuat data...</p>';
    message.classList.add('hidden');

    try {
        const trialBalances = await fetchAPI(url); 

        grid.innerHTML = '';
        if (trialBalances.length === 0) {
            message.classList.remove('hidden');
        } else {
            trialBalances.forEach(item => renderTrialBalanceCard(item));
        }
    } catch (error) {
        grid.innerHTML = `<p class="col-span-full text-center p-4 text-red-500">${error.message}</p>`;
    }
}

/**
 * Merender satu kartu Trial Balance ke dalam grid.
 * @param {object} item - Objek data Trial Balance.
 */
function renderTrialBalanceCard(item) {
    const grid = document.getElementById('trial-balance-grid');
    const placeholderImage = 'https://via.placeholder.com/400x300.png?text=No+Image';
    // Gunakan thumbnail_url jika ada, jika tidak, gunakan placeholder
    const thumbnailUrl = item.thumbnail_url || placeholderImage; // Tetap gunakan thumbnail_url untuk gambar

    if (!grid) return;

    const statusStyles = {
        closed: {
            label: 'Sudah Closing',
            cardClass: 'shadow-blue-800/20 hover:shadow-blue-800/30', // Biru Navy
            badgeClass: 'bg-blue-800 text-white'
        },
        in_audit: {
            label: 'Sedang Diaudit',
            cardClass: 'shadow-orange-500/20 hover:shadow-orange-500/30', // Orange
            badgeClass: 'bg-orange-500 text-white'
        },
        not_audited: {
            label: 'Belum Diaudit',
            cardClass: 'shadow-slate-400/20 hover:shadow-slate-400/30', // Abu-abu
            badgeClass: 'bg-slate-200 text-slate-700'
        }
    };

    const style = statusStyles[item.status] || statusStyles.not_audited;

    const card = document.createElement('div');
    card.className = `bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col group ${style.cardClass}`;
    card.dataset.id = item.id;

    // Siapkan link folder. Jika ada, buat tombolnya.
    const driveFolderLink = item.drive_folder_link;
    const folderButtonHtml = driveFolderLink 
        ? `<a href="${driveFolderLink}" target="_blank" rel="noopener noreferrer" class="text-sm text-slate-600 hover:text-blue-700 font-medium py-1 px-2 rounded-md hover:bg-blue-100 transition-colors" title="Buka Folder Google Drive">
               <i class="fa-brands fa-google-drive"></i>
           </a>`
        : '';

    card.innerHTML = `
        <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="block group-hover:opacity-80 transition-opacity">
            <img class="w-full h-32 object-cover rounded-t-xl" src="${thumbnailUrl}" alt="Thumbnail for ${item.title}" onerror="this.onerror=null;this.src='${placeholderImage}';">
        </a>
        <div class="p-4 flex-grow flex flex-col">
            <div class="flex-grow">
                <a href="${item.link}" target="_blank" rel="noopener noreferrer">
                    <h3 class="font-bold text-sm leading-tight mb-2 group-hover:text-blue-600 transition-colors" title="${item.title}">${item.title}</h3>
                </a>
            </div>
            <div class="mt-2"><span class="text-xs font-semibold px-2 py-1 rounded-full ${style.badgeClass}">${style.label}</span></div>
        </div>
        <div class="p-2 bg-slate-50 border-t border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between">
            <div class="flex items-center gap-1">
                <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="text-sm text-slate-600 hover:text-green-700 font-medium py-1 px-2 rounded-md hover:bg-green-100 transition-colors" title="Buka Google Sheet">
                    <i class="fa-solid fa-file-excel"></i>
                </a>
                ${folderButtonHtml}
            </div>
            <div class="flex items-center gap-1">
                <button onclick="openEditTrialBalanceModal(${item.id})" class="text-sm text-slate-600 hover:text-blue-700 font-medium py-1 px-3 rounded-md hover:bg-blue-100 transition-colors" title="Edit">
                    <i class="fa-solid fa-pen-to-square"></i> Edit
                </button>
                <button onclick="handleDeleteTrialBalance(${item.id})" class="text-sm text-slate-600 hover:text-red-700 font-medium py-1 px-3 rounded-md hover:bg-red-100 transition-colors" title="Hapus">
                    <i class="fa-solid fa-trash-can"></i> Hapus
                </button>
            </div>
        </div>
    `;
    grid.appendChild(card);
}

/**
 * Menangani penyimpanan data (baik tambah baru maupun edit).
 * @param {Event} event - Event dari form submission.
 */
async function handleSaveTrialBalance(event) {
    event.preventDefault();
    const form = event.target;
    const submitBtn = document.getElementById('add-trial-balance-submit-btn');
    const errorDiv = document.getElementById('add-trial-balance-error');

    const formData = new FormData(form);
    const trialBalanceId = formData.get('trialBalanceId');
    const data = {
        title: formData.get('title'),
        link: formData.get('link'),
        status: formData.get('status'),
        drive_folder_link: formData.get('drive_folder_link') || null, // Ambil link folder, kirim null jika kosong
        thumbnail_url: formData.get('thumbnail_url'), // Ambil thumbnail_url
    };

    const isEditing = !!trialBalanceId;
    const url = isEditing ? `/api/trial-balances/${trialBalanceId}` : '/api/trial-balances';
    const method = isEditing ? 'PUT' : 'POST';

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Menyimpan...';
    errorDiv.classList.add('hidden');

    try {
        await fetchAPI(url, { method, body: JSON.stringify(data) });
        showToast(`Data berhasil ${isEditing ? 'diperbarui' : 'disimpan'}!`, 'success');
        closeAddTrialBalanceModal();
        loadTrialBalances();
    } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.classList.remove('hidden');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Simpan';
    }
}

/**
 * Membuka modal edit dan mengisi data yang ada.
 * @param {number} id - ID dari Trial Balance yang akan diedit.
 */
async function openEditTrialBalanceModal(id) {
    try {
        const item = await fetchAPI(`/api/trial-balances/${id}`);
        
        document.getElementById('add-trial-balance-modal-title').textContent = 'Edit Trial Balance';
        document.getElementById('trial-balance-id').value = item.id;
        document.getElementById('trial-balance-title').value = item.title;
        document.getElementById('trial-balance-link').value = item.link;
        document.getElementById('trial-balance-status').value = item.status;
        document.getElementById('trial-balance-drive-folder-link').value = item.drive_folder_link || ''; // Set link folder
        document.getElementById('trial-balance-thumbnail').value = item.thumbnail_url || ''; // Set thumbnail URL
        
        // Panggil fungsi dari ui.js untuk membuka modal
        openAddTrialBalanceModal(true); // true menandakan ini mode edit

    } catch (error) {
        showToast(`Gagal memuat data untuk diedit: ${error.message}`, 'error');
    }
}

/**
 * Menangani penghapusan data Trial Balance.
 * @param {number} id - ID dari Trial Balance yang akan dihapus.
 */
async function handleDeleteTrialBalance(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus data Trial Balance ini?')) {
        return;
    }

    try {
        await fetchAPI(`/api/trial-balances/${id}`, { method: 'DELETE' });
        showToast('Data berhasil dihapus!', 'success');
        loadTrialBalances();
    } catch (error) {
        showToast(`Gagal menghapus data: ${error.message}`, 'error');
    }
}
