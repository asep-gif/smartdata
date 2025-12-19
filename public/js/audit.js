// public/js/audit.js

/**
 * =================================================================================
 * AUDIT AGENDA MANAGEMENT
 * =================================================================================
 * Description: Handles CRUD functionality for the audit agenda page.
 * This script is dependent on `utils.js` for `fetchAPI` and `showToast`.
 */

// --- INITIALIZATION ---

/**
 * Initializes the Audit Agenda page when its hash is active.
 * Sets up event listeners and loads initial data.
 */
function initAuditAgendaPage() {
    // Add event listener for the save/edit form
    const form = document.getElementById('add-edit-agenda-form');
    if (form) {
        // Clone and replace to avoid attaching multiple listeners on hash changes
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        newForm.addEventListener('submit', handleSaveAgenda);
    }

    // Load initial data
    loadAuditAgendas();
    // Populate the hotel dropdown in the modal
    populateAgendaHotelDropdown();
}

// --- DATA FETCHING AND RENDERING ---

/**
 * Fetches audit agenda data from the API and renders it in the table.
 */
async function loadAuditAgendas() {
    const tableBody = document.getElementById('audit-agenda-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = `<tr><td colspan="6" class="text-center p-8 text-slate-500"><i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Memuat data agenda...</td></tr>`;

    try {
        // PERBAIKAN: Sesuaikan endpoint dengan yang ada di server.js
        const agendas = await fetchAPI('/api/audit-agendas');
        renderAuditAgendaTable(agendas);
    } catch (error) {
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center p-8 text-red-500">Gagal memuat data: ${error.message}</td></tr>`;
        showToast(error.message, 'error');
    }
}

/**
 * Renders the agenda data into the table.
 * @param {Array<Object>} agendas - An array of agenda objects.
 */
function renderAuditAgendaTable(agendas) {
    const tableBody = document.getElementById('audit-agenda-table-body');
    tableBody.innerHTML = '';

    if (!agendas || agendas.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center p-8 text-slate-500">Belum ada agenda audit yang dijadwalkan.</td></tr>`;
        return;
    }

    agendas.forEach(agenda => {
        const tr = document.createElement('tr');
        tr.className = 'bg-white border-b hover:bg-slate-50';

        const formattedDate = new Date(agenda.date).toLocaleDateString('id-ID', {
            day: '2-digit', month: 'long', year: 'numeric'
        });

        // Helper for status badge
        const getStatusBadge = (status) => {
            const styles = {
                planned: 'bg-blue-100 text-blue-800',
                on_progress: 'bg-yellow-100 text-yellow-800',
                completed: 'bg-green-100 text-green-800',
                cancelled: 'bg-red-100 text-red-800',
            };
            const style = styles[status] || 'bg-slate-100 text-slate-800';
            const label = (status || '').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
            return `<span class="text-xs font-medium me-2 px-2.5 py-0.5 rounded-full ${style}">${label}</span>`;
        };

        tr.innerHTML = `
            <td class="px-6 py-4 font-medium text-slate-800">${formattedDate}</td>
            <td class="px-6 py-4">${agenda.hotel_name || 'N/A'}</td>
            <td class="px-6 py-4">${agenda.auditor}</td>
            <td class="px-6 py-4">${getStatusBadge(agenda.status)}</td>
            <td class="px-6 py-4 text-slate-600 break-words max-w-xs">${agenda.notes || '-'}</td>
            <td class="px-6 py-4 text-center">
                <div class="flex justify-center items-center gap-2">
                    <button onclick="window.location.hash = '#audit-report/${agenda.id}'" class="w-8 h-8 flex items-center justify-center text-slate-500 bg-slate-100 hover:bg-green-100 hover:text-green-600 rounded-full transition-colors" title="Lihat Laporan">
                        <i class="fa-solid fa-file-alt h-4 w-4"></i>
                    </button>
                    <button onclick="openAddEditAgendaModal(${agenda.id})" class="w-8 h-8 flex items-center justify-center text-slate-500 bg-slate-100 hover:bg-blue-100 hover:text-blue-600 rounded-full transition-colors" title="Edit Agenda">
                        <i class="fa-solid fa-pen-to-square h-4 w-4"></i>
                    </button>
                    <button onclick="handleDeleteAgenda(${agenda.id})" class="w-8 h-8 flex items-center justify-center text-slate-500 bg-slate-100 hover:bg-red-100 hover:text-red-600 rounded-full transition-colors" title="Hapus Agenda">
                        <i class="fa-solid fa-trash-can h-4 w-4"></i>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

/**
 * Populates the hotel selection dropdown in the agenda modal.
 */
async function populateAgendaHotelDropdown() {
    const hotelSelect = document.getElementById('agenda-hotel-select');
    if (!hotelSelect) return;

    try {
        // Assuming a generic /api/hotels endpoint exists from other modules
        const hotels = await fetchAPI('/api/hotels');
        hotelSelect.innerHTML = '<option value="">-- Pilih Hotel --</option>';
        hotels.forEach(hotel => {
            const option = new Option(hotel.name, hotel.id);
            hotelSelect.add(option);
        });
    } catch (error) {
        hotelSelect.innerHTML = '<option value="">Gagal memuat hotel</option>';
        console.error('Failed to load hotels for agenda modal:', error);
    }
}

// --- MODAL AND FORM HANDLING ---

/**
 * Opens the modal to add a new agenda or edit an existing one.
 * @param {number|null} agendaId - The ID of the agenda to edit, or null to add a new one.
 * @param {string|null} defaultDate - A default date string (YYYY-MM-DD) for new agendas.
 */
async function openAddEditAgendaModal(agendaId = null, defaultDate = null) {
    const modal = document.getElementById('add-edit-agenda-modal');
    const form = document.getElementById('add-edit-agenda-form');
    const modalTitle = document.getElementById('agenda-modal-title');
    const errorDiv = document.getElementById('add-edit-agenda-error');
    
    form.reset();
    errorDiv.classList.add('hidden');
    document.getElementById('agenda-id').value = '';

    if (agendaId) {
        // --- Edit Mode ---
        modalTitle.textContent = 'Edit Agenda Kunjungan';
        try {
            const agenda = await fetchAPI(`/api/audit-agendas/${agendaId}`);
            document.getElementById('agenda-id').value = agenda.id;
            document.getElementById('agenda-date').value = agenda.date.split('T')[0]; // Format to YYYY-MM-DD
            document.getElementById('agenda-hotel-select').value = agenda.hotel_id;
            document.getElementById('agenda-auditor').value = agenda.auditor;
            document.getElementById('agenda-status').value = agenda.status;
            document.getElementById('agenda-notes').value = agenda.notes || '';
        } catch (error) {
            showToast(`Gagal memuat data agenda: ${error.message}`, 'error');
            return; // Don't open modal if data loading fails
        }
    } else {
        // --- Add Mode ---
        modalTitle.textContent = 'Tambah Agenda Baru';
        // BARU: Gunakan tanggal yang diklik dari kalender, atau default ke hari ini
        if (defaultDate) {
            document.getElementById('agenda-date').value = defaultDate;
        } else {
            document.getElementById('agenda-date').valueAsDate = new Date();
        }
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

/**
 * Closes the add/edit agenda modal.
 */
function closeAddEditAgendaModal() {
    const modal = document.getElementById('add-edit-agenda-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

/**
 * Handles the form submission for creating or updating an agenda.
 * @param {Event} event - The form submission event.
 */
async function handleSaveAgenda(event) {
    event.preventDefault();
    const form = event.target;
    const submitBtn = document.getElementById('add-edit-agenda-submit-btn');
    const errorDiv = document.getElementById('add-edit-agenda-error');

    const formData = new FormData(form);
    const agendaId = formData.get('agendaId');
    
    const payload = {
        date: formData.get('date'),
        hotel_id: formData.get('hotelId'),
        auditor: formData.get('auditor'),
        status: formData.get('status'),
        notes: formData.get('notes'),
    };

    // Basic validation
    if (!payload.date || !payload.hotel_id || !payload.auditor || !payload.status) {
        errorDiv.textContent = 'Harap isi semua field yang wajib diisi (*).';
        errorDiv.classList.remove('hidden');
        return;
    }

    const isEditing = !!agendaId;
    const url = isEditing ? `/api/audit-agendas/${agendaId}` : '/api/audit-agendas';
    const method = isEditing ? 'PUT' : 'POST';

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Menyimpan...';
    errorDiv.classList.add('hidden');

    try {
        const savedAgenda = await fetchAPI(url, { method, body: JSON.stringify(payload) });
        showToast(`Agenda berhasil ${isEditing ? 'diperbarui' : 'ditambahkan'}!`, 'success');
        closeAddEditAgendaModal();
        loadAuditAgendas(); // Refresh the table

        // BARU: Jika status diubah menjadi "On Progress", buka modal checklist
        if (payload.status === 'on_progress' && savedAgenda) {
            openAuditChecklistModal(savedAgenda.id, savedAgenda.hotel_id);
        }

    } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.classList.remove('hidden');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Simpan';
    }
}

/**
 * Handles the deletion of an audit agenda.
 * @param {number} agendaId - The ID of the agenda to delete.
 */
async function handleDeleteAgenda(agendaId) {
    if (!confirm('Apakah Anda yakin ingin menghapus agenda ini? Aksi ini tidak dapat dibatalkan.')) {
        return;
    }

    try {
        await fetchAPI(`/api/audit-agendas/${agendaId}`, { method: 'DELETE' });
        showToast('Agenda berhasil dihapus.', 'success');
        loadAuditAgendas(); // Refresh the table
    } catch (error) {
        showToast(`Gagal menghapus agenda: ${error.message}`, 'error');
    }
}

// --- AUDIT CHECKLIST MODAL ---

/**
 * BARU: Membuka modal checklist audit.
 * @param {number} agendaId - ID dari agenda audit yang sedang berlangsung.
 * @param {number} hotelId - ID dari hotel yang diaudit.
 */
async function openAuditChecklistModal(agendaId, hotelId) {
    const modal = document.getElementById('audit-checklist-modal');
    if (!modal) return;

    document.getElementById('checklist-agenda-id').value = agendaId;

    // Tampilkan modal dengan pesan loading
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    const contentDiv = document.getElementById('audit-checklist-modal-content');
    const hotelNameSpan = document.getElementById('checklist-modal-hotel-name');
    const saveBtn = document.getElementById('save-audit-checklist-btn');
    saveBtn.onclick = () => handleSaveAuditChecklist(agendaId);

    contentDiv.innerHTML = `<div class="text-center p-8"><i class="fa-solid fa-circle-notch fa-spin text-2xl text-blue-500"></i><p class="mt-2 text-slate-500">Memuat checklist...</p></div>`;
    hotelNameSpan.textContent = '...';

    try {
        // Ambil semua data yang diperlukan secara paralel
        const [hotel, masterChecklist, existingResults] = await Promise.all([
            fetchAPI(`/api/hotels/${hotelId}`),
            fetchAPI('/api/audit-checklists'),
            fetchAPI(`/api/audit-results?agendaId=${agendaId}`)
        ]);

        hotelNameSpan.textContent = hotel.name;

        // Gabungkan master checklist dengan hasil yang sudah ada
        const resultsMap = new Map(existingResults.map(r => [r.item_id, r]));
        const checklistWithData = masterChecklist.map(category => ({
            ...category,
            items: category.items.map(item => ({
                ...item,
                ...resultsMap.get(item.id) // Gabungkan dengan hasil yang ada
            }))
        }));

        renderAuditChecklistModalForm(checklistWithData, contentDiv, agendaId);

    } catch (error) {
        contentDiv.innerHTML = `<p class="text-red-500 text-center">Gagal memuat data checklist: ${error.message}</p>`;
        showToast('Gagal memuat data checklist.', 'error');
    }
}

/**
 * BARU: Merender form checklist dinamis ke dalam modal.
 * @param {Array} checklist - Array kategori dan item checklist dengan data hasil.
 * @param {HTMLElement} container - Elemen kontainer untuk form.
 * @param {number} agendaId - ID agenda saat ini.
 */
function renderAuditChecklistModalForm(checklist, container, agendaId) {
    container.innerHTML = '';

    if (!checklist || checklist.length === 0) {
        container.innerHTML = `<p class="text-slate-500 text-center">Tidak ada master checklist yang dikonfigurasi. Silakan atur di halaman Settings.</p>`;
        return;
    }

    checklist.forEach(category => {
        const categorySection = document.createElement('div');
        categorySection.className = 'bg-slate-50 border border-slate-200 rounded-lg p-4';
        categorySection.innerHTML = `<h4 class="font-bold text-slate-700 mb-3 pb-2 border-b">${category.name}</h4>`;

        const itemsList = document.createElement('div');
        // Hapus space-y-4, karena item akan memiliki pemisah sendiri

        category.items.forEach(item => {
            const itemDiv = document.createElement('div');
            // PERBAIKAN: Ubah struktur menjadi kontainer sederhana dengan border pemisah
            itemDiv.className = 'py-4 border-b border-slate-200 last:border-b-0';
            itemDiv.dataset.itemId = item.id;

            const checkPass = item.result === 'pass' ? 'checked' : '';
            const checkFail = item.result === 'fail' ? 'checked' : '';
            const checkNA = !item.result || item.result === 'n/a' ? 'checked' : '';

            // PERBAIKAN: Tata letak baru yang lebih responsif
            itemDiv.innerHTML = `
                <!-- Nama Item & Standar selalu di atas -->
                <div>
                    <label class="font-medium text-slate-800 text-sm">${item.name}</label>
                    ${item.standard ? `<p class="text-xs text-slate-500 mt-1">${item.standard}</p>` : ''}
                </div>
                <!-- Kontrol (Pilihan, Catatan, Foto) di bawah dalam grid responsif -->
                <div class="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                    <div class="flex items-center gap-x-6 gap-y-2 flex-wrap">
                        <div class="flex items-center"><input type="radio" id="pass_${item.id}" name="result_${item.id}" value="pass" class="form-radio" ${checkPass}><label for="pass_${item.id}" class="ml-2 text-sm">Pass</label></div>
                        <div class="flex items-center"><input type="radio" id="fail_${item.id}" name="result_${item.id}" value="fail" class="form-radio" ${checkFail}><label for="fail_${item.id}" class="ml-2 text-sm">Fail</label></div>
                        <div class="flex items-center"><input type="radio" id="na_${item.id}" name="result_${item.id}" value="n/a" class="form-radio" ${checkNA}><label for="na_${item.id}" class="ml-2 text-sm">N/A</label></div>
                    </div>
                    <div class="flex items-center gap-2">
                        <textarea name="notes_${item.id}" class="form-input text-sm w-full" rows="1" placeholder="Catatan...">${item.notes || ''}</textarea>
                        <input type="file" id="photo_${item.id}" class="hidden" accept="image/*" onchange="handleAuditPhotoUpload(event, ${agendaId}, ${item.id})">
                        <button type="button" onclick="document.getElementById('photo_${item.id}').click()" class="h-9 w-9 bg-slate-200 text-slate-600 hover:bg-slate-300 rounded-md flex-shrink-0 transition-colors" title="Upload Foto"><i class="fa-solid fa-camera"></i></button>
                        <button type="button" id="view_photo_btn_${item.id}" onclick="showPhotoModal('${item.image_url}')" class="h-9 w-9 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-md flex-shrink-0 transition-colors ${!item.image_url ? 'hidden' : ''}" title="Lihat Foto"><i class="fa-solid fa-image"></i></button>
                    </div>
                </div>
            `;
            itemsList.appendChild(itemDiv);
        });

        categorySection.appendChild(itemsList);
        container.appendChild(categorySection);
    });
}

/**
 * BARU: Menangani upload foto untuk item checklist audit.
 */
async function handleAuditPhotoUpload(event, agendaId, itemId) {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('photo', file);
    formData.append('agendaId', agendaId);
    formData.append('itemId', itemId);

    showToast('Mengupload foto...', 'info');
    try {
        const result = await fetchAPI('/api/audit-results/upload-photo', { method: 'POST', body: formData });
        showToast('Foto berhasil diupload!', 'success');
        const viewBtn = document.getElementById(`view_photo_btn_${itemId}`);
        viewBtn.setAttribute('onclick', `showPhotoModal('${result.imageUrl}')`);
        viewBtn.classList.remove('hidden');
    } catch (error) {
        showToast(`Gagal mengupload foto: ${error.message}`, 'error');
    }
}

/**
 * BARU: Mengumpulkan dan menyimpan semua hasil checklist.
 */
async function handleSaveAuditChecklist(agendaId) {
    if (!confirm('Apakah Anda yakin ingin menyimpan dan menyelesaikan audit ini? Status agenda akan diubah menjadi "Completed".')) return;

    const saveBtn = document.getElementById('save-audit-checklist-btn');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Menyimpan...';

    const results = [];
    const itemElements = document.querySelectorAll('#audit-checklist-form [data-item-id]');
    itemElements.forEach(itemEl => {
        const itemId = itemEl.dataset.itemId;
        const result = itemEl.querySelector(`input[name="result_${itemId}"]:checked`)?.value || 'n/a';
        const notes = itemEl.querySelector(`textarea[name="notes_${itemId}"]`)?.value || '';
        results.push({ itemId, result, notes });
    });

    try {
        await fetchAPI('/api/audit-results', {
            method: 'POST',
            body: JSON.stringify({ agendaId, results })
        });
        showToast('Checklist berhasil disimpan dan audit diselesaikan!', 'success');
        closeAuditChecklistModal();
        loadAuditAgendas(); // Refresh tabel agenda utama
    } catch (error) {
        showToast(`Gagal menyimpan checklist: ${error.message}`, 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = 'Simpan & Selesaikan Audit';
    }
}

/**
 * BARU: Menutup modal checklist audit.
 */
function closeAuditChecklistModal() {
    const modal = document.getElementById('audit-checklist-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

// --- AUDIT REPORT PAGE ---

/**
 * BARU: Inisialisasi halaman laporan audit.
 * @param {number} agendaId - ID dari agenda audit.
 */
async function initAuditReportPage(agendaId) {
    const content = document.getElementById('audit-report-content');
    if (!content) return;

    // Reset view
    document.getElementById('report-hotel-name').textContent = 'Memuat...';
    document.getElementById('report-audit-date').textContent = 'Memuat...';
    document.getElementById('report-auditor-name').textContent = 'Memuat...';
    document.getElementById('report-summary-score').textContent = '-%';
    document.getElementById('report-summary-total').textContent = '-';
    document.getElementById('report-summary-pass').textContent = '-';
    document.getElementById('report-summary-fail').textContent = '-';
    document.getElementById('report-summary-na').textContent = '-';
    document.getElementById('report-checklist-details').innerHTML = `<div class="text-center p-8"><i class="fa-solid fa-circle-notch fa-spin text-2xl text-blue-500"></i><p class="mt-2 text-slate-500">Memuat detail laporan...</p></div>`;

    try {
        const reportData = await fetchAPI(`/api/audit-agendas/${agendaId}/report`);
        renderAuditReport(reportData);
    } catch (error) {
        showToast(`Gagal memuat laporan: ${error.message}`, 'error');
        document.getElementById('report-checklist-details').innerHTML = `<p class="text-red-500 text-center">Gagal memuat laporan: ${error.message}</p>`;
    }
}

/**
 * BARU: Merender data laporan audit ke halaman.
 * @param {object} reportData - Data laporan dari API.
 */
function renderAuditReport(reportData) {
    const { agenda, summary, checklist } = reportData;

    document.getElementById('report-hotel-name').textContent = agenda.hotel_name;
    document.getElementById('report-audit-date').textContent = new Date(agenda.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    document.getElementById('report-auditor-name').textContent = agenda.auditor;

    document.getElementById('report-summary-score').textContent = `${summary.score}%`;
    document.getElementById('report-summary-total').textContent = summary.totalItems;
    document.getElementById('report-summary-pass').textContent = summary.passCount;
    document.getElementById('report-summary-fail').textContent = summary.failCount;
    document.getElementById('report-summary-na').textContent = summary.naCount;

    // BARU: Isi nama auditor di bagian tanda tangan
    const signatureAuditorName = document.getElementById('signature-auditor-name');
    if (signatureAuditorName) {
        signatureAuditorName.textContent = agenda.auditor;
    }

    const detailsContainer = document.getElementById('report-checklist-details');
    detailsContainer.innerHTML = '';

    if (!checklist || checklist.length === 0) {
        detailsContainer.innerHTML = '<p class="text-center text-slate-500">Tidak ada data checklist untuk ditampilkan.</p>';
        return;
    }

    checklist.forEach(category => {
        detailsContainer.innerHTML += `
            <div class="page-break-before">
                <h4 class="text-lg font-bold text-slate-800 mb-3 pb-2 border-b-2 border-slate-300">${category.name}</h4>
                <div class="space-y-3">${category.items.map(renderReportItem).join('')}</div>
            </div>`;
    });
}

/**
 * BARU: Merender satu item dalam laporan checklist.
 * @param {object} item - Objek item checklist.
 * @returns {string} - String HTML untuk satu item.
 */
function renderReportItem(item) {
    const statusBadges = { pass: 'bg-green-100 text-green-800', fail: 'bg-red-100 text-red-800', 'n/a': 'bg-yellow-100 text-yellow-800' };
    const badge = `<span class="text-xs font-bold uppercase px-2 py-1 rounded-full ${statusBadges[item.result] || 'bg-slate-100 text-slate-800'}">${item.result}</span>`;

    return `
        <div class="p-3 border border-slate-200 rounded-lg">
            <div class="flex justify-between items-start gap-4"><div class="flex-1"><p class="font-semibold text-slate-700">${item.name}</p>${item.standard ? `<p class="text-xs text-slate-500 mt-1 italic">Standar: ${item.standard}</p>` : ''}</div><div class="flex-shrink-0">${badge}</div></div>
            ${(item.notes || item.imageUrl) ? `<div class="mt-3 pt-3 border-t border-dashed border-slate-200">${item.notes ? `<p class="text-sm text-slate-600"><strong class="font-medium">Catatan:</strong> ${item.notes}</p>` : ''}${item.imageUrl ? `<div class="mt-2"><p class="text-sm font-medium text-slate-600 mb-1">Bukti Foto:</p><a href="${item.imageUrl}" target="_blank" rel="noopener noreferrer"><img src="${item.imageUrl}" alt="Bukti Foto" class="max-w-xs h-auto rounded-md border shadow-sm"></a></div>` : ''}</div>` : ''}
        </div>`;
}

/**
 * This function should be called from your main router (e.g., in ui.js or script.js)
 * when the hash changes to '#audit-agenda'.
 * Example in your router:
 *   case '#audit-agenda':
 *       initAuditAgendaPage();
 *       setHeaderTitle('Agenda Audit');
 *       break;
 */