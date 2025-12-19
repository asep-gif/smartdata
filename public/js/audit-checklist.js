// public/js/audit-checklist.js

/**
 * =================================================================================
 * AUDIT CHECKLIST MANAGEMENT
 * =================================================================================
 * Description: Handles CRUD functionality for the audit checklist management page.
 * This script is dependent on `utils.js` for `fetchAPI` and `showToast`, and SortableJS.
 */

function initAuditChecklistManagementPage() {
    // Add event listeners for modals and buttons
    document.getElementById('add-audit-category-btn')?.addEventListener('click', () => openAuditCategoryModal());
    document.getElementById('audit-category-form')?.addEventListener('submit', handleSaveCategory);
    document.getElementById('audit-item-form')?.addEventListener('submit', handleSaveItem);

    // Load the initial checklist data
    loadAuditChecklist();
}

async function loadAuditChecklist() {
    const container = document.getElementById('audit-checklist-container');
    if (!container) return;

    container.innerHTML = `<div class="text-center p-8"><i class="fa-solid fa-circle-notch fa-spin text-2xl text-blue-500"></i><p class="mt-2 text-slate-500">Memuat checklist...</p></div>`;

    try {
        const categories = await fetchAPI('/api/audit-checklists');
        renderAuditChecklist(categories);
    } catch (error) {
        container.innerHTML = `<p class="text-red-500 text-center">Gagal memuat data checklist: ${error.message}</p>`;
        showToast('Gagal memuat data checklist.', 'error');
    }
}

function renderAuditChecklist(categories) {
    const container = document.getElementById('audit-checklist-container');
    container.innerHTML = '';

    if (!categories || categories.length === 0) {
        container.innerHTML = `
            <div class="text-center text-slate-500 py-16 px-6 bg-slate-50 rounded-lg border-2 border-dashed">
                <i class="fa-solid fa-folder-open text-5xl mb-4 text-slate-400"></i>
                <h3 class="text-lg font-semibold text-slate-700">Belum Ada Checklist</h3>
                <p class="text-sm mt-2 mb-6 max-w-md mx-auto">Anda belum memiliki kategori checklist audit. Mulailah dengan membuat kategori pertama Anda untuk mengelompokkan item-item audit.</p>
                <button onclick="openAuditCategoryModal()" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-lg transition">
                    <i class="fa-solid fa-plus mr-2"></i>Buat Kategori Baru
                </button>
            </div>
        `;
        return;
    }

    // Inisialisasi SortableJS untuk kategori
    new Sortable(container, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        handle: '.category-drag-handle',
        onEnd: async (evt) => {
            const orderedIds = Array.from(container.children).map(el => el.dataset.categoryId);
            try {
                await fetchAPI('/api/audit-checklists/categories/reorder', {
                    method: 'PUT',
                    body: JSON.stringify({ orderedIds })
                });
                showToast('Urutan kategori diperbarui.', 'success');
            } catch (error) {
                showToast(`Gagal mengurutkan kategori: ${error.message}`, 'error');
                loadAuditChecklist(); // Muat ulang untuk mengembalikan urutan
            }
        }
    });

    categories.forEach(category => {
        const categoryElement = document.createElement('div');
        categoryElement.className = 'bg-slate-50 border border-slate-200 rounded-lg';
        categoryElement.dataset.categoryId = category.id;

        categoryElement.innerHTML = `
            <div class="flex justify-between items-center p-4">
                <div class="flex items-center gap-3 cursor-move category-drag-handle">
                    <i class="fa-solid fa-grip-vertical text-slate-400"></i>
                    <h4 class="font-bold text-slate-700">${category.name}</h4>
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="event.stopPropagation(); openAuditItemModal(${category.id})" class="text-sm text-blue-600 hover:underline px-2">Tambah Item</button>
                    <button onclick="this.closest('.p-4').nextElementSibling.classList.toggle('hidden'); this.querySelector('i').classList.toggle('rotate-180')" class="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-200 rounded-full transition-colors">
                        <i class="fa-solid fa-chevron-down transition-transform"></i>
                    </button>
                </div>
            </div>
            <div class="p-4 border-t border-slate-200 hidden">
                <ul class="space-y-2 audit-item-list">
                    ${category.items.length > 0 ? category.items.map(item => renderChecklistItem(item)).join('') : '<li class="text-sm text-slate-400">Belum ada item di kategori ini.</li>'}
                </ul>
            </div>
        `;
        container.appendChild(categoryElement);

        // Inisialisasi SortableJS untuk daftar item
        const itemList = categoryElement.querySelector('.audit-item-list');
        if (itemList) {
            new Sortable(itemList, {
                animation: 150,
                ghostClass: 'sortable-ghost',
                handle: '.drag-handle',
                onEnd: async (evt) => {
                    const orderedIds = Array.from(evt.from.children).map(el => el.dataset.itemId);
                    try {
                        await fetchAPI('/api/audit-checklists/items/reorder', {
                            method: 'PUT',
                            body: JSON.stringify({ orderedIds })
                        });
                        showToast('Urutan item diperbarui.', 'success');
                    } catch (error) {
                        showToast(`Gagal mengurutkan item: ${error.message}`, 'error');
                        loadAuditChecklist(); // Muat ulang untuk mengembalikan urutan
                    }
                }
            });
        }
    });
}

