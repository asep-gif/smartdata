

// =================================================================================
// INSPECTION MODULE JAVASCRIPT
// =================================================================================
// Author: Gemini Code Assist
// Description: Handles all client-side logic for the Inspection feature set,
//              including the dashboard, inspection forms, and task lists.
// =================================================================================

/**
 * BARU: Menampilkan halaman formulir inspeksi dan memuat datanya.
 * @param {string} inspectionId - ID dari inspeksi yang akan ditampilkan.
 */
async function showInspectionFormPage(inspectionId) {
    // Sembunyikan semua halaman lain dan tampilkan halaman form
    document.querySelectorAll('.page-content-wrapper').forEach(el => el.classList.add('hidden'));
    const pageElement = document.getElementById('page-inspection-form');
    if (pageElement) {
        pageElement.classList.remove('hidden');
    }
    
    const contentDiv = document.getElementById('inspection-form-content');
    const titleEl = document.getElementById('inspection-form-title');
    const subtitleEl = document.getElementById('inspection-form-subtitle');

    titleEl.textContent = 'Mengisi Formulir Inspeksi';
    subtitleEl.textContent = 'Memuat detail...';
    contentDiv.innerHTML = `<div class="text-center p-8"><i class="fa-solid fa-circle-notch fa-spin text-2xl text-blue-500"></i></div>`;

    if (inspectionId === 'new') {
        // --- LOGIKA UNTUK INSPEKSI BARU ---
        try {
            const params = new URLSearchParams(window.location.hash.split('?')[1]);
            const hotelId = params.get('hotelId');
            const typeId = params.get('typeId');

            if (!hotelId || !typeId) throw new Error("Parameter hotel atau tipe inspeksi tidak ditemukan.");

            // Panggil endpoint baru yang lebih efisien
            const preparedData = await fetchAPI(`/api/inspections/prepare?hotelId=${hotelId}&typeId=${typeId}`);
            const user = JSON.parse(localStorage.getItem('user'));

            // Rakit objek data inspeksi tiruan untuk dirender
            const mockInspectionData = {
                id: 'new',
                status: 'new',
                hotel_id: hotelId, // BARU: Tambahkan hotel_id ke data mock
                hotel_name: preparedData.hotel_name,
                inspection_type_name: preparedData.inspection_type_name,
                inspector_name: user.full_name,
                inspection_date: new Date().toISOString().split('T')[0], // BARU: Tambahkan tanggal inspeksi default
                checklist: preparedData.checklist
            };

            titleEl.textContent = `Inspeksi Baru: ${mockInspectionData.inspection_type_name}`;
            subtitleEl.textContent = `Untuk ${mockInspectionData.hotel_name} oleh ${mockInspectionData.inspector_name}`;
            renderInspectionForm(mockInspectionData, contentDiv, false); // isReadOnly = false

        } catch (error) {
            contentDiv.innerHTML = `<div class="text-center p-8 text-red-500">Gagal memulai inspeksi baru: ${error.message}</div>`;
            showToast(error.message, 'error');
        }
        return; // Hentikan eksekusi di sini untuk inspeksi baru
    }

    try {
        const inspectionData = await fetchAPI(`/api/inspections/${inspectionId}`);
        
        // BARU: Tentukan apakah form harus read-only
        const isReadOnly = inspectionData.status === 'completed';

        // Update header halaman
        titleEl.textContent = `Inspeksi: ${inspectionData.inspection_type_name}`;
        subtitleEl.textContent = `Untuk ${inspectionData.hotel_name} oleh ${inspectionData.inspector_name}`;
        if (isReadOnly) {
            subtitleEl.textContent += ` (Selesai - Hanya Lihat)`;
        }

        // Render form dinamis
        renderInspectionForm(inspectionData, contentDiv, isReadOnly);

    } catch (error) {
        contentDiv.innerHTML = `<div class="text-center p-8 text-red-500">Gagal memuat data inspeksi: ${error.message}</div>`;
        showToast(error.message, 'error');
    }
}

/**
 * BARU: Menangani pencetakan formulir inspeksi ke PDF.
 * @param {object} inspectionData - Data inspeksi untuk nama file.
 */
async function handlePrintInspectionToPdf(inspectionData) {
    const printBtn = document.getElementById('print-inspection-btn');
    if (!printBtn) return;

    printBtn.disabled = true;
    printBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-2"></i>Mencetak...';
    showToast('Mempersiapkan PDF, mohon tunggu...', 'info');

    const formContent = document.getElementById('inspection-printable-area');
    const { jsPDF } = window.jspdf; // PERBAIKAN: Menggunakan jsPDF dari global scope

    try {
        const canvas = await html2canvas(formContent, {
            scale: 2, // Meningkatkan resolusi gambar
            useCORS: true,
            logging: false,
            onclone: (document) => {
                // Sembunyikan tombol aksi agar tidak ikut tercetak
                const actionDiv = document.querySelector('.pt-6.border-t.flex.justify-end.gap-3');
                if (actionDiv) actionDiv.style.display = 'none';
            }
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        
        let dateToUse;
        if (inspectionData.inspection_date && !isNaN(new Date(inspectionData.inspection_date))) {
            dateToUse = new Date(inspectionData.inspection_date).toISOString().split('T')[0];
        } else {
            dateToUse = new Date().toISOString().split('T')[0]; // Fallback to current date
        }

        const fileName = `Inspeksi_${inspectionData.hotel_name.replace(/\s+/g, '_')}_${dateToUse}.pdf`;
        pdf.save(fileName);
    } catch (error) {
        console.error("Error generating PDF:", error);
        showToast('Gagal membuat PDF.', 'error');
    } finally {
        printBtn.disabled = false;
        printBtn.innerHTML = '<i class="fa-solid fa-print mr-2"></i>Cetak ke PDF';
    }
}

/**
 * BARU: Merender formulir checklist dinamis dari data API.
 * @param {object} data - Data inspeksi lengkap dari API.
 * @param {HTMLElement} container - Elemen div untuk menampung formulir.
 */
function renderInspectionForm(data, container, isReadOnly = false) {
    container.innerHTML = ''; // Kosongkan container

    const form = document.createElement('form');
    form.id = 'dynamic-inspection-form';
    form.className = 'space-y-8';

    // BARU: Tambahkan tombol cetak di atas form
    const printButtonHtml = `
        <div class="mb-4 text-right">
            <button type="button" id="print-inspection-btn" class="bg-slate-700 hover:bg-slate-800 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                <i class="fa-solid fa-print mr-2"></i>Cetak ke PDF
            </button>
        </div>
    `;
    container.innerHTML += printButtonHtml;

    const headerDiv = document.createElement('div');
    headerDiv.className = 'p-5 bg-white rounded-lg border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4';
    headerDiv.innerHTML = `
        <div>
            <label for="room-number-or-area" class="block text-sm font-medium text-slate-700">Nomor Kamar / Area</label>
            <div class="mt-1">
                <input type="text" name="room-number-or-area" id="room-number-or-area" class="form-input w-full" value="${data.room_number_or_area || ''}" ${isReadOnly ? 'disabled' : ''}>
            </div>
        </div>
        <!-- BARU: Dropdown untuk PIC (Person in Charge) -->
        <div>
            <label for="inspection-pic-select" class="block text-sm font-medium text-slate-700">PIC (Person in Charge)</label>
            <div class="mt-1">
                <select id="inspection-pic-select" name="pic" class="form-input w-full" ${isReadOnly ? 'disabled' : ''}>
                    <option value="">Memuat pengguna...</option>
                </select>
            </div>
        </div>
    `;
    form.appendChild(headerDiv);

    const checklist = data.checklist || {};
    const categories = Object.keys(checklist);

    if (categories.length === 0) {
        form.innerHTML = `<p class="text-slate-500">Tidak ada item checklist yang ditemukan untuk tipe inspeksi ini.</p>`;
        container.appendChild(form);
        return;
    }

    // Loop melalui setiap kategori
    categories.forEach(categoryName => {
        const categorySection = document.createElement('div');
        categorySection.className = 'p-5 bg-slate-50 rounded-lg border border-slate-200';
        
        const categoryTitle = document.createElement('h4');
        categoryTitle.className = 'text-lg font-semibold text-slate-700 mb-4 pb-2 border-b';
        categoryTitle.textContent = categoryName;
        categorySection.appendChild(categoryTitle);

        const itemsContainer = document.createElement('div');
        itemsContainer.className = 'space-y-5';

        // Loop melalui setiap item dalam kategori
        checklist[categoryName].forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'grid grid-cols-1 md:grid-cols-3 gap-4 items-start';
            itemDiv.dataset.itemId = item.id;

            // FIX: Define disabledAttr here
            const disabledAttr = isReadOnly ? 'disabled' : '';

            // FIX: Define hasPhoto here
            const hasPhoto = item.photo_url;

            // FIX: Define checkPass, checkFail, checkNA here
            const checkPass = item.answer === 'pass' ? 'checked' : '';
            const checkFail = item.answer === 'fail' ? 'checked' : '';
            const checkNA = item.answer === 'na' || !item.answer ? 'checked' : '';

            // Render buttons for photo management
            // const hasPhoto = item.photo_url; // Already defined above

            // Render buttons for photo management
            // Upload/Camera Button (always visible, triggers file input)
            let photoButtonsHtml = `
                <button type="button" id="upload_photo_btn_${item.id}" class="h-9 w-9 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-md flex-shrink-0 transition-colors" title="Ambil/Upload Foto" onclick="document.getElementById('photo_${item.id}').click()" ${disabledAttr}>
                    <i class="fa-solid fa-camera"></i>
                </button>
            `;
            // View Photo Button (conditionally visible, opens modal)
            if (hasPhoto) {
                photoButtonsHtml += `
                <button type="button" id="view_photo_btn_${item.id}" class="h-9 w-9 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-md flex-shrink-0 transition-colors" title="Lihat Foto" onclick="showPhotoModal('${API_BASE_URL}/${item.photo_url}')">
                    <i class="fa-solid fa-image"></i>
                </button>
                `;
            }

            itemDiv.innerHTML = `
                <div class="md:col-span-1">
                    <label class="font-medium text-slate-800">${item.name}</label>
                    ${item.standard ? `<p class="text-xs text-slate-500 mt-1">${item.standard}</p>` : ''}
                </div>
                <div class="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div class="flex items-center gap-4">
                        <div class="flex items-center"><input type="radio" id="pass_${item.id}" name="answer_${item.id}" value="pass" class="form-radio" ${checkPass} ${disabledAttr}><label for="pass_${item.id}" class="ml-2">Pass</label></div>
                        <div class="flex items-center"><input type="radio" id="fail_${item.id}" name="answer_${item.id}" value="fail" class="form-radio" ${checkFail} ${disabledAttr}><label for="fail_${item.id}" class="ml-2">Fail</label></div>
                        <div class="flex items-center"><input type="radio" id="na_${item.id}" name="answer_${item.id}" value="na" class="form-radio" ${checkNA} ${disabledAttr}><label for="na_${item.id}" class="ml-2">N/A</label></div>
                    </div>
                    <div class="flex items-center gap-2">
                        <input type="text" name="remarks_${item.id}" class="form-input text-sm w-full" placeholder="Catatan..." value="${item.remarks || ''}" ${disabledAttr}>
                        <input type="file" id="photo_${item.id}" style="position: absolute; left: -9999px;" accept="image/*" capture="environment" onchange="handlePhotoUpload(event)" ${disabledAttr}>
                        ${photoButtonsHtml}
                    </div>
                    <!-- BARU: Dropdown Prioritas Tugas -->
                    <div class="flex items-center gap-2">
                        <select name="priority_${item.id}" class="form-input text-sm w-full" ${disabledAttr}>
                            <option value="medium" ${item.priority === 'medium' ? 'selected' : ''}>Medium Priority</option>
                            <option value="high" ${item.priority === 'high' ? 'selected' : ''}>High Priority</option>
                            <option value="low" ${item.priority === 'low' ? 'selected' : ''}>Low Priority</option>
                        </select>
                    </div>
                </div>
            `;
            itemsContainer.appendChild(itemDiv);
        });

        categorySection.appendChild(itemsContainer);
        form.appendChild(categorySection);
    });

    // BARU: Hanya tampilkan tombol aksi jika form tidak read-only
    if (!isReadOnly) {
        const actionDiv = document.createElement('div');
        actionDiv.className = 'pt-6 border-t flex justify-end gap-3';
        actionDiv.innerHTML = `
            <button type="button" id="save-draft-btn" class="bg-slate-600 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded-lg">Simpan Draft</button>
            <button type="submit" id="complete-inspection-btn" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg">Selesaikan Inspeksi</button>
        `;
        form.appendChild(actionDiv);

        // BARU: Tambahkan event listener ke form untuk menangani submit
        form.addEventListener('submit', (event) => {
            event.preventDefault(); // Mencegah submit form standar
            handleCompleteInspection(data.id);
        });

        // BARU: Tambahkan event listener untuk tombol "Simpan Draft"
        const saveDraftBtn = form.querySelector('#save-draft-btn');
        if (saveDraftBtn) {
            saveDraftBtn.addEventListener('click', () => handleSaveDraft(data.id));
        }
    }

    container.appendChild(form);

    // BARU: Tambahkan event listener untuk tombol cetak
    const printBtn = document.getElementById('print-inspection-btn');
    if (printBtn) {
        printBtn.onclick = () => handlePrintInspectionToPdf(data);
    }

    // DIPINDAHKAN: Panggil fungsi untuk mengisi dropdown PIC setelah form dirender ke DOM
    (async () => {
        const picSelect = document.getElementById('inspection-pic-select');
        if (!picSelect) return; // Tambahkan penjagaan jika elemen tidak ditemukan
        try {
            // Pastikan data.hotel_id ada sebelum membuat panggilan API
            if (!data.hotel_id) throw new Error("Hotel ID tidak ditemukan dalam data inspeksi.");
            const users = await fetchAPI(`/api/users/assignable?hotelId=${data.hotel_id}&role=engineering`);
            picSelect.innerHTML = '<option value="">-- Pilih PIC --</option>';
            users.forEach(user => {
                picSelect.add(new Option(user.full_name, user.full_name));
            });

            // BARU: Set nilai PIC yang sudah ada jika data tersedia
            if (data.pic_name) {
                picSelect.value = data.pic_name;
            }
        } catch (error) {
            picSelect.innerHTML = '<option value="">Gagal memuat pengguna</option>';
            console.error('Failed to load PIC users:', error);
        }
    })();
}

/**
 * BARU: Mengumpulkan data jawaban dan menyimpannya sebagai draf.
 * @param {string|number} inspectionId - ID inspeksi, atau 'new' jika baru.
 */
async function handleSaveDraft(inspectionId) {
    // BARU: Ambil data dari header form
    const roomNumberOrArea = document.getElementById('room-number-or-area')?.value || '';
    const pic = document.getElementById('inspection-pic-select')?.value || null;

    const saveBtn = document.getElementById('save-draft-btn');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Menyimpan...';

    const answers = [];
    const itemElements = document.querySelectorAll('#dynamic-inspection-form [data-item-id]');
    itemElements.forEach(itemEl => {
        const itemId = itemEl.dataset.itemId;
        const selectedAnswer = itemEl.querySelector(`input[name="answer_${itemId}"]:checked`);
        const remarksInput = itemEl.querySelector(`input[name="remarks_${itemId}"]`);
        answers.push({
            itemId: itemId,
            answer: selectedAnswer ? selectedAnswer.value : 'na',
            remarks: remarksInput ? remarksInput.value : ''
        });
    });

    try {
        if (inspectionId === 'new') {
            // --- KASUS: SIMPAN DRAF PERTAMA KALI ---
            const params = new URLSearchParams(window.location.hash.split('?')[1]);
            const payload = {
                hotelId: params.get('hotelId'),
                typeId: params.get('typeId'),
                inspectorName: document.getElementById('inspector-name')?.value || JSON.parse(localStorage.getItem('user')).full_name,
                roomNumberOrArea: roomNumberOrArea,
                answers: answers
            };
            const result = await fetchAPI('/api/inspections/draft', { method: 'POST', body: JSON.stringify(payload) });
            showToast('Draf berhasil dibuat!', 'success');
            // Ganti URL dengan ID baru agar simpan berikutnya menjadi update
            window.location.hash = `#inspection/form/${result.inspectionId}`;
        } else {
            // --- KASUS: UPDATE DRAF YANG SUDAH ADA ---
            const payload = { 
                answers: answers,
                roomNumberOrArea: roomNumberOrArea,
                pic: pic
            };
            await fetchAPI(`/api/inspections/${inspectionId}/draft`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
            showToast('Draf berhasil diperbarui!', 'success');
        }
    } catch (error) {
        showToast(error.message || 'Gagal menyimpan draf.', 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = 'Simpan Draft';
    }
}

/**
 * BARU: Mengumpulkan data jawaban dan mengirimkannya ke server untuk menyelesaikan inspeksi.
 * @param {string} inspectionId - ID dari inspeksi yang sedang dikerjakan, atau 'new' jika baru.
 */
async function handleCompleteInspection(inspectionId) {
    if (!confirm('Apakah Anda yakin ingin menyelesaikan inspeksi ini? Setelah selesai, data tidak dapat diubah.')) {
        return;
    }

    const completeBtn = document.getElementById('complete-inspection-btn');
    completeBtn.disabled = true;
    completeBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Menyelesaikan...';

    const answers = [];
    const itemElements = document.querySelectorAll('#dynamic-inspection-form [data-item-id]');
    itemElements.forEach(itemEl => {
        const itemId = itemEl.dataset.itemId;
        const selectedAnswer = itemEl.querySelector(`input[name="answer_${itemId}"]:checked`);
        const remarksInput = itemEl.querySelector(`input[name="remarks_${itemId}"]`);
        const prioritySelect = itemEl.querySelector(`select[name="priority_${itemId}"]`);
        answers.push({
            itemId: itemId,
            answer: selectedAnswer ? selectedAnswer.value : 'na',
            remarks: remarksInput ? remarksInput.value : '',
            priority: prioritySelect ? prioritySelect.value : 'medium'
        });
    });

    const picSelect = document.getElementById('inspection-pic-select');
    const picName = picSelect ? picSelect.value : null;
    let currentInspectionId = inspectionId;
    const roomNumberOrArea = document.getElementById('room-number-or-area')?.value || '';

    try {
        // Jika ini adalah inspeksi baru, buat dulu record-nya untuk mendapatkan ID
        if (currentInspectionId === 'new') {
            const params = new URLSearchParams(window.location.hash.split('?')[1]);
            const user = JSON.parse(localStorage.getItem('user'));
            const createPayload = {
                hotelId: params.get('hotelId'),
                typeId: params.get('typeId'),
                inspectorName: user.full_name,
                roomNumberOrArea: roomNumberOrArea,
                answers: [] // Jawaban akan dikirim di step 'complete'
            };
            const result = await fetchAPI('/api/inspections/draft', { method: 'POST', body: JSON.stringify(createPayload) });
            currentInspectionId = result.inspectionId; // Dapatkan ID yang sebenarnya
        }

        // Lanjutkan dengan menyelesaikan inspeksi menggunakan ID yang valid
        await fetchAPI(`/api/inspections/${currentInspectionId}/complete`, {
            method: 'PUT',
            body: JSON.stringify({ answers, pic: picName, roomNumberOrArea: roomNumberOrArea })
        });
        
        showToast('Inspeksi berhasil diselesaikan!', 'success');
        window.location.hash = '#hotel-inspection';

    } catch (error) {
        showToast(error.message || 'Gagal menyelesaikan inspeksi.', 'error');
        completeBtn.disabled = false;
        completeBtn.innerHTML = 'Selesaikan Inspeksi';
    }
}

/**
 * BARU: Menangani proses upload foto saat file dipilih.
 * @param {Event} event - Event dari input file.
 */
async function handlePhotoUpload(event) {
    const input = event.target;
    const file = input.files[0];
    if (!file) return;

    const itemId = input.id.split('_')[1];
    const inspectionId = window.location.hash.split('/')[2];

    const uploadPhotoBtn = document.getElementById(`upload_photo_btn_${itemId}`);
    let viewPhotoBtn = document.getElementById(`view_photo_btn_${itemId}`);

    console.log('handlePhotoUpload: uploadPhotoBtn exists:', !!uploadPhotoBtn);
    console.log('handlePhotoUpload: viewPhotoBtn exists before creation:', !!viewPhotoBtn);

    // Disable upload button and show spinner on it
    if (uploadPhotoBtn) {
        uploadPhotoBtn.disabled = true;
        uploadPhotoBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>';
    }

    // If viewPhotoBtn exists, disable it and show spinner
    if (viewPhotoBtn) {
        viewPhotoBtn.disabled = true;
        viewPhotoBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>';
    }

    const formData = new FormData();
    formData.append('photo', file);
    formData.append('inspectionId', inspectionId);
    formData.append('itemId', itemId);

    try {
        const result = await fetchAPI('/api/inspections/upload-photo', {
            method: 'POST',
            body: formData
        });

        console.log('Uploaded photo URL:', `${API_BASE_URL}/${result.imageUrl}`); // Keep the console log
        showToast('Foto berhasil diupload!', 'success');

        // Restore upload button
        if (uploadPhotoBtn) {
            uploadPhotoBtn.innerHTML = '<i class="fa-solid fa-camera"></i>';
        }

        // Create or update the View Photo Button
        if (!viewPhotoBtn) {
            // If it didn't exist, create and append it
            viewPhotoBtn = document.createElement('button');
            viewPhotoBtn.id = `view_photo_btn_${itemId}`;
            viewPhotoBtn.type = 'button';
            // Insert it after the uploadPhotoBtn
            if (uploadPhotoBtn && uploadPhotoBtn.parentNode) {
                uploadPhotoBtn.parentNode.insertBefore(viewPhotoBtn, uploadPhotoBtn.nextSibling);
            }
        }
        // Update its properties
        viewPhotoBtn.className = 'h-9 w-9 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-md flex-shrink-0 transition-colors';
        viewPhotoBtn.title = 'Lihat Foto';
        viewPhotoBtn.innerHTML = '<i class="fa-solid fa-image"></i>';
        viewPhotoBtn.disabled = false;
        viewPhotoBtn.setAttribute('onclick', `showPhotoModal('${API_BASE_URL}/${result.imageUrl}')`);

    } catch (error) {
        showToast(error.message || 'Gagal mengupload foto.', 'error');
        // Restore buttons to original state on error
        if (uploadPhotoBtn) {
            uploadPhotoBtn.innerHTML = '<i class="fa-solid fa-camera"></i>';
        }
        if (viewPhotoBtn && !viewPhotoBtn.getAttribute('onclick')) { // If it was a newly created, empty button
            viewPhotoBtn.remove(); // Remove it if it was temporary and failed
        } else if (viewPhotoBtn) {
            viewPhotoBtn.innerHTML = '<i class="fa-solid fa-image"></i>'; // Restore image icon if it had one
            viewPhotoBtn.disabled = false;
        }

    } finally {
        if (uploadPhotoBtn) {
            uploadPhotoBtn.disabled = false;
        }
        input.value = ''; // Reset input file
    }
}



/**
 * Menampilkan notifikasi toast.
 * @param {string} message - Pesan yang akan ditampilkan.
 * @param {string} type - Tipe toast ('success', 'error', 'info').
 */
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        info: 'fa-info-circle'
    };
    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-blue-500'
    };

    toast.className = `toast ${colors[type]}`;
    toast.innerHTML = `<i class="fa-solid ${icons[type]}"></i><span>${message}</span>`;

    toastContainer.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}
/**
 * Initializes the Inspection Dashboard page.
 * This function is called when the Inspection Dashboard page is loaded.
 */
 // Fungsi initInspectionDashboard() dan loadInspectionDashboardData() beserta chart-nya
 // telah dipindahkan ke file dashboard.js agar lebih terpusat.
 /**
 * Initializes the Hotel Inspection page.
 * This function is called when the Hotel Inspection page is loaded.
 */
function initHotelInspectionPage() {
    // Panggil kedua fungsi untuk mengisi dropdown
    populateHotelDropdown('start-inspection-hotel-select'); // Mengisi hotel di modal "Mulai Inspeksi"
    populateInspectionTypeDropdown('start-inspection-template-select');  // Mengisi tipe inspeksi di modal "Mulai Inspeksi"

    // BARU: Isi dropdown filter di halaman riwayat
    populateHotelDropdown('history-filter-hotel', true); // Tambahkan opsi "Semua Hotel"
    populateInspectionTypeDropdown('history-filter-type', true); // Tambahkan opsi "Semua Tipe"

    // BARU: Tambahkan event listener untuk tombol filter
    document.getElementById('history-filter-apply-btn')?.addEventListener('click', () => loadInspectionHistory(1)); // Selalu muat dari halaman 1 saat filter
    document.getElementById('history-filter-reset-btn')?.addEventListener('click', resetInspectionFilters);
    document.getElementById('history-export-excel-btn')?.addEventListener('click', exportInspectionHistoryToExcel);

    const form = document.getElementById('start-inspection-form');
    if (form) {
        form.addEventListener('submit', handleStartInspection);
    }

    // Panggil reset filter untuk memastikan tampilan default yang bersih dan memuat data awal
    resetInspectionFilters();
}

/**
 * BARU: Mengekspor data riwayat inspeksi yang sudah difilter ke file Excel.
 */
async function exportInspectionHistoryToExcel() {
    const exportBtn = document.getElementById('history-export-excel-btn');
    if (!exportBtn) return;

    exportBtn.disabled = true;
    exportBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-2"></i>Mengekspor...';
    showToast('Mempersiapkan data untuk ekspor...', 'info');

    // Ambil parameter filter yang sama dengan loadInspectionHistory
    const params = new URLSearchParams();
    const hotelId = document.getElementById('history-filter-hotel').value;
    const typeId = document.getElementById('history-filter-type').value;
    const area = document.getElementById('history-filter-area').value;
    const pic = document.getElementById('history-filter-pic').value;
    const status = document.getElementById('history-filter-status').value;
    const startDate = document.getElementById('history-filter-start-date').value;
    const endDate = document.getElementById('history-filter-end-date').value;

    if (hotelId && hotelId !== 'all') params.append('hotelId', hotelId);
    if (typeId && typeId !== 'all') params.append('typeId', typeId);
    if (area) params.append('area', area);
    if (pic) params.append('pic', pic);
    if (status && status !== 'all') params.append('status', status);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    try {
        const history = await fetchAPI(`/api/inspections?${params.toString()}`);

        // Format data untuk SheetJS
        const dataForSheet = history.map(item => ({
            'Tanggal Inspeksi': new Date(item.inspection_date).toLocaleDateString('id-ID'),
            'Nama Hotel': item.hotel_name,
            'Tipe Inspeksi': item.inspection_type_name,
            'Area/Kamar': item.room_number_or_area || '-',
            'PIC': item.pic_name || '-',
            'Skor': item.score !== null ? `${item.score}/100` : '-',
            'Status': item.status,
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataForSheet);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Riwayat Inspeksi');
        XLSX.writeFile(workbook, `Riwayat_Inspeksi_${new Date().toISOString().split('T')[0]}.xlsx`);

        showToast('Data berhasil diekspor!', 'success');
    } catch (error) {
        showToast(`Gagal mengekspor data: ${error.message}`, 'error');
    } finally {
        exportBtn.disabled = false;
        exportBtn.innerHTML = '<i class="fa-solid fa-file-excel mr-2"></i>Export Excel';
    }
}

/**
 * BARU: Mereset semua filter di halaman riwayat inspeksi dan memuat ulang data.
 */
function resetInspectionFilters() {
    document.getElementById('history-filter-hotel').value = '';
    document.getElementById('history-filter-type').value = '';
    document.getElementById('history-filter-area').value = '';
    document.getElementById('history-filter-pic').value = '';
    document.getElementById('history-filter-status').value = 'all';
    document.getElementById('history-filter-start-date').value = ''; // Reset filter
    document.getElementById('history-filter-end-date').value = '';
    loadInspectionHistory();
}

/**
 * BARU: Membuka modal untuk memulai inspeksi baru dan mengisi nama inspektor.
 */
function openStartInspectionModal() {
    const modal = document.getElementById('start-inspection-modal');
    if (modal) {
        // Ambil data pengguna dari localStorage
        const user = JSON.parse(localStorage.getItem('user'));
        
        // Temukan input nama inspektor dan isi nilainya
        const inspectorNameInput = document.getElementById('inspector-name');
        if (user && inspectorNameInput) {
            inspectorNameInput.value = user.full_name || '';
        }
        
        // Tampilkan modal
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

/**
 * BARU: Menutup modal untuk memulai inspeksi baru.
 */
function closeStartInspectionModal() {
    const modal = document.getElementById('start-inspection-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

/**
 * Handles the submission of the "Start Inspection" form.
 * @param {Event} event The form submission event.
 */
async function handleStartInspection(event) {
    event.preventDefault();
    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const formData = new FormData(form);
    const payload = {
        hotelId: formData.get('hotelId'),
        // Ambil ID tipe inspeksi dari dropdown template yang sebenarnya
        typeId: formData.get('template'), // Pastikan value di HTML adalah ID
        inspectorName: formData.get('inspectorName')
    };
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Mempersiapkan...';

    try {
        // Panggil API untuk membuat draf inspeksi dan mendapatkan ID
        const result = await fetchAPI('/api/inspections/draft', { method: 'POST', body: JSON.stringify(payload) });
        showToast("Mengarahkan ke formulir inspeksi...", "info");
        closeStartInspectionModal();
        // Arahkan ke halaman form dengan ID yang valid
        window.location.hash = `#inspection/form/${result.inspectionId}`;
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-play mr-2"></i>Mulai Inspeksi';
    }
}

/**
 * BARU: Memuat dan menampilkan riwayat inspeksi dari API.
 */
async function loadInspectionHistory(page = 1) {
    const tableBody = document.getElementById('inspection-history-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = `<tr><td colspan="8" class="text-center p-8 text-slate-500"><i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Memuat riwayat inspeksi...</td></tr>`;
    
    const params = new URLSearchParams({ page });
    const hotelId = document.getElementById('history-filter-hotel').value;
    const typeId = document.getElementById('history-filter-type').value;
    const area = document.getElementById('history-filter-area').value;
    const pic = document.getElementById('history-filter-pic').value;
    const status = document.getElementById('history-filter-status').value;
    const startDate = document.getElementById('history-filter-start-date').value;
    const endDate = document.getElementById('history-filter-end-date').value;

    if (hotelId && hotelId !== 'all') params.append('hotelId', hotelId);
    if (typeId && typeId !== 'all') params.append('typeId', typeId);
    if (area) params.append('area', area);
    if (pic) params.append('pic', pic);
    if (status && status !== 'all') params.append('status', status);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    try {
        const response = await fetchAPI(`/api/inspections?${params.toString()}`);
        const { data: history, totalItems, totalPages, currentPage } = response;

        if (history.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="8" class="text-center p-8 text-slate-500">Belum ada riwayat inspeksi.</td></tr>`;
            renderPaginationControls(0, 0, 0, 0); // Kosongkan paginasi
            return;
        }

        tableBody.innerHTML = ''; // Kosongkan tabel sebelum mengisi
        history.forEach(item => {
            const tr = document.createElement('tr');
            tr.className = 'bg-white border-b hover:bg-slate-50';

            const formattedDate = new Date(item.inspection_date).toLocaleDateString('id-ID', {
                day: '2-digit', month: 'short', year: 'numeric'
            });

            // Helper untuk status
            const getStatusBadge = (status) => {
                switch (status) {
                    case 'completed':
                        return `<span class="bg-green-100 text-green-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded-full">Selesai</span>`;
                    case 'in_progress':
                        return `<span class="bg-blue-100 text-blue-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded-full">Berlangsung</span>`;
                    case 'pending_review':
                        return `<span class="bg-yellow-100 text-yellow-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded-full">Review</span>`;
                    default:
                        return `<span class="bg-slate-100 text-slate-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded-full">${status}</span>`;
                }
            };

            // Helper untuk skor
            const getScoreDisplay = (score) => {
                if (score === null || score === undefined) return '-';
                let colorClass = 'text-slate-600';
                if (score >= 90) colorClass = 'text-green-600';
                else if (score >= 75) colorClass = 'text-orange-600';
                else colorClass = 'text-red-600';
                return `<span class="font-semibold ${colorClass}">${score}/100</span>`;
            };

            tr.innerHTML = `
                <td class="px-6 py-4">${formattedDate}</td>
                <td class="px-6 py-4 font-medium text-slate-800">${item.hotel_name}</td>
                <td class="px-6 py-4">${item.inspection_type_name}</td>
                <td class="px-6 py-4">${item.room_number_or_area || '-'}</td>
                <td class="px-6 py-4">${item.pic_name || '-'}</td>
                <td class="px-6 py-4">${getScoreDisplay(item.score)}</td>
                <td class="px-6 py-4">${getStatusBadge(item.status)}</td>
                <td class="px-6 py-4 text-center">
                    <div class="flex justify-center items-center gap-2">
                        ${item.status === 'in_progress' ?
                        `<!-- Tombol Lanjutkan (Update) -->
                        <button onclick="window.location.hash='#inspection/form/${item.id}'" class="w-8 h-8 flex items-center justify-center text-slate-500 bg-slate-100 hover:bg-blue-100 hover:text-blue-600 rounded-full transition-colors" title="Lanjutkan Inspeksi">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" /></svg>
                        </button>
                        <!-- Tombol Hapus untuk Draf -->
                        <button onclick="handleDeleteInProgressInspection(${item.id})" class="w-8 h-8 flex items-center justify-center text-slate-500 bg-slate-100 hover:bg-red-100 hover:text-red-600 rounded-full transition-colors" title="Hapus Draf Inspeksi">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                            </svg>
                        </button>
                        ` :
                        `<!-- Tombol Lihat Detail (Read) -->
                        <button onclick="window.location.hash='#inspection/form/${item.id}'" class="w-8 h-8 flex items-center justify-center text-slate-500 bg-slate-100 hover:bg-slate-200 hover:text-slate-600 rounded-full transition-colors" title="Lihat Detail">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" /></svg>
                        </button>
                        `}
                        <!-- Tombol Hapus (Delete) -->
                        <button onclick="handleDeleteInspection(${item.id}, '${item.hotel_name}', '${item.inspection_type_name}')" class="w-8 h-8 flex items-center justify-center text-slate-500 bg-slate-100 hover:bg-red-100 hover:text-red-600 rounded-full transition-colors ${item.status === 'in_progress' ? 'hidden' : ''}" title="Hapus Inspeksi">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(tr);
        });

        // Render kontrol paginasi
        renderPaginationControls(totalItems, totalPages, currentPage, 10);

    } catch (error) {
        tableBody.innerHTML = `<tr><td colspan="8" class="text-center p-8 text-red-500">Gagal memuat riwayat: ${error.message}</td></tr>`;
        renderPaginationControls(0, 0, 0, 0); // Kosongkan paginasi saat error
        showToast(error.message, 'error');
    }
}

/**
 * BARU: Menangani penghapusan inspeksi yang sedang berlangsung (in_progress).
 * @param {number} inspectionId - ID inspeksi yang akan dihapus.
 */
async function handleDeleteInProgressInspection(inspectionId) {
    const confirmationMessage = `Apakah Anda yakin ingin membatalkan dan menghapus draf inspeksi ini?`;
    
    if (confirm(confirmationMessage)) {
        try {
            await fetchAPI(`/api/inspections/${inspectionId}`, {
                method: 'DELETE'
            });

            showToast('Draf inspeksi berhasil dihapus.', 'success');
            // Arahkan kembali ke halaman riwayat
            window.location.hash = '#hotel-inspection';
        } catch (error) {
            showToast(error.message || 'Gagal menghapus draf inspeksi.', 'error');
        }
    }
}


/**
 * BARU: Merender kontrol paginasi di bawah tabel.
 * @param {number} totalItems - Jumlah total item.
 * @param {number} totalPages - Jumlah total halaman.
 * @param {number} currentPage - Halaman saat ini.
 * @param {number} limit - Item per halaman.
 */
function renderPaginationControls(totalItems, totalPages, currentPage, limit) {
    const infoContainer = document.getElementById('inspection-pagination-info');
    const controlsContainer = document.getElementById('inspection-pagination-controls');

    if (!infoContainer || !controlsContainer || totalPages <= 0) {
        if(infoContainer) infoContainer.innerHTML = '';
        if(controlsContainer) controlsContainer.innerHTML = '';
        return;
    }

    // Tampilkan info "Showing X to Y of Z results"
    const startItem = (currentPage - 1) * limit + 1;
    const endItem = Math.min(currentPage * limit, totalItems);
    infoContainer.innerHTML = `
        <p class="text-sm text-gray-700">
            Menampilkan <span class="font-medium">${startItem}</span> - <span class="font-medium">${endItem}</span> dari <span class="font-medium">${totalItems}</span> hasil
        </p>
    `;

    // Buat tombol-tombol
    let controlsHTML = '<nav class="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">';

    // Tombol "Previous"
    const prevDisabled = currentPage === 1 ? 'disabled' : '';
    controlsHTML += `<button onclick="loadInspectionHistory(${currentPage - 1})" ${prevDisabled} class="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed">
        <span class="sr-only">Previous</span><i class="fa-solid fa-chevron-left h-5 w-5"></i>
    </button>`;

    // Tombol Halaman (logika sederhana untuk saat ini)
    for (let i = 1; i <= totalPages; i++) {
        const isCurrent = i === currentPage ? 'bg-blue-600 text-white focus-visible:outline-blue-600' : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50';
        controlsHTML += `<button onclick="loadInspectionHistory(${i})" class="relative inline-flex items-center px-4 py-2 text-sm font-semibold ${isCurrent} focus:z-20 focus:outline-offset-0">${i}</button>`;
    }

    // Tombol "Next"
    const nextDisabled = currentPage === totalPages ? 'disabled' : '';
    controlsHTML += `<button onclick="loadInspectionHistory(${currentPage + 1})" ${nextDisabled} class="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed">
        <span class="sr-only">Next</span><i class="fa-solid fa-chevron-right h-5 w-5"></i>
    </button>`;

    controlsHTML += '</nav>';
    controlsContainer.innerHTML = controlsHTML;
}

/**
 * BARU: Menangani penghapusan data inspeksi.
 * @param {number} inspectionId - ID dari inspeksi yang akan dihapus.
 * @param {string} hotelName - Nama hotel untuk pesan konfirmasi.
 * @param {string} typeName - Nama tipe inspeksi untuk pesan konfirmasi.
 */
async function handleDeleteInspection(inspectionId, hotelName, typeName) { // Tambahkan parameter typeName
    const confirmationMessage = `Apakah Anda yakin ingin menghapus riwayat inspeksi "${typeName}" untuk hotel "${hotelName}"? Aksi ini tidak dapat dibatalkan.`;
    
    if (confirm(confirmationMessage)) {
        try {
            // Kirim permintaan DELETE ke backend
            await fetchAPI(`/api/inspections/${inspectionId}`, {
                method: 'DELETE'
            });

            showToast('Riwayat inspeksi berhasil dihapus.', 'success');
            // Muat ulang data dari halaman saat ini untuk memperbarui tampilan dan paginasi
            loadInspectionHistory(); 
        } catch (error) {
            showToast(error.message || 'Gagal menghapus riwayat inspeksi.', 'error');
        }
    }
}

/**
 * BARU: Menampilkan detail tugas dalam sebuah modal.
 * @param {number} taskId - ID dari tugas yang akan ditampilkan.
 */
async function showTaskDetail(taskId) {
    showTaskDetailModal();
    const contentDiv = document.getElementById('task-detail-content');
    const assignedToSelect = document.getElementById('task-detail-assigned-to');
    const updateBtn = document.getElementById('task-detail-update-btn');
    updateBtn.onclick = null; // Hapus listener lama

    contentDiv.innerHTML = `
        <div class="text-center p-8">
            <i class="fa-solid fa-circle-notch fa-spin text-2xl text-blue-500"></i>
            <p class="mt-2 text-slate-500">Memuat detail tugas...</p>
        </div>`;
    assignedToSelect.innerHTML = '<option>Memuat pengguna...</option>';

    try {
        const task = await fetchAPI(`/api/tasks/${taskId}`);

        const priorityStyles = {
            high: { bg: 'bg-red-100', text: 'text-red-800', label: 'High' },
            medium: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Medium' },
            low: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Low' },
        };
        const currentPriority = priorityStyles[task.priority] || priorityStyles.low;

        contentDiv.innerHTML = `
            <div class="space-y-4">
                <div>
                    <h4 class="text-lg font-bold text-slate-800">${task.description}</h4>
                    <p class="text-sm text-slate-500">Untuk: <strong>${task.hotel_name}</strong></p>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div class="bg-slate-50 p-3 rounded-md">
                        <p class="font-semibold text-slate-600">Sumber Temuan</p>
                        <p>Inspeksi: <a href="#inspection/form/${task.inspection_id}" class="text-blue-600 hover:underline">${task.inspection_type_name}</a></p>
                        <p>Tanggal: ${new Date(task.inspection_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                        <p>Inspektor: ${task.inspector_name}</p>
                    </div>
                    <div class="bg-slate-50 p-3 rounded-md">
                        <p class="font-semibold text-slate-600">Detail Tugas</p>
                        <p>Prioritas: <span class="${currentPriority.bg} ${currentPriority.text} text-xs font-medium px-2 py-0.5 rounded-full">${currentPriority.label}</span></p>
                        <p>Batas Waktu: ${task.due_date ? new Date(task.due_date).toLocaleDateString('id-ID') : 'Belum ditentukan'}</p>
                        <p>Ditugaskan ke: ${task.assigned_to || 'Belum ada'}</p>
                    </div>
                </div>
                <div>
                    <p class="font-semibold text-slate-600">Item Checklist Terkait</p>
                    <p class="italic">"${task.item_name}"</p>
                    ${task.item_standard ? `<p class="text-xs text-slate-500 mt-1">Standar: ${task.item_standard}</p>` : ''}
                </div>
                ${task.notes ? `
                <div>
                    <p class="font-semibold text-slate-600">Catatan dari Inspektor</p>
                    <p class="text-slate-700 bg-yellow-50 border border-yellow-200 p-3 rounded-md">${task.notes}</p>
                </div>` : ''}
                ${task.completion_photo_url ? `
                <div>
                    <p class="font-semibold text-slate-600">Foto Bukti Penyelesaian</p>
                    <div class="mt-2">
                        <img src="${API_BASE_URL}/${task.completion_photo_url}" alt="Foto Bukti" class="max-w-xs rounded-lg cursor-pointer border hover:border-blue-500 transition" onclick="showPhotoModal('${API_BASE_URL}/${task.completion_photo_url}')">
                    </div>
                </div>` : ''}
            </div>
        `;

        // BARU: Isi dropdown "Ditugaskan kepada"
        const assignableUsers = await fetchAPI(`/api/users/assignable?hotelId=${task.hotel_id}`);
        assignedToSelect.innerHTML = '<option value="">-- Belum Ditugaskan --</option>';
        assignableUsers.forEach(user => {
            const option = new Option(user.full_name, user.full_name); // Simpan nama lengkap sebagai value
            assignedToSelect.appendChild(option);
        });

        // BARU: Set nilai-nilai form di modal
        document.getElementById('task-detail-due-date').value = task.due_date ? task.due_date.split('T')[0] : '';
        assignedToSelect.value = task.assigned_to || '';

        // Set status dropdown dan tambahkan event listener untuk tombol update
        document.getElementById('task-detail-status-select').value = task.status;
        
        // BARU: Tambahkan listener ke dropdown status untuk menampilkan/menyembunyikan opsi foto
        const statusSelect = document.getElementById('task-detail-status-select');
        const photoSection = document.getElementById('task-completion-photo-section');
        
        const togglePhotoSection = () => {
            photoSection.classList.toggle('hidden', statusSelect.value !== 'completed');
        };
        
        statusSelect.addEventListener('change', togglePhotoSection);
        togglePhotoSection(); // Panggil sekali saat modal dibuka

        updateBtn.onclick = () => handleUpdateTask(taskId);

        document.getElementById('task-completion-photo-input').addEventListener('change', (e) => { document.getElementById('task-completion-photo-filename').textContent = e.target.files[0]?.name || 'Tidak ada file dipilih'; });

    } catch (error) {
        contentDiv.innerHTML = `<div class="text-center p-8 text-red-500">${error.message}</div>`;
        showToast(error.message, 'error');
    }
}

/**
 * BARU: Menangani pembaruan tugas (status, due date, assigned to).
 * @param {number} taskId - ID dari tugas yang akan diupdate.
 */
async function handleUpdateTask(taskId) {
    const statusSelect = document.getElementById('task-detail-status-select');
    const updateBtn = document.getElementById('task-detail-update-btn');
    const photoInput = document.getElementById('task-completion-photo-input');
    const dueDateInput = document.getElementById('task-detail-due-date');
    const assignedToSelect = document.getElementById('task-detail-assigned-to');

    const newStatus = statusSelect.value;

    updateBtn.disabled = true;
    updateBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Updating...';

    try {
        const payload = new FormData();
        payload.append('status', newStatus);
        payload.append('dueDate', dueDateInput.value);
        payload.append('assignedTo', assignedToSelect.value);

        const file = photoInput.files[0];
        if (newStatus === 'completed' && file) {
            const compressedFile = await compressImage(file);
            payload.append('completion_photo', compressedFile);
        }

        // fetchAPI akan secara otomatis mengatur header yang benar untuk FormData
        await fetchAPI(`/api/tasks/${taskId}`, {
            method: 'PUT',
            body: payload
        });

        showToast('Status tugas berhasil diperbarui!', 'success');
        closeTaskDetailModal();
        loadTasks(); // Muat ulang daftar tugas untuk melihat perubahan
    } catch (error) {
        showToast(error.message || 'Gagal memperbarui status.', 'error');
    } finally {
        updateBtn.disabled = false;
        updateBtn.innerHTML = 'Update Status';
    }
}


// =================================================================================
// INSPECTION SETTINGS JAVASCRIPT
// =================================================================================

function initTaskToDoPage() {
    console.log("Task To-Do page initialized.");

    // Populate filter dropdowns
    populateHotelDropdown('task-hotel-filter', true); // Allow "All Hotels"

    // Add event listeners to filters to auto-reload on change
    document.getElementById('task-hotel-filter')?.addEventListener('change', loadTasks);
    document.getElementById('task-status-filter')?.addEventListener('change', loadTasks);
    document.getElementById('task-priority-filter')?.addEventListener('change', loadTasks);

    // Add event listener for the reset button
    document.getElementById('clear-task-filters-btn')?.addEventListener('click', () => {
        document.getElementById('task-hotel-filter').value = 'all'; // Use 'all' as the default for a "select all" option
        document.getElementById('task-priority-filter').value = 'all';
        document.getElementById('task-status-filter').value = 'pending'; // Reset to default 'pending'
        loadTasks();
    });

    loadTasks(); // Initial load
}

async function loadTasks() {
    const tableBody = document.getElementById('task-list-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = `<tr><td colspan="8" class="text-center p-8 text-slate-500"><i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Memuat daftar tugas...</td></tr>`;

    // Build query params from filters
    const params = new URLSearchParams();
    const hotelId = document.getElementById('task-hotel-filter')?.value;
    const status = document.getElementById('task-status-filter')?.value;
    const priority = document.getElementById('task-priority-filter')?.value;

    if (hotelId && hotelId !== 'all') params.append('hotelId', hotelId);
    if (priority && priority !== 'all') params.append('priority', priority);
    if (status && status !== 'all') params.append('status', status);

    try {
        const tasks = await fetchAPI(`/api/tasks?${params.toString()}`);

        if (tasks.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="8" class="text-center p-8 text-slate-500">Tidak ada tugas yang ditemukan.</td></tr>`;
            return;
        }

        tableBody.innerHTML = ''; // Clear before populating
        tasks.forEach(task => {
            const tr = document.createElement('tr');
            tr.className = 'bg-white border-b hover:bg-slate-50';

            const formattedDate = task.created_at ? new Date(task.created_at).toLocaleDateString('id-ID', {
                day: '2-digit', month: 'short', year: 'numeric'
            }) : '-';
            
            const priorityStyles = {
                high: { bg: 'bg-red-100', text: 'text-red-800', label: 'High' },
                medium: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Medium' },
                low: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Low' },
            };
            const currentPriority = priorityStyles[task.priority] || priorityStyles.low;

            const statusStyles = {
                'pending': { bg: 'bg-slate-100', text: 'text-slate-800', label: 'Pending' },
                'in_progress': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'In Progress' },
                'completed': { bg: 'bg-green-100', text: 'text-green-800', label: 'Completed' },
                'cancelled': { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Cancelled' },
            };
            const currentStatus = statusStyles[task.status] || statusStyles['pending'];

            tr.innerHTML = `
                <td class="px-6 py-4">${formattedDate}</td>
                <td class="px-6 py-4 font-medium text-slate-800">${task.hotel_name}</td>
                <td class="px-6 py-4 text-slate-600">${task.room_number_or_area || '-'}</td>
                <td class="px-6 py-4">
                    <p class="font-medium text-slate-800">${task.description}</p>
                    <p class="text-xs text-slate-500 mt-1">Item: ${task.item_name}</p>
                </td>
                <td class="px-6 py-4 text-center"><span class="${currentPriority.bg} ${currentPriority.text} text-xs font-medium px-2 py-0.5 rounded-full">${currentPriority.label}</span></td>
                <td class="px-6 py-4">${task.assigned_to || '-'}</td>
                <td class="px-6 py-4 text-center"><span class="${currentStatus.bg} ${currentStatus.text} text-xs font-medium px-2.5 py-0.5 rounded-full">${currentStatus.label}</span></td>
                <td class="px-6 py-4 text-center">
                    <div class="flex justify-center items-center gap-2">
                        <button onclick="showTaskDetail(${task.id})" class="w-8 h-8 flex items-center justify-center text-slate-500 bg-slate-100 hover:bg-blue-100 hover:text-blue-600 rounded-full transition-colors" title="Lihat Detail & Edit Tugas">
                            <i class="fa-solid fa-pencil-alt"></i>
                        </button>
                        ${task.completion_photo_url ? `
                        <button onclick="showPhotoModal('${API_BASE_URL}/${task.completion_photo_url}')" class="w-8 h-8 flex items-center justify-center text-slate-500 bg-slate-100 hover:bg-green-100 hover:text-green-600 rounded-full transition-colors" title="Lihat Foto Bukti">
                            <i class="fa-solid fa-camera-retro"></i>
                        </button>
                        ` : ''}
                    </div>
                </td>
            `;
            tableBody.appendChild(tr);
        });

    } catch (error) {
        tableBody.innerHTML = `<tr><td colspan="8" class="text-center p-8 text-red-500">Gagal memuat tugas: ${error.message}</td></tr>`;
        showToast(error.message, 'error');
    }
}

let activeInspectionTypeId = null;

/**
 * Inisialisasi halaman Kelola Tipe Inspeksi.
 */
function initInspectionTypesManagementPage() {
    console.log("Inspection Types Management page initialized.");
    
    // Tambah event listener ke tombol "Baru"
    const newTypeBtn = document.querySelector('#inspection-types-management-section .flex.justify-between.items-center.mb-3 button');
    if (newTypeBtn) {
        newTypeBtn.addEventListener('click', openAddInspectionTypeModal);
    }

    // Tambah event listener ke form tipe
    const typeForm = document.getElementById('add-inspection-type-form');
    if (typeForm) {
        typeForm.addEventListener('submit', handleSaveInspectionType);
    }

    // BARU: Tambah event listener ke form item
    const itemForm = document.getElementById('add-inspection-item-form');
    if (itemForm) {
        itemForm.addEventListener('submit', handleSaveInspectionItem);
    }

    // BARU: Tambah event listener ke form edit item
    const editItemForm = document.getElementById('edit-inspection-item-form');
    if (editItemForm) {
        // Hapus listener lama jika ada, lalu tambahkan yang baru
        editItemForm.replaceWith(editItemForm.cloneNode(true));
        document.getElementById('edit-inspection-item-form').addEventListener('submit', handleUpdateInspectionItem);
    }
    // Muat daftar tipe inspeksi yang ada
    loadInspectionTypes();
}

/**
 * Membuka modal untuk menambah tipe inspeksi baru.
 */
function openAddInspectionTypeModal() {
    const modal = document.getElementById('add-inspection-type-modal');
    if (modal) {
        document.getElementById('add-inspection-type-form').reset();
        document.getElementById('add-inspection-type-error').classList.add('hidden');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

/**
 * Menutup modal tambah tipe inspeksi.
 */
function closeAddInspectionTypeModal() {
    const modal = document.getElementById('add-inspection-type-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

/**
 * BARU: Membuka modal untuk menambah item checklist baru.
 */
function openAddInspectionItemModal() {
    if (!activeInspectionTypeId) {
        alert('Pilih tipe inspeksi terlebih dahulu.');
        return;
    }
    const modal = document.getElementById('add-inspection-item-modal');
    if (modal) {
        document.getElementById('add-inspection-item-form').reset();
        document.getElementById('item-inspection-type-id').value = activeInspectionTypeId;
        document.getElementById('add-inspection-item-error').classList.add('hidden');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

/**
 * BARU: Menutup modal tambah item checklist.
 */
function closeAddInspectionItemModal() {
    document.getElementById('add-inspection-item-modal')?.classList.add('hidden');
}

/**
 * Memuat daftar tipe inspeksi dari API dan menampilkannya.
 */
async function loadInspectionTypes() {
    const listContainer = document.getElementById('inspection-type-list');
    if (!listContainer) return;

    listContainer.innerHTML = `<li><p class="p-3 text-slate-500"><i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Memuat tipe...</p></li>`;

    try {
        const response = await fetch(`${API_BASE_URL}/api/inspections/types`, { headers: getAuthHeaders() });
        if (!response.ok) throw new Error('Gagal memuat tipe inspeksi.');
        
        const types = await response.json();
        renderInspectionTypeList(types);
    } catch (error) {
        console.error("Error loading inspection types:", error);
        listContainer.innerHTML = `<li><p class="p-3 text-red-500">${error.message}</p></li>`;
    }
}

/**
 * Merender daftar tipe inspeksi ke dalam UI.
 * @param {Array<Object>} types - Array objek tipe inspeksi.
 */
function renderInspectionTypeList(types) {
    const listContainer = document.getElementById('inspection-type-list');
    listContainer.innerHTML = '';

    if (!Array.isArray(types)) { // Defensive check
        console.error("renderInspectionTypeList received non-array data:", types);
        listContainer.innerHTML = `<li><p class="p-3 text-red-500">Error: Data tipe inspeksi tidak valid.</p></li>`;
        return;
    }

    if (types.length === 0) { 
        listContainer.innerHTML = `<li><p class="p-3 text-slate-500 text-sm">Belum ada tipe inspeksi.</p></li>`;
        return;
    }

    types.forEach((type, index) => {        const li = document.createElement('li');
        const isActive = type.id === activeInspectionTypeId;
        li.innerHTML = `
            <div class="flex items-center group">
                <a href="#" data-type-id="${type.id}" data-type-name="${type.name}" class="inspection-type-link block p-3 rounded-lg flex-grow ${isActive ? 'bg-blue-100 border border-blue-200 text-blue-800 font-semibold' : 'hover:bg-slate-100 border border-transparent'}">
                    <div class="flex justify-between items-center" data-editable-type-id="${type.id}">
                        <span class="editable-name">${type.name}</span>
                        <span class="text-xs font-normal ${isActive ? 'bg-blue-200 text-blue-800' : 'text-slate-500'} px-2 py-0.5 rounded-full">${type.item_count || 0} Item</span>
                    </div>
                </a>
                <div class="flex justify-between items-center">
                    <button data-type-id="${type.id}" data-type-name="${type.name}" class="delete-inspection-type-btn text-slate-400 hover:text-red-500 w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100" title="Hapus ${type.name}"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            </div>
        `;
        listContainer.appendChild(li);
    });

    // Tambahkan event listener ke link tipe
    document.querySelectorAll('.inspection-type-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const typeId = e.currentTarget.dataset.typeId;
            const typeName = e.currentTarget.dataset.typeName;
            selectInspectionType(typeId, typeName);
        });
    });

    // BARU: Tambahkan event listener ke tombol hapus tipe
    document.querySelectorAll('.delete-inspection-type-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const typeId = e.currentTarget.dataset.typeId;
            const typeName = e.currentTarget.dataset.typeName;
            handleDeleteInspectionType(typeId, typeName);
        });
    });

    // BARU: Tambahkan event listener untuk membuat nama tipe bisa diedit
    document.querySelectorAll('[data-editable-type-id]').forEach(div => {
        div.addEventListener('click', (e) => {
            if (e.target.classList.contains('editable-name')) {
                makeEditable(e.target, 'type');
            }
        });
    });


    // Jika belum ada yang aktif, pilih yang pertama secara otomatis
    if (!activeInspectionTypeId && types.length > 0) {
        selectInspectionType(types[0].id, types[0].name);
    }
}

/**
 * BARU: Menangani pemilihan tipe inspeksi.
 * @param {number} typeId - ID tipe inspeksi yang dipilih.
 * @param {string} typeName - Nama tipe inspeksi yang dipilih.
 */
function selectInspectionType(typeId, typeName) {
    activeInspectionTypeId = typeId;

    // Update UI untuk daftar tipe
    document.querySelectorAll('.inspection-type-link').forEach(link => {
        const isSelected = link.dataset.typeId === typeId;
        link.classList.toggle('bg-blue-100', isSelected);
        link.classList.toggle('border-blue-200', isSelected);
        link.classList.toggle('text-blue-800', isSelected);
        link.classList.toggle('font-semibold', isSelected);
        link.classList.toggle('hover:bg-slate-100', !isSelected);
        link.classList.toggle('border-transparent', !isSelected);
        link.querySelector('span:last-child').classList.toggle('bg-blue-200', isSelected);
        link.querySelector('span:last-child').classList.toggle('text-blue-800', isSelected);
        link.querySelector('span:last-child').classList.toggle('text-slate-500', !isSelected);
    });

    // Tampilkan header dan muat item
    document.getElementById('inspection-item-placeholder').classList.add('hidden');
    const itemHeader = document.getElementById('inspection-item-header');
    itemHeader.classList.remove('hidden');
    document.getElementById('selected-inspection-type-name').textContent = typeName;

    loadInspectionItems(typeId);
}

/**
 * BARU: Memuat item checklist untuk tipe inspeksi yang dipilih.
 * @param {number} typeId - ID tipe inspeksi.
 */
async function loadInspectionItems(typeId) {
    const container = document.getElementById('inspection-item-list-container');
    container.innerHTML = `<p class="text-sm text-slate-500"><i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Memuat item...</p>`;

    try {
        const response = await fetch(`${API_BASE_URL}/api/inspections/types/${typeId}/items`, { headers: getAuthHeaders() });
        if (!response.ok) throw new Error('Gagal memuat item checklist.');
        
        const items = await response.json();
        renderInspectionItems(items);
    } catch (error) {
        container.innerHTML = `<p class="text-sm text-red-500">${error.message}</p>`;
    }
}

/**
 * BARU: Merender item checklist ke dalam UI.
 * @param {Array<Object>} items - Array objek item.
 */
function renderInspectionItems(items) {
    const container = document.getElementById('inspection-item-list-container');
    container.innerHTML = '';

    if (items.length === 0) {
        container.innerHTML = `<p class="text-sm text-slate-500">Belum ada item checklist untuk tipe ini.</p>`;
        return;
    }

    // Kelompokkan item berdasarkan kategori
    const groupedItems = items.reduce((acc, item) => {
        const category = item.category || 'Lain-lain';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(item);
        return acc;
    }, {});

    for (const category in groupedItems) {
        const categoryDiv = document.createElement('div');
        categoryDiv.innerHTML = `<h5 class="font-semibold text-sm text-slate-600 mb-2 pb-1 border-b">${category}</h5>`;
        const ul = document.createElement('ul');
        ul.className = 'space-y-2 pl-2';
        
        groupedItems[category].forEach(item => {
            const li = document.createElement('li');
            li.className = 'text-sm text-slate-800 flex justify-between items-center';
            // BARU: Tambahkan data-item-id ke <li> dan ikon drag handle
            li.dataset.itemId = item.id;
            li.innerHTML = `
                <div class="flex items-center gap-3 cursor-grab">
                    <i class="fa-solid fa-grip-vertical text-slate-400 drag-handle"></i>
                    <span class="item-name">${item.name}</span>
                </div>
                <div class="flex items-center gap-3">
                    <button data-item-id="${item.id}" class="edit-inspection-item-btn text-xs text-blue-600 hover:underline">Edit</button>
                    <button data-item-id="${item.id}" data-item-name="${item.name}" class="delete-inspection-item-btn text-xs text-red-500 hover:underline">Hapus</button>
                </div>
            `;
            ul.appendChild(li);
        });

        // BARU: Tambahkan event listener ke tombol hapus item
        ul.querySelectorAll('.delete-inspection-item-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const itemId = e.currentTarget.dataset.itemId;
                const itemName = e.currentTarget.dataset.itemName;
                handleDeleteInspectionItem(itemId, itemName);
            });
        });

        // BARU: Tambahkan event listener untuk tombol edit item
        ul.querySelectorAll('.edit-inspection-item-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const itemId = e.currentTarget.dataset.itemId;
                openEditInspectionItemModal(itemId);
            });
        });
        
        // BARU: Inisialisasi SortableJS untuk setiap daftar kategori
        new Sortable(ul, {
            animation: 150,
            handle: '.drag-handle', // Tentukan elemen mana yang bisa di-drag
            ghostClass: 'sortable-ghost', // Class untuk item bayangan saat di-drag
            onEnd: async function (evt) {
                // Dapatkan urutan ID item yang baru dari DOM
                const orderedItemIds = Array.from(evt.target.children).map(child => child.dataset.itemId);
                try {
                    await handleReorderItems(orderedItemIds);
                    showToast('Urutan berhasil diperbarui.', 'success');
                } catch (error) {
                    showToast(error.message, 'error');
                    // Jika gagal, muat ulang item untuk mengembalikan ke urutan semula
                    loadInspectionItems(activeInspectionTypeId);
                }
            },
        });

        categoryDiv.appendChild(ul);
        container.appendChild(categoryDiv);
    }
}

/**
 * Menangani penyimpanan tipe inspeksi baru melalui API.
 */
async function handleSaveInspectionType(event) {
    event.preventDefault();
    const form = event.target;
    const name = form.name.value.trim();
    if (!name) {
        alert('Nama tipe tidak boleh kosong.');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/inspections/types`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ name })
        });
        if (!response.ok) throw new Error((await response.json()).error || 'Gagal menyimpan tipe.');

        showToast('Tipe inspeksi berhasil ditambahkan!', 'success');
        closeAddInspectionTypeModal();
        loadInspectionTypes(); // Muat ulang daftar untuk menampilkan data baru
    } catch (error) {
        document.getElementById('add-inspection-type-error').textContent = error.message;
        document.getElementById('add-inspection-type-error').classList.remove('hidden');
    }
}

/**
 * BARU: Menangani penyimpanan item checklist baru melalui API.
 */
async function handleSaveInspectionItem(event) {
    event.preventDefault();
    const form = event.target;
    const errorDiv = document.getElementById('add-inspection-item-error');
    const submitBtn = document.getElementById('add-inspection-item-submit-btn');
    
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Menyimpan...';
    errorDiv.classList.add('hidden');

    try {
        const response = await fetch(`${API_BASE_URL}/api/inspections/types/${data.inspection_type_id}/items`, {
            method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error((await response.json()).error || 'Gagal menyimpan item.');

        showToast('Item checklist berhasil ditambahkan!', 'success');
        closeAddInspectionItemModal();
        loadInspectionItems(data.inspection_type_id); // Muat ulang daftar item
        loadInspectionTypes(); // Muat ulang daftar tipe untuk update jumlah item
    } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.classList.remove('hidden');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Simpan Item';
    }
}

/**
 * BARU: Menangani penghapusan tipe inspeksi.
 * @param {number} typeId - ID tipe inspeksi yang akan dihapus.
 * @param {string} typeName - Nama tipe inspeksi untuk konfirmasi.
 */
async function handleDeleteInspectionType(typeId, typeName) {
    if (!confirm(`Anda yakin ingin menghapus tipe inspeksi "${typeName}"? Semua item checklist di dalamnya juga akan terhapus.`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/inspections/types/${typeId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Gagal menghapus tipe inspeksi.');
        }

        showToast('Tipe inspeksi berhasil dihapus.', 'success');
        
        // Jika tipe yang aktif dihapus, reset tampilan detail
        if (activeInspectionTypeId === typeId) {
            activeInspectionTypeId = null;
            document.getElementById('inspection-item-header').classList.add('hidden');
            document.getElementById('inspection-item-placeholder').classList.remove('hidden');
            document.getElementById('inspection-item-list-container').innerHTML = '';
        }

        loadInspectionTypes(); // Muat ulang daftar tipe
    } catch (error) {
        showToast(error.message, 'error');
    }
}

/**
 * BARU: Menangani penghapusan item checklist.
 * @param {number} itemId - ID item yang akan dihapus.
 * @param {string} itemName - Nama item untuk konfirmasi.
 */
async function handleDeleteInspectionItem(itemId, itemName) {
    if (!confirm(`Anda yakin ingin menghapus item "${itemName}"?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/inspection-items/${itemId}`, { method: 'DELETE', headers: getAuthHeaders() });
        if (!response.ok) throw new Error('Gagal menghapus item.');

        showToast('Item berhasil dihapus.', 'success');
        loadInspectionItems(activeInspectionTypeId); // Muat ulang daftar item
        loadInspectionTypes(); // Muat ulang daftar tipe untuk update jumlah
    } catch (error) {
        showToast(error.message, 'error');
    }
}

/**
 * BARU: Membuka modal untuk mengedit item checklist.
 * @param {number} itemId - ID item yang akan diedit.
 */
async function openEditInspectionItemModal(itemId) {
    const modal = document.getElementById('edit-inspection-item-modal');
    const errorDiv = document.getElementById('edit-inspection-item-error');
    errorDiv.classList.add('hidden');

    try {
        // Untuk mendapatkan detail item, kita bisa memfilter dari data yang sudah ada atau fetch ulang.
        // Fetch ulang lebih menjamin data terbaru.
        const response = await fetch(`${API_BASE_URL}/api/inspection-items/${itemId}`, { headers: getAuthHeaders() });
        if (!response.ok) throw new Error('Gagal memuat detail item.');
        const item = await response.json();

        document.getElementById('edit-item-id').value = item.id;
        document.getElementById('edit-item-name').value = item.name;
        document.getElementById('edit-item-category').value = item.category || '';
        document.getElementById('edit-item-standard').value = item.standard || '';

        modal.classList.remove('hidden');
        modal.classList.add('flex');
    } catch (error) {
        showToast(error.message, 'error');
    }
}

function closeEditInspectionItemModal() {
    document.getElementById('edit-inspection-item-modal')?.classList.add('hidden');
}
/**
 * BARU: Mengubah elemen span menjadi input field untuk diedit.
 * @param {HTMLElement} element - Elemen span yang akan diubah.
 * @param {'type'|'item'} entityType - Tipe entitas ('type' atau 'item').
 */
function makeEditable(element, entityType) {
    const originalText = element.textContent;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = originalText;
    input.className = 'w-full text-sm bg-white border border-blue-400 rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-300';

    element.replaceWith(input);
    input.focus();
    input.select();

    const saveChanges = async () => {
        const newText = input.value.trim();
        if (newText && newText !== originalText) {
            try {
                if (entityType === 'type') {
                    const typeId = input.parentElement.dataset.editableTypeId;
                    await handleUpdateInspectionType(typeId, newText);
                } else if (entityType === 'item') {
                    // Logika edit item sekarang ditangani oleh modal, fungsi ini tidak lagi mengedit item.
                    // Cukup kembalikan ke span.
                    throw new Error("Editing item name inline is deprecated.");
                }
            } catch (error) {
                showToast(error.message, 'error');
                // Kembalikan ke teks asli jika gagal
                const newSpan = document.createElement('span');
                newSpan.className = 'editable-name';
                newSpan.textContent = originalText;
                input.replaceWith(newSpan);
            }
        } else {
            // Jika tidak ada perubahan, kembalikan ke span
            const newSpan = document.createElement('span');
            newSpan.className = 'editable-name';
            newSpan.textContent = originalText;
            input.replaceWith(newSpan);
        }
    };

    input.addEventListener('blur', saveChanges);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            input.blur();
        } else if (e.key === 'Escape') {
            const newSpan = document.createElement('span');
            newSpan.className = 'editable-name';
            newSpan.textContent = originalText;
            input.replaceWith(newSpan);
        }
    });
}

/**
 * BARU: Mengirim pembaruan nama tipe inspeksi ke API.
 */
async function handleUpdateInspectionType(typeId, newName) {
    const response = await fetch(`${API_BASE_URL}/api/inspections/types/${typeId}`, {
        method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ name: newName })
    });
    if (!response.ok) throw new Error((await response.json()).error || 'Gagal memperbarui tipe.');
    showToast('Nama tipe berhasil diperbarui.', 'success');
    loadInspectionTypes(); // Muat ulang daftar untuk menampilkan perubahan
}

/**
 * BARU: Mengirim pembaruan nama item checklist ke API.
 */
async function handleUpdateInspectionItem(event) {
    event.preventDefault();
    const form = event.target;
    const errorDiv = document.getElementById('edit-inspection-item-error');
    const submitBtn = document.getElementById('edit-inspection-item-submit-btn');

    const itemId = form.itemId.value;
    const payload = {
        name: form.name.value,
        category: form.category.value,
        standard: form.standard.value,
    };

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Menyimpan...';
    errorDiv.classList.add('hidden');

    try {
        const response = await fetch(`${API_BASE_URL}/api/inspection-items/${itemId}`, {
            method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error((await response.json()).error || 'Gagal memperbarui item.');
        
        showToast('Item berhasil diperbarui.', 'success');
        closeEditInspectionItemModal();
        loadInspectionItems(activeInspectionTypeId); // Muat ulang daftar item
    } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.classList.remove('hidden');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Simpan Perubahan';
    }
}

/**
 * BARU: Mengirim urutan item yang baru ke backend.
 * @param {Array<string>} orderedIds - Array ID item dalam urutan baru.
 */
async function handleReorderItems(orderedIds) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/inspection-items/reorder`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ orderedIds })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Gagal menyimpan urutan item.');
        }
        // Tidak perlu melakukan apa-apa di sini karena UI sudah diupdate oleh SortableJS
    } catch (error) {
        throw error; // Lemparkan error agar bisa ditangkap oleh pemanggil
    }
}