let allHotels = []; // Global variable to store hotels
let sortableInstance = null; // To hold the sortable instance

function initSortable() {
    const tbody = document.getElementById('competitor-list-body');
    if (sortableInstance) {
        sortableInstance.destroy();
    }
    sortableInstance = new Sortable(tbody, {
        handle: '.drag-handle', // Class for the drag handle
        animation: 150,
        ghostClass: 'sortable-ghost', // Class for the ghost element
        onEnd: async function (evt) {
            const hotelId = document.getElementById('comp-setting-hotel-select').value;
            const items = evt.to.children;
            const ordered_ids = Array.from(items).map(item => item.dataset.id);

            try {
                await fetchAPI('/api/competitor/config/reorder', {
                    method: 'POST',
                    body: JSON.stringify({ hotel_id: hotelId, ordered_ids: ordered_ids }),
                });
                // Optionally show a success message
            } catch (error) {
                console.error('Error reordering competitors:', error);
                alert('Gagal menyimpan urutan baru.');
            }
        },
    });
}


document.addEventListener('DOMContentLoaded', () => {
    // Event Listeners
    const hotelSelect = document.getElementById('comp-setting-hotel-select');
    if (hotelSelect) {
        hotelSelect.addEventListener('change', loadCompetitorsList);
    }

    const addExistingBtn = document.getElementById('add-existing-comp-btn');
    if (addExistingBtn) {
        addExistingBtn.addEventListener('click', addExistingCompetitor);
    }

    const addManualBtn = document.getElementById('add-manual-comp-btn');
    if (addManualBtn) {
        addManualBtn.addEventListener('click', addManualCompetitor);
    }
});

async function initCompetitorSettingsPage() {
    const hotelSelect = document.getElementById('comp-setting-hotel-select');
    const existingHotelSelect = document.getElementById('comp-setting-existing-hotel');
    
    // Load hotels for dropdowns
    try {
        const hotels = await fetchAPI('/api/hotels');
        allHotels = hotels; // Store hotels
        
        // Populate Subject Hotel Select
        // Save current selection if any
        const currentVal = hotelSelect.value;
        hotelSelect.innerHTML = '<option value="">-- Pilih Hotel --</option>';
        hotels.forEach(h => {
            hotelSelect.innerHTML += `<option value="${h.id}">${h.name}</option>`;
        });
        if (currentVal) hotelSelect.value = currentVal;

        // Populate Existing Hotel Select (Source for competitors)
        existingHotelSelect.innerHTML = '<option value="">-- Pilih Hotel --</option>';
        hotels.forEach(h => {
            const roomCountText = h.number_of_rooms ? ` (${h.number_of_rooms} kamar)` : '';
            existingHotelSelect.innerHTML += `<option value="${h.name}">${h.name}${roomCountText}</option>`;
        });

    } catch (error) {
        console.error('Error loading hotels:', error);
    }
}

async function loadCompetitorsList() {
    const hotelId = document.getElementById('comp-setting-hotel-select').value;
    const tbody = document.getElementById('competitor-list-body');
    
    if (!hotelId) {
        tbody.innerHTML = '<tr><td colspan="3" class="p-4 text-center text-slate-400">Silakan pilih hotel terlebih dahulu.</td></tr>';
        return;
    }

    tbody.innerHTML = '<tr><td colspan="3" class="p-4 text-center"><i class="fa-solid fa-circle-notch fa-spin"></i> Memuat...</td></tr>';

    try {
        const competitors = await fetchAPI(`/api/competitor/config/${hotelId}`);
        
        tbody.innerHTML = '';
        if (competitors.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="p-4 text-center text-slate-500">Belum ada kompetitor yang diatur.</td></tr>';
            return;
        }

        competitors.forEach(comp => {
            const tr = document.createElement('tr');
            tr.className = 'bg-white border-b hover:bg-slate-50';
            tr.dataset.id = comp.id;
            tr.innerHTML = `
                <td class="px-6 py-4">
                    <i class="fa-solid fa-grip-vertical cursor-move drag-handle mr-2 text-slate-400"></i>
                    <span class="font-medium text-slate-900">${comp.competitor_name}</span>
                </td>
                <td class="px-6 py-4"><input type="number" value="${comp.number_of_rooms || ''}" onblur="updateCompetitorRooms(this, ${comp.id})" class="form-input w-24 text-center py-1 transition-colors duration-300"></td>
                <td class="px-6 py-4 text-center">
                    <button onclick="deleteCompetitorConfig(${comp.id})" class="text-red-600 hover:text-red-800 transition">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        initSortable();
    } catch (error) {
        console.error('Error loading competitors:', error);
        tbody.innerHTML = '<tr><td colspan="3" class="p-4 text-center text-red-500">Gagal memuat data.</td></tr>';
    }
}

async function addExistingCompetitor() {
    const hotelId = document.getElementById('comp-setting-hotel-select').value;
    const hotelSelect = document.getElementById('comp-setting-hotel-select');
    const subjectHotelName = hotelSelect.options[hotelSelect.selectedIndex]?.text;
    const compName = document.getElementById('comp-setting-existing-hotel').value;
    
    if (!hotelId) return alert('Pilih hotel subject terlebih dahulu.');
    if (!compName) return alert('Pilih hotel kompetitor dari daftar.');

    if (compName === subjectHotelName) {
        return alert('Hotel tidak dapat ditambahkan sebagai kompetitor untuk dirinya sendiri.');
    }

    const selectedHotel = allHotels.find(h => h.name === compName);
    const numberOfRooms = selectedHotel ? selectedHotel.number_of_rooms : null;

    await saveCompetitorConfig(hotelId, compName, numberOfRooms);
}

async function addManualCompetitor() {
    const hotelId = document.getElementById('comp-setting-hotel-select').value;
    const compName = document.getElementById('comp-setting-manual-name').value.trim();
    const numberOfRooms = document.getElementById('comp-setting-manual-rooms').value;
    
    if (!hotelId) return alert('Pilih hotel subject terlebih dahulu.');
    if (!compName) return alert('Masukkan nama hotel kompetitor.');
    if (!numberOfRooms) return alert('Masukkan jumlah kamar.');

    await saveCompetitorConfig(hotelId, compName, numberOfRooms);
    document.getElementById('comp-setting-manual-name').value = ''; // Clear input
    document.getElementById('comp-setting-manual-rooms').value = ''; // Clear input
}

async function saveCompetitorConfig(hotelId, competitorName, numberOfRooms) {
    try {
        await fetchAPI('/api/competitor/config', {
            method: 'POST',
            body: JSON.stringify({ hotel_id: hotelId, competitor_name: competitorName, number_of_rooms: numberOfRooms })
        });
        loadCompetitorsList(); // Refresh list
    } catch (error) {
        console.error('Error adding competitor:', error);
        alert('Gagal menambahkan kompetitor. Mungkin sudah ada.');
    }
}

// Make it global so it can be called from onclick attribute
window.deleteCompetitorConfig = async function(id) {
    if (!confirm('Hapus kompetitor ini dari daftar?')) return;

    try {
        await fetchAPI(`/api/competitor/config/${id}`, { method: 'DELETE' });
        loadCompetitorsList();
    } catch (error) {
        console.error('Error deleting competitor:', error);
        alert('Gagal menghapus kompetitor.');
    }
};

/**
 * Updates the number of rooms for a specific competitor configuration.
 * This function is attached to the window object to be accessible from `onblur` attributes.
 * @param {HTMLInputElement} inputElement - The input element that triggered the event.
 * @param {number} competitorId - The ID of the competitor config to update.
 */
window.updateCompetitorRooms = async function(inputElement, competitorId) {
    const newNumberOfRooms = inputElement.value;

    // Provide visual feedback that saving is in progress
    inputElement.classList.remove('border-green-500', 'border-red-500');
    inputElement.classList.add('border-yellow-400');

    try {
        await fetchAPI(`/api/competitor/config/${competitorId}`, {
            method: 'PUT',
            body: JSON.stringify({ number_of_rooms: newNumberOfRooms })
        });
        inputElement.classList.replace('border-yellow-400', 'border-green-500');
        setTimeout(() => inputElement.classList.remove('border-green-500'), 2000);
    } catch (error) {
        console.error('Error updating number of rooms:', error);
        inputElement.classList.replace('border-yellow-400', 'border-red-500');
        showToast(`Gagal memperbarui: ${error.message}`, 'error');
    }
};