function renderChecklistItem(item) {
    return `
        <li data-item-id="${item.id}" class="flex justify-between items-center p-2 rounded-md hover:bg-slate-100 group">
            <div class="flex items-center gap-3">
                <i class="fa-solid fa-grip-vertical text-slate-400 cursor-grab drag-handle"></i>
                <span class="text-sm">${item.name}</span>
            </div>
            <div class="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onclick="openAuditItemModal(null, ${item.id})" class="text-xs text-blue-600 hover:underline">Edit</button>
                <button onclick="handleDeleteItem(${item.id})" class="text-xs text-red-500 hover:underline">Hapus</button>
            </div>
        </li>
    `;
}

// --- MODAL & FORM HANDLING (CATEGORY) ---

function openAuditCategoryModal(categoryId = null) {
    const modal = document.getElementById('audit-category-modal');
    const form = document.getElementById('audit-category-form');
    const title = document.getElementById('audit-category-modal-title');
    
    form.reset();
    document.getElementById('audit-category-error').classList.add('hidden');
    document.getElementById('audit-category-id').value = '';

    if (categoryId) {
        // Edit mode (not implemented yet, but prepared)
        title.textContent = 'Edit Kategori';
        // You would fetch category data and populate the form here
    } else {
        // Add mode
        title.textContent = 'Tambah Kategori Baru';
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeAuditCategoryModal() {
    document.getElementById('audit-category-modal')?.classList.add('hidden');
}

async function handleSaveCategory(event) {
    event.preventDefault();
    const form = event.target;
    const submitBtn = document.getElementById('audit-category-submit-btn');
    const errorDiv = document.getElementById('audit-category-error');

    const payload = { name: form.name.value };
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Menyimpan...';
    errorDiv.classList.add('hidden');

    try {
        await fetchAPI('/api/audit-checklists/categories', { method: 'POST', body: JSON.stringify(payload) });
        showToast('Kategori berhasil ditambahkan!', 'success');
        closeAuditCategoryModal();
        loadAuditChecklist();
    } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.classList.remove('hidden');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Simpan Kategori';
    }
}

// --- MODAL & FORM HANDLING (ITEM) ---

async function openAuditItemModal(categoryId, itemId = null) {
    const modal = document.getElementById('audit-item-modal');
    const form = document.getElementById('audit-item-form');
    const title = document.getElementById('audit-item-modal-title');
    
    form.reset();
    document.getElementById('audit-item-error').classList.add('hidden');
    document.getElementById('audit-item-id').value = '';
    document.getElementById('audit-item-is-active').checked = true;
    
    if (itemId) {
        // Edit Mode
        title.textContent = 'Edit Item Checklist';
        try {
            const item = await fetchAPI(`/api/audit-checklists/items/${itemId}`); // Assuming this endpoint exists
            document.getElementById('audit-item-id').value = item.id;
            document.getElementById('audit-item-category-id').value = item.category_id;
            document.getElementById('audit-item-name').value = item.name;
            document.getElementById('audit-item-standard').value = item.standard || '';
            document.getElementById('audit-item-is-active').checked = item.is_active;
        } catch (error) {
            showToast(`Gagal memuat data item: ${error.message}`, 'error');
            return;
        }
    } else {
        // Add Mode
        title.textContent = 'Tambah Item Baru';
        document.getElementById('audit-item-category-id').value = categoryId;
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeAuditItemModal() {
    document.getElementById('audit-item-modal')?.classList.add('hidden');
}

async function handleSaveItem(event) {
    event.preventDefault();
    const form = event.target;
    const submitBtn = document.getElementById('audit-item-submit-btn');
    const errorDiv = document.getElementById('audit-item-error');

    const itemId = form.itemId.value;
    const isEditing = !!itemId;

    const payload = {
        category_id: form.category_id.value,
        name: form.name.value,
        standard: form.standard.value,
        is_active: form.is_active.checked
    };

    const url = isEditing ? `/api/audit-checklists/items/${itemId}` : '/api/audit-checklists/items';
    const method = isEditing ? 'PUT' : 'POST';

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Menyimpan...';
    errorDiv.classList.add('hidden');

    try {
        await fetchAPI(url, { method, body: JSON.stringify(payload) });
        showToast(`Item berhasil ${isEditing ? 'diperbarui' : 'ditambahkan'}!`, 'success');
        closeAuditItemModal();
        loadAuditChecklist();
    } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.classList.remove('hidden');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Simpan Item';
    }
}

async function handleDeleteItem(itemId) {
    if (!confirm('Apakah Anda yakin ingin menghapus item ini?')) return;

    try {
        await fetchAPI(`/api/audit-checklists/items/${itemId}`, { method: 'DELETE' });
        showToast('Item berhasil dihapus.', 'success');
        loadAuditChecklist();
    } catch (error) {
        showToast(`Gagal menghapus item: ${error.message}`, 'error');
    }
}