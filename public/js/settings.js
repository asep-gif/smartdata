
/**
 * PERUBAHAN: Inisialisasi halaman pengaturan, sekarang juga memuat peran dinamis.
 * BARU: Inisialisasi untuk semua form di halaman pengaturan.
 */
function initSettingsPage() {
    // Inisialisasi form settings
    const addUserForm = document.getElementById('add-user-form');
    if (addUserForm) {
        addUserForm.addEventListener('submit', handleAddUserSubmit); // Kembalikan event listener
        const userRoleSelect = document.getElementById('user-role');
        if (userRoleSelect) {
            userRoleSelect.addEventListener('change', toggleHotelIdField);
            toggleHotelIdField(); // Panggil saat inisialisasi
        }
    }
    
    document.getElementById('add-hotel-form')?.addEventListener('submit', handleAddHotelSubmit); // Kembalikan event listener
    document.getElementById('edit-hotel-form')?.addEventListener('submit', handleEditHotelSubmit); // Kembalikan event listener
    
    const editUserForm = document.getElementById('edit-user-form');
    if (editUserForm) {
        editUserForm.addEventListener('submit', handleEditUserSubmit); // Kembalikan event listener
        const editUserRoleSelect = document.getElementById('edit-user-role');
        if (editUserRoleSelect) {
            editUserRoleSelect.addEventListener('change', toggleEditHotelIdField);
        }
    }
    
    document.getElementById('edit-opening-balance-form')?.addEventListener('submit', handleSaveOpeningBalance); // Kembalikan event listener
    
    // BARU: Panggil fungsi untuk mengisi dropdown peran secara dinamis
    populateRolesDropdowns();
}

/**
 * BARU: Muat daftar hotel dan isi ke dalam elemen <select> di modal.
 */
async function loadHotelsForSelects() {
    try {
        const hotels = await fetchAPI('/api/hotels');
        
        const userHotelSelect = document.getElementById('user-hotel-ids');
        const editUserHotelSelect = document.getElementById('edit-user-hotel-ids');

        if (userHotelSelect) {
            userHotelSelect.innerHTML = hotels.map(hotel => `<option value="${hotel.id}">${hotel.name}</option>`).join('');
        }
        if (editUserHotelSelect) {
            editUserHotelSelect.innerHTML = hotels.map(hotel => `<option value="${hotel.id}">${hotel.name}</option>`).join('');
        }
        
    } catch (error) {
        console.error('Error loading hotels for selects:', error);
        if (typeof showToast === 'function') showToast(error.message, 'error');
    }
}

/**
 * BARU: Mengambil daftar peran dari API dan mengisi dropdown di modal.
 */
async function populateRolesDropdowns() {
    const addRoleSelect = document.getElementById('user-role');
    const editRoleSelect = document.getElementById('edit-user-role');

    try {
        const roles = await fetchAPI('/api/roles'); // Panggil endpoint baru

        const populate = (select) => {
            if (!select) return;
            select.innerHTML = ''; // Kosongkan opsi yang ada
            roles.forEach(roleName => {
                const option = new Option(roleName.charAt(0).toUpperCase() + roleName.slice(1), roleName);
                select.appendChild(option);
            });
        };

        populate(addRoleSelect);
        populate(editRoleSelect);
    } catch (error) {
        console.error('Gagal memuat daftar peran:', error);
        if (typeof showToast === 'function') showToast('Gagal memuat daftar peran.', 'error');
    }
}

/**
 * KEMBALIKAN: Menangani submit form untuk menambah pengguna baru.
 * @param {Event} event - Objek event dari form submit.
 */
async function handleAddUserSubmit(event) {
    event.preventDefault();
    const form = event.target;
    
    const username = document.getElementById('user-username').value;
    const email = document.getElementById('user-email').value;
    const password = document.getElementById('user-password').value;
    const fullName = document.getElementById('user-fullname').value;
    const role = document.getElementById('user-role').value;
    
    const hotelCheckboxes = document.querySelectorAll('#user-add-hotel-checklist-container input[type="checkbox"]:checked');
    const hotelIds = Array.from(hotelCheckboxes).map(cb => cb.value);

    if (!username || !email || !password || !role) { // Validasi dasar
        showToast('Harap isi semua kolom yang wajib diisi (Username, Email, Password, Role).', 'error');
        return;
    }
    if (role !== 'admin' && hotelIds.length === 0) { // Validasi hotel untuk semua role kecuali admin
        showToast('Untuk peran Staff/Manager, minimal satu hotel harus dipilih.', 'error');
        return;
    }

    const userData = { username, email, password, fullName, role, hotelIds };

    try {
        await fetchAPI('/api/users', {
            method: 'POST',
            body: JSON.stringify(userData)
        });

        showToast('Pengguna baru berhasil ditambahkan!', 'success');
        form.reset();
        closeAddUserModal();
        loadUsersTable(); 
    } catch (error) {
        console.error('Error adding user:', error);
        showToast(error.message, 'error');
    }
}

/**
 * KEMBALIKAN: Menangani submit form untuk mengedit pengguna.
 * @param {Event} event - Objek event dari form submit.
 */
async function handleEditUserSubmit(event) {
    event.preventDefault();
    const form = event.target;
    
    const userId = document.getElementById('edit-user-id').value;
    const fullName = document.getElementById('edit-user-fullname').value;
    const role = document.getElementById('edit-user-role').value;
    const password = document.getElementById('edit-user-password').value; // Opsional

    const hotelCheckboxes = document.querySelectorAll('#user-edit-hotel-checklist-container input[type="checkbox"]:checked');
    const hotelIds = Array.from(hotelCheckboxes).map(cb => cb.value);

    if (role !== 'admin' && hotelIds.length === 0) { // Validasi hotel untuk semua role kecuali admin
        showToast('Untuk peran Staff/Manager, minimal satu hotel harus dipilih.', 'error');
        return;
    }

    const userData = { fullName, role, hotelIds };
    if (password) {
        userData.password = password;
    }

    try {
        await fetchAPI(`/api/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });

        showToast('Data pengguna berhasil diperbarui!', 'success');
        closeEditUserModal();
        loadUsersTable();
    } catch (error) {
        console.error('Error updating user:', error);
        showToast(error.message, 'error');
    }
}


/**
 * Fungsi generik untuk menampilkan/menyembunyikan pilihan hotel berdasarkan peran.
 * @param {HTMLSelectElement} roleElement - Elemen <select> untuk peran.
 * @param {HTMLElement} hotelContainer - Elemen kontainer untuk pilihan hotel.
 */
function toggleHotelVisibility(roleElement, hotelContainer) {
    if (!roleElement || !hotelContainer) return;
    
    // Tampilkan pilihan hotel untuk semua role KECUALI admin
    if (roleElement.value !== 'admin') {
        hotelContainer.style.display = 'block';
    } else {
        hotelContainer.style.display = 'none';
    }
}

/**
 * Handler untuk form tambah pengguna.
 */
function toggleHotelIdField() {
    const roleElement = document.getElementById('user-role'); // Di modal tambah
    const hotelContainer = document.getElementById('hotel-id-field'); // Kontainer di modal tambah
    toggleHotelVisibility(roleElement, hotelContainer);
}

/**
 * Handler untuk form edit pengguna.
 */
function toggleEditHotelIdField() {
    const roleElement = document.getElementById('edit-user-role'); // Di modal edit
    const hotelContainer = document.getElementById('edit-hotel-id-field'); // Kontainer di modal edit
    toggleHotelVisibility(roleElement, hotelContainer);
}


/**
 * KEMBALIKAN: Menangani submit form untuk menambah hotel baru.
 * @param {Event} event - Objek event dari form submit.
 */
async function handleAddHotelSubmit(event) {
    event.preventDefault();
    const form = event.target;
    
    const name = document.getElementById('hotel-name').value;
    const brand = document.getElementById('hotel-brand').value;
    const city = document.getElementById('hotel-city').value;
    const address = document.getElementById('hotel-address').value;

    if (!name) {
        showToast('Nama hotel wajib diisi.', 'error');
        return;
    }

    try {
        await fetchAPI('/api/hotels', {
            method: 'POST',
            body: JSON.stringify({ name, brand, city, address })
        });
        showToast('Hotel baru berhasil ditambahkan!', 'success');
        form.reset();
        closeAddHotelModal();
        loadHotelsTable();
    } catch (error) {
        console.error('Error adding hotel:', error);
        showToast(error.message, 'error');
    }
}

/**
 * KEMBALIKAN: Menangani submit form untuk mengedit hotel.
 * @param {Event} event - Objek event dari form submit.
 */
async function handleEditHotelSubmit(event) {
    event.preventDefault();
    const form = event.target;

    const hotelId = document.getElementById('edit-hotel-id').value;
    const name = document.getElementById('edit-hotel-name').value;
    const brand = document.getElementById('edit-hotel-brand').value;
    const city = document.getElementById('edit-hotel-city').value;
    const address = document.getElementById('edit-hotel-address').value;

    if (!name || !hotelId) {
        showToast('Nama hotel dan ID tidak boleh kosong.', 'error');
        return;
    }

    try {
        await fetchAPI(`/api/hotels/${hotelId}`, {
            method: 'PUT',
            body: JSON.stringify({ name, brand, city, address })
        });
        showToast('Data hotel berhasil diperbarui!', 'success');
        closeEditHotelModal();
        loadHotelsTable();
    } catch (error) {
        console.error('Error updating hotel:', error);
        showToast(error.message, 'error');
    }
}

/**
 * BARU: Menangani penyimpanan opening balance.
 * @param {Event} event
 */
async function handleSaveOpeningBalance(event) {
    event.preventDefault();
    const payload = {
        hotel_id: document.getElementById('edit-ob-hotel-id').value, // Pastikan ID ini ada di form
        effective_date: document.getElementById('edit-ob-date').value,
        balance_value: document.getElementById('edit-ob-balance').value,
    };

    if (!payload.hotel_id || !payload.effective_date || payload.balance_value === '') {
        showToast('Hotel, Tanggal Efektif, dan Saldo Awal wajib diisi.', 'error');
        return;
    }

    try {
        await fetchAPI('/api/financials/opening-balance', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        showToast('Saldo awal berhasil disimpan.', 'success');
        closeEditOpeningBalanceModal();
        loadOpeningBalanceTable(); // Refresh table
    } catch (error) {
        showToast(error.message, 'error');
    }
}


// --- FUNGSI-FUNGSI MANAJEMEN PERAN (YANG SUDAH ADA) ---

/**
 * Inisialisasi Manajemen Peran
 * Mengambil data peran dan hak akses dari backend, lalu merender UI.
 */
async function initRoleManagement() {
    const container = document.getElementById('role-management-container');
    container.innerHTML = '<p>Memuat data peran...</p>';

    try {
        const data = await fetchAPI('/api/roles/settings');
        renderRolesUI(data.roles, data.permissions);
    } catch (error) {
        console.error('Error initializing role management:', error);
        container.innerHTML = `<p class="text-danger">Terjadi kesalahan: ${error.message}</p>`;
        if (typeof showToast === 'function') {
            showToast(error.message, 'error');
        }
    }
}

/**
 * Merender seluruh UI manajemen peran, termasuk tabel dan tombol.
 * @param {Array} roles - Array objek peran dari API.
 * @param {Object} permissionsByGroup - Objek hak akses yang dikelompokkan berdasarkan grup.
 */
function renderRolesUI(roles, permissionsByGroup) {
    const container = document.getElementById('role-management-container');
    const sortedGroups = Object.keys(permissionsByGroup).sort();

    let tableHtml = `
        <div class="flex justify-between items-center mb-6 pb-4 border-b border-slate-200">
            <h3 class="text-xl font-bold text-slate-800">Manajemen Peran dan Hak Akses</h3>
            <div class="flex items-center gap-3">
                <button id="add-new-role-btn" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition"><i class="fa-solid fa-plus mr-2"></i>Tambah Peran</button>
                <!-- Tombol kembali ke menu utama settings -->
                <button onclick="window.location.hash = '#settings'" class="bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm px-4 py-2 rounded-md shadow-sm transition flex-shrink-0"><i class="fa-solid fa-arrow-left mr-2"></i> Kembali</button>
            </div>
        </div>
        <div class="overflow-x-auto">
            <table class="w-full text-sm text-left text-slate-500">
                <thead class="text-xs text-slate-700 uppercase bg-slate-50">
                    <tr>
                        <th scope="col" class="px-6 py-3">Peran</th>
                        <th scope="col" class="px-6 py-3">Deskripsi</th>
                        <th scope="col" class="px-6 py-3 text-center">Aksi</th>
                    </tr>
                </thead>
                <tbody id="roles-table-body" class="divide-y divide-slate-200">
                    ${roles.map(role => renderRoleRow(role, permissionsByGroup, sortedGroups)).join('')}
                </tbody>
            </table>
        </div>
    `;

    container.innerHTML = tableHtml;

    // Simpan data permissions di global scope agar bisa diakses modal
    window.appData = window.appData || {};
    window.appData.permissionsByGroup = permissionsByGroup;
    window.appData.roles = roles;

    attachRoleEventListeners(); // Pasang event listener setelah UI dirender
}

/**
 * Merender satu baris <tr> untuk sebuah peran.
 * @param {Object} role - Objek peran tunggal.
 * @param {Object} permissionsByGroup - Objek hak akses yang dikelompokkan.
 * @param {Array} sortedGroups - Array nama grup yang sudah diurutkan.
 * @returns {string} String HTML untuk satu baris <tr>.
 */
function renderRoleRow(role) {
    const isBaseRole = ['admin', 'manager', 'staff', 'engineering'].includes(role.name);
    const isAdmin = role.name === 'admin';

    return `
        <tr data-role-id="${role.id}" data-role-name="${role.name}" class="bg-white hover:bg-slate-50">
            <td class="px-6 py-4 font-semibold text-slate-800">
                <strong class="font-semibold text-slate-800 text-base">${role.name}</strong>
            </td>
            <td class="px-6 py-4 text-slate-500">
                ${role.description || '-'}
            </td>
            <td class="px-6 py-4 text-center">
                <div class="flex items-center justify-center gap-2">
                    <button class="open-permissions-modal-btn font-medium text-blue-600 hover:underline disabled:text-slate-400 disabled:no-underline disabled:cursor-not-allowed" ${isAdmin ? 'disabled' : ''} title="${isAdmin ? 'Hak akses Admin tidak dapat diubah' : 'Atur Hak Akses'}">
                        Atur Hak Akses
                    </button>
                    <button class="delete-role-btn ml-4 font-medium text-red-600 hover:underline disabled:text-slate-400 disabled:no-underline disabled:cursor-not-allowed" ${isBaseRole ? 'disabled' : ''} title="${isBaseRole ? 'Peran dasar tidak dapat dihapus' : 'Hapus peran'}">
                        Hapus
                    </button>
                </div>
            </td>
        </tr>
    `;
}


/**
 * BARU: Membuka modal untuk mengatur hak akses.
 * @param {string} roleId - ID dari peran yang akan diatur.
 */
function openPermissionsModal(roleId) {
    const { permissionsByGroup, roles } = window.appData;
    const role = roles.find(r => r.id.toString() === roleId);
    if (!role) return;

    document.getElementById('permissions-modal-role-name').textContent = role.name;
    const modalBody = document.getElementById('permissions-modal-body');
    const sortedGroups = Object.keys(permissionsByGroup).sort();

    const contentHtml = sortedGroups.map(group => `
        <div>
            <h4 class="text-base font-bold text-slate-800 mb-3 pb-2 border-b">${group}</h4>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-3">
                ${permissionsByGroup[group].map(perm => `
                    <div class="flex items-center" title="${perm.action}: ${perm.description || ''}">
                        <input class="form-checkbox h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 modal-permission-checkbox" 
                               type="checkbox" 
                               value="${perm.id}"
                               id="modal-perm-${role.id}-${perm.id}"
                               ${role.permissionIds.includes(perm.id) ? 'checked' : ''}>
                        <label class="ml-2 text-sm text-slate-700 cursor-pointer" for="modal-perm-${role.id}-${perm.id}">
                            ${perm.action.split(':')[1] || perm.action}
                        </label>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');

    modalBody.innerHTML = contentHtml;

    const saveBtn = document.getElementById('save-permissions-from-modal-btn');
    saveBtn.dataset.roleId = roleId; // Simpan roleId di tombol save

    // Ganti sintaks jQuery dengan JavaScript murni
    const modal = document.getElementById('permissions-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

/**
 * BARU: Menutup modal hak akses.
 */
function closePermissionsModal() {
    // Ganti sintaks jQuery dengan JavaScript murni
    const modal = document.getElementById('permissions-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

/**
 * BARU: Menangani penyimpanan hak akses dari dalam modal.
 */
async function handleSavePermissionsFromModal() {
    const saveBtn = document.getElementById('save-permissions-from-modal-btn');
    const roleId = saveBtn.dataset.roleId;
    if (!roleId) return;

    const modalBody = document.getElementById('permissions-modal-body');
    const checkedCheckboxes = modalBody.querySelectorAll('.modal-permission-checkbox:checked');
    const permissionIds = Array.from(checkedCheckboxes).map(cb => parseInt(cb.value));

    try {
        await fetchAPI(`/api/roles/${roleId}/permissions`, {
            method: 'PUT',
            body: JSON.stringify({ permissionIds })
        });
        if (typeof showToast === 'function') showToast('Hak akses berhasil diperbarui!', 'success');
        closePermissionsModal();
        initRoleManagement(); // Muat ulang seluruh UI untuk merefleksikan data baru
    } catch (error) {
        console.error(`Error saving permissions for role ${roleId}:`, error);
        if (typeof showToast === 'function') showToast(error.message, 'error');
    }
}


/**
 * Memasang event listener untuk tombol-tombol dinamis.
 */
function attachRoleEventListeners() {
    const roleSection = document.getElementById('role-management-section');
    if (!roleSection) return;

    // Listener untuk tombol di dalam tabel
    roleSection.addEventListener('click', function(event) {
        if (event.target.closest('.open-permissions-modal-btn')) {
            const row = event.target.closest('tr');
            const roleId = row.dataset.roleId;
            openPermissionsModal(roleId);
        }
        if (event.target.closest('.delete-role-btn')) {
            const row = event.target.closest('tr');
            const roleId = row.dataset.roleId;
            const roleName = row.dataset.roleName;
            handleDeleteRole(roleId, roleName);
        }
        if (event.target.closest('#add-new-role-btn')) {
            openAddRoleModal();
        }
    });

    // Listener untuk tombol di luar tabel (misal: di modal)
    document.getElementById('save-permissions-from-modal-btn')?.addEventListener('click', handleSavePermissionsFromModal);

    // Listener untuk form tambah peran
    const addRoleForm = document.getElementById('add-role-form');
    if (addRoleForm) {
        addRoleForm.addEventListener('submit', handleSaveNewRole);
    }
}

/**
 * BARU: Membuka modal untuk menambah peran baru.
 */
function openAddRoleModal() {
    const modal = document.getElementById('add-role-modal');
    if (modal) {
        document.getElementById('add-role-form').reset();
        const errorDiv = document.getElementById('add-role-error');
        if (errorDiv) errorDiv.classList.add('hidden');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

/**
 * BARU: Menutup modal tambah peran.
 */
function closeAddRoleModal() {
    const modal = document.getElementById('add-role-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

/**
 * BARU: Menangani penyimpanan peran baru dari modal.
 * @param {Event} event - Event dari submit form.
 */
async function handleSaveNewRole(event) {
    event.preventDefault();
    const form = event.target;
    const roleName = form.name.value.trim();
    const description = form.description.value.trim();

    try {
        const result = await fetchAPI('/api/roles', {
            method: 'POST',
            body: JSON.stringify({ name: roleName, description: description })
        });
        if (typeof showToast === 'function') showToast(`Peran "${result.name}" berhasil ditambahkan.`, 'success');
        closeAddRoleModal();
        initRoleManagement(); // Muat ulang UI untuk menampilkan peran baru
    } catch (error) {
        const errorDiv = document.getElementById('add-role-error');
        if (errorDiv) {
            errorDiv.textContent = error.message;
            errorDiv.classList.remove('hidden');
        }
        if (typeof showToast === 'function') showToast(error.message, 'error');
    }
}

/**
 * Menangani logika untuk menambah peran baru.
 */
async function handleAddNewRole() {
    const roleName = prompt("Masukkan nama peran baru (contoh: 'supervisor', 'auditor'):");
    if (!roleName || roleName.trim() === '') {
        return; // Batal jika input kosong
    }

    const description = prompt(`Masukkan deskripsi singkat untuk peran "${roleName}":`);

    try {
        const result = await fetchAPI('/api/roles', {
            method: 'POST',
            body: JSON.stringify({ name: roleName.trim(), description: description || '' })
        });
        if (typeof showToast === 'function') showToast(`Peran "${result.name}" berhasil ditambahkan.`, 'success');
        initRoleManagement(); // Muat ulang UI untuk menampilkan peran baru
    } catch (error) {
        console.error('Error adding new role:', error);
        if (typeof showToast === 'function') showToast(error.message, 'error');
    }
}

/**
 * Menangani logika untuk menghapus sebuah peran.
 * @param {string} roleId - ID dari peran yang akan dihapus.
 * @param {string} roleName - Nama peran untuk konfirmasi.
 */
async function handleDeleteRole(roleId, roleName) {
    if (!confirm(`Apakah Anda yakin ingin menghapus peran "${roleName}"? Aksi ini tidak dapat dibatalkan.`)) {
        return;
    }

    try {
        await fetchAPI(`/api/roles/${roleId}`, { method: 'DELETE' });
        if (typeof showToast === 'function') showToast(`Peran "${roleName}" berhasil dihapus.`, 'success');
        initRoleManagement(); // Muat ulang UI
    } catch (error) {
        console.error(`Error deleting role ${roleId}:`, error);
        if (typeof showToast === 'function') showToast(error.message, 'error');
    }
}

// --- DATA LOADING FOR SETTINGS SUB-PAGES ---

async function loadUsersTable() {
    const tableBody = document.getElementById('user-table-body');
    if (!tableBody) return;
    tableBody.innerHTML = '<tr><td colspan="5" class="text-center p-4">Memuat data pengguna...</td></tr>';
    
    try {
        const users = await fetchAPI('/api/users');
        if (users.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center p-4">Belum ada pengguna terdaftar.</td></tr>';
            return;
        }

        tableBody.innerHTML = '';
        users.forEach(user => {
            const tr = document.createElement('tr');
            const hotelNames = user.hotels.map(h => h.name).join(', ');
            tr.innerHTML = `
                <td class="px-6 py-4">
                    <div class="font-medium">${user.full_name || user.username}</div>
                    <div class="text-xs text-slate-500">${user.username}</div>
                </td>
                <td class="px-6 py-4">${user.email}</td>
                <td class="px-6 py-4 font-mono">******</td>
                <td class="px-6 py-4">
                    <span class="font-semibold">${user.role}</span>
                    ${(user.role !== 'admin') ? `<div class="text-xs text-slate-500" title="${hotelNames}">${hotelNames || 'No hotels'}</div>` : ''}
                </td>
                <td class="px-6 py-4 text-center">
                    <button onclick='openEditUserModal(${JSON.stringify(user)})' class="font-medium text-blue-600 hover:underline">Edit</button>
                    <button onclick="handleDeleteUser(${user.id}, '${user.username}')" class="ml-4 font-medium text-red-600 hover:underline">Hapus</button>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    } catch (error) {
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center p-4 text-red-500">Gagal memuat data: ${error.message}</td></tr>`;
    }
}

function openEditUserModal(user) {
    document.getElementById('edit-user-id').value = user.id;
    document.getElementById('edit-user-fullname').value = user.full_name || '';
    document.getElementById('edit-user-email').value = user.email;
    document.getElementById('edit-user-role').value = user.role;
    document.getElementById('edit-user-password').value = ''; // Kosongkan field password

    // Set checklist hotel
    // BARU: Panggil fungsi untuk mengisi checklist hotel di modal edit
    populateHotelChecklist('user-edit-hotel-checklist-container', 'user-edit-hotel-filter-select-all');
    initHotelFilterDropdown('user-edit-hotel-filter-btn', 'user-edit-hotel-filter-dropdown', 'user-edit-hotel-filter-search', 'user-edit-hotel-filter-select-all', 'user-edit-hotel-checklist-container', 'user-edit-hotel-filter-apply', 'user-edit-hotel-filter-label');

    const hotelCheckboxes = document.querySelectorAll('#user-edit-hotel-checklist-container input[type="checkbox"]');
    const userHotelIds = new Set(user.hotels.map(h => h.id.toString()));
    hotelCheckboxes.forEach(cb => {
        cb.checked = userHotelIds.has(cb.value);
    });
    updateHotelFilterLabel('user-edit-hotel-filter-label', 'user-edit-hotel-checklist-container');
    updateSelectAllCheckboxState('user-edit-hotel-checklist-container', 'user-edit-hotel-filter-select-all');
    
    toggleEditHotelIdField();
    const modal = document.getElementById('edit-user-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

async function handleDeleteUser(userId, username) {
    if (!confirm(`Apakah Anda yakin ingin menghapus pengguna "${username}"?`)) return;

    try {
        await fetchAPI(`/api/users/${userId}`, { method: 'DELETE' });
        showToast('Pengguna berhasil dihapus.', 'success');
        loadUsersTable();
    } catch (error) {
        showToast(`Gagal menghapus pengguna: ${error.message}`, 'error');
    }
}

async function loadHotelsTable() {
    const tableBody = document.getElementById('hotel-table-body');
    if (!tableBody) return;
    tableBody.innerHTML = '<tr><td colspan="5" class="text-center p-4">Memuat data hotel...</td></tr>';
    
    try {
        const hotels = await fetchAPI('/api/hotels');
        if (hotels.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center p-4">Belum ada hotel terdaftar.</td></tr>';
            return;
        }

        tableBody.innerHTML = '';
        hotels.forEach(hotel => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="px-6 py-4 font-medium">${hotel.name}</td>
                <td class="px-6 py-4">${hotel.brand || '-'}</td>
                <td class="px-6 py-4">${hotel.city || '-'}</td>
                <td class="px-6 py-4">${hotel.address || '-'}</td>
                <td class="px-6 py-4 text-center">
                    <button onclick='openEditHotelModal(${JSON.stringify(hotel)})' class="font-medium text-blue-600 hover:underline">Edit</button>
                    <button onclick="handleDeleteHotel(${hotel.id}, '${hotel.name}')" class="ml-4 font-medium text-red-600 hover:underline">Hapus</button>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    } catch (error) {
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center p-4 text-red-500">Gagal memuat data: ${error.message}</td></tr>`;
    }
}

function openEditHotelModal(hotel) {
    document.getElementById('edit-hotel-id').value = hotel.id;
    document.getElementById('edit-hotel-name').value = hotel.name || '';
    document.getElementById('edit-hotel-brand').value = hotel.brand || '';
    document.getElementById('edit-hotel-city').value = hotel.city || '';
    document.getElementById('edit-hotel-address').value = hotel.address || '';
    
    const modal = document.getElementById('edit-hotel-modal');
    if (modal) modal.classList.add('flex');
}

async function handleDeleteHotel(hotelId, hotelName) {
    if (!confirm(`Anda yakin ingin menghapus hotel "${hotelName}"? Aksi ini tidak dapat dibatalkan.`)) return;

    try {
        await fetchAPI(`/api/hotels/${hotelId}`, { method: 'DELETE' });
        showToast('Hotel berhasil dihapus.', 'success');
        loadHotelsTable();
    } catch (error) {
        showToast(`Gagal menghapus hotel: ${error.message}`, 'error');
    }
}

async function loadOpeningBalanceTable() {
    const tableBody = document.getElementById('opening-balance-table-body');
    if (!tableBody) return;
    tableBody.innerHTML = '<tr><td colspan="4" class="text-center p-4">Memuat data...</td></tr>';
    
    try {
        const balances = await fetchAPI('/api/financials/dsr/opening-balances');
        tableBody.innerHTML = '';
        balances.forEach(balance => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="px-6 py-4 font-medium">${balance.hotel_name}</td>
                <td class="px-6 py-4">${balance.effective_date ? new Date(balance.effective_date).toLocaleDateString('id-ID') : '-'}</td>
                <td class="px-6 py-4 text-right">${balance.balance_value !== null ? formatNumber(balance.balance_value) : '-'}</td>
                <td class="px-6 py-4 text-center">
                    <button onclick='openEditOpeningBalanceModal(${JSON.stringify(balance)})' class="font-medium text-blue-600 hover:underline">Edit</button>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    } catch (error) {
        tableBody.innerHTML = `<tr><td colspan="4" class="text-center p-4 text-red-500">Gagal memuat data: ${error.message}</td></tr>`;
    }
}

function openEditOpeningBalanceModal(balance) {
    document.getElementById('edit-ob-hotel-id').value = balance.hotel_id;
    document.getElementById('edit-ob-hotel-name').value = balance.hotel_name;

    const dateInput = document.getElementById('edit-ob-date');
    if(balance.effective_date) {
        dateInput.value = new Date(balance.effective_date).toISOString().split('T')[0];
    } else {
        dateInput.value = '';
    }

    document.getElementById('edit-ob-balance').value = balance.balance_value !== null ? balance.balance_value : '';
    const modal = document.getElementById('edit-opening-balance-modal');
    if (modal) modal.classList.add('flex');
}