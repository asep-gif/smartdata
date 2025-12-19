// --- SLIDES MANAGEMENT FUNCTIONS ---

/**
 * Inisialisasi halaman Google Slides Hotel.
 */
async function initSlidesPage() {
    const type = 'hotel'; 
    const addEditSlideForm = document.getElementById('add-edit-slide-form');
    if (addEditSlideForm) {
        const newForm = addEditSlideForm.cloneNode(true);
        addEditSlideForm.parentNode.replaceChild(newForm, addEditSlideForm);
        newForm.addEventListener('submit', (event) => handleSaveSlide(event, type));
    }

    const slidesGrid = document.getElementById('slides-grid');
    if (slidesGrid) {
        new Sortable(slidesGrid, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            onEnd: async function (evt) {
                const orderedIds = Array.from(slidesGrid.querySelectorAll('.slide-card-modern')).map(card => card.dataset.id);
                try {
                    const response = await fetch(`${API_BASE_URL}/api/slides/reorder`, {
                        method: 'PUT',
                        headers: getAuthHeaders(),
                        body: JSON.stringify({ order: orderedIds })
                    });
                    if (!response.ok) throw new Error('Gagal menyimpan urutan slide hotel.');
                } catch (error) {
                    alert(`Error: ${error.message}`);
                    loadSlides('hotel'); 
                }
            },
        });
    }
    loadSlides(type);
}

/**
 * Inisialisasi halaman Slides Corporate.
 */
async function initSlidesCorporatePage() {
    const type = 'corporate';
    const addEditSlideForm = document.getElementById('add-edit-slide-form');
    if (addEditSlideForm) {
        const newForm = addEditSlideForm.cloneNode(true);
        addEditSlideForm.parentNode.replaceChild(newForm, addEditSlideForm);
        newForm.addEventListener('submit', (event) => handleSaveSlide(event, type));
    }

    const corporateSlidesGrid = document.getElementById('slides-corporate-grid');
    if (corporateSlidesGrid) {
        new Sortable(corporateSlidesGrid, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            onEnd: async function (evt) {
                const orderedIds = Array.from(corporateSlidesGrid.querySelectorAll('.slide-card-modern')).map(card => card.dataset.id);
                 try {
                    const response = await fetch(`${API_BASE_URL}/api/slides/reorder`, {
                        method: 'PUT',
                        headers: getAuthHeaders(),
                        body: JSON.stringify({ order: orderedIds })
                    });
                    if (!response.ok) throw new Error('Gagal menyimpan urutan slide corporate.');
                } catch (error) {
                    alert(`Error: ${error.message}`);
                    loadSlides('corporate'); 
                }
            },
        });
    }
    loadSlides(type);
}

/**
 * Membuka modal untuk menambah/mengedit slide.
 * @param {string} type - 'hotel' atau 'corporate'.
 */
function openAddSlideModal(type = 'hotel') {
    const modal = document.getElementById('add-edit-slide-modal');
    const form = document.getElementById('add-edit-slide-form');
    const modalTitle = document.getElementById('add-edit-slide-modal-title');
    const errorDiv = document.getElementById('add-edit-slide-error');
    const hotelSelectContainer = document.getElementById('slide-hotel-select').parentElement;

    form.reset(); 
    document.getElementById('slide-id').value = ''; 
    errorDiv.classList.add('hidden'); 

    populateHotelDropdown('slide-hotel-select');

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    if (type === 'corporate') {
        modalTitle.textContent = 'Tambah Slide Corporate Baru';
        hotelSelectContainer.classList.add('hidden'); 
    } else {
        modalTitle.textContent = 'Tambah Slide Hotel Baru';
        hotelSelectContainer.classList.remove('hidden'); 
    }
}

function closeAddEditSlideModal() {
    const modal = document.getElementById('add-edit-slide-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

/**
 * Menangani penyimpanan (tambah/edit) data slide.
 * @param {Event} event - Objek event dari form submission.
 * @param {string} type - 'hotel' atau 'corporate'.
 */
async function handleSaveSlide(event, type) {
    event.preventDefault();
    const form = event.target;
    const submitBtn = document.getElementById('add-edit-slide-submit-btn');
    const errorDiv = document.getElementById('add-edit-slide-error');

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Menyimpan...';
    errorDiv.classList.add('hidden');

    const formData = new FormData(form);
    const slideId = formData.get('slideId');
    const data = {
        title: formData.get('title'),
        link: formData.get('link'),
        thumbnail_url: formData.get('thumbnail_url'),
        hotel_id: type === 'hotel' ? formData.get('hotelId') : null,
    };

    if (!data.title || !data.link || (type === 'hotel' && !data.hotel_id)) {
        errorDiv.textContent = 'Judul, Link, dan Hotel (untuk slide hotel) wajib diisi.';
        errorDiv.classList.remove('hidden');
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Simpan Slide';
        return;
    }

    const isEditing = !!slideId;
    const url = isEditing ? `${API_BASE_URL}/api/slides/${slideId}` : `${API_BASE_URL}/api/slides`;
    const method = isEditing ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Gagal menyimpan slide.');

        alert(`Slide berhasil ${isEditing ? 'diperbarui' : 'ditambahkan'}!`);
        closeAddEditSlideModal();
        loadSlides(type);
    } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.classList.remove('hidden');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Simpan Slide';
    }
}

/**
 * Memuat dan menampilkan daftar slide dari API.
 * @param {string} type - 'hotel' atau 'corporate'.
 */
async function loadSlides(type = 'hotel') {
    const gridId = type === 'corporate' ? 'slides-corporate-grid' : 'slides-grid';
    const messageId = type === 'corporate' ? 'no-slides-corporate-message' : 'no-slides-message';
    const slidesGrid = document.getElementById(gridId);
    const noSlidesMessage = document.getElementById(messageId);

    slidesGrid.innerHTML = '<p class="col-span-full text-center p-4"><i class="fa-solid fa-circle-notch fa-spin"></i> Memuat slide...</p>';
    noSlidesMessage.classList.add('hidden');

    try {
        const response = await fetch(`${API_BASE_URL}/api/slides?type=${type}`, { headers: getAuthHeaders() });
        if (!response.ok) throw new Error('Gagal memuat slide.');

        const slides = await response.json();
        slidesGrid.innerHTML = '';
        const noSlidesText = noSlidesMessage.querySelector('p.text-lg');

        if (slides.length === 0) {
            noSlidesMessage.classList.remove('hidden');
            if (noSlidesText) noSlidesText.textContent = `Belum ada slide ${type} tersedia.`;
        } else {
            slides.forEach(slide => createSlideCard(slide));
        }
    } catch (error) {
        slidesGrid.innerHTML = `<p class="col-span-full text-center p-4 text-red-500">${error.message}</p>`;
    }
}

/**
 * Membuat dan menambahkan kartu slide ke dalam grid.
 * @param {object} slide - Objek data slide dari API.
 */
function createSlideCard(slide) {
    const gridId = slide.hotel_id ? 'slides-grid' : 'slides-corporate-grid';
    const slidesGrid = document.getElementById(gridId);
    if (!slidesGrid) return;
    const card = document.createElement('div');
    card.className = "slide-card-modern";
    if (slide.hotel_brand) {
        card.dataset.brand = slide.hotel_brand.toLowerCase().replace(/\s+/g, '-');
    }
    card.onclick = () => window.open(slide.link, '_blank');
    card.dataset.id = slide.id;
    card.id = `slide-card-${slide.id}`;

    let imageUrl = null;
    const thumbnailUrl = slide.thumbnail_url;

    if (thumbnailUrl) {
        imageUrl = (thumbnailUrl.startsWith('http://') || thumbnailUrl.startsWith('https://'))
            ? thumbnailUrl
            : `${API_BASE_URL}/${thumbnailUrl}`;
    }

    const iconOrImageHTML = imageUrl
        ? `<img src="${imageUrl}" alt="${slide.title}" class="slide-card-image">`
        : `<i class="fas fa-file-powerpoint text-4xl text-blue-300"></i>`;

    const type = slide.hotel_id ? 'hotel' : 'corporate';
    card.innerHTML = `
        <div class="slide-card-icon">${iconOrImageHTML}</div>
        <div class="slide-card-content">
            <h3 class="font-bold text-base leading-tight mb-1" title="${slide.title}">${slide.title}</h3>
            <p class="text-xs opacity-90">${slide.hotel_name || 'Corporate Slide'}</p>
            ${slide.hotel_brand ? `<p class="text-[11px] opacity-70 mt-1">Brand : ${slide.hotel_brand}</p>` : ''}
        </div>
        <div class="slide-card-actions">
            <button class="text-slate-200 hover:text-white" onclick="event.stopPropagation(); openEditSlideModal(${slide.id}, '${type}')" title="Edit Slide"><i class="fa-solid fa-pen-to-square"></i></button>
            <button class="text-slate-200 hover:text-white" onclick="event.stopPropagation(); deleteSlide(${slide.id}, '${type}')" title="Hapus Slide"><i class="fa-solid fa-trash-can"></i></button>
        </div>
    `;
    slidesGrid.appendChild(card);
}

/**
 * Membuka modal untuk mengedit slide yang sudah ada.
 * @param {number} slideId - ID dari slide yang akan diedit.
 * @param {string} type - 'hotel' atau 'corporate'.
 */
async function openEditSlideModal(slideId, type = 'hotel') {
    const modal = document.getElementById('add-edit-slide-modal');
    const form = document.getElementById('add-edit-slide-form');
    const modalTitle = document.getElementById('add-edit-slide-modal-title');
    const errorDiv = document.getElementById('add-edit-slide-error');
    const hotelSelectContainer = document.getElementById('slide-hotel-select').parentElement;
    
    form.reset();
    errorDiv.classList.add('hidden');
    modalTitle.textContent = 'Edit Slide';

    try {
        const response = await fetch(`${API_BASE_URL}/api/slides/${slideId}`, { headers: getAuthHeaders() });
        if (!response.ok) throw new Error('Gagal mengambil data slide.');
        const slide = await response.json();

        await populateHotelDropdown('slide-hotel-select');

        document.getElementById('slide-id').value = slide.id;
        document.getElementById('slide-title').value = slide.title;
        document.getElementById('slide-link').value = slide.link;
        document.getElementById('slide-thumbnail').value = slide.thumbnail_url || '';

        modal.classList.remove('hidden');
        modal.classList.add('flex');

        if (type === 'corporate' || !slide.hotel_id) {
            modalTitle.textContent = 'Edit Slide Corporate';
            hotelSelectContainer.classList.add('hidden');
        } else {
            modalTitle.textContent = 'Edit Slide Hotel';
            hotelSelectContainer.classList.remove('hidden');
            document.getElementById('slide-hotel-select').value = slide.hotel_id;
        }
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

/**
 * Menghapus slide berdasarkan ID.
 * @param {number} slideId - ID dari slide yang akan dihapus.
 * @param {string} type - Tipe slide ('hotel' atau 'corporate') yang dihapus.
 */
async function deleteSlide(slideId, type) {
    if (!confirm('Apakah Anda yakin ingin menghapus slide ini?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/slides/${slideId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Gagal menghapus slide.');

        alert('Slide berhasil dihapus.');
        loadSlides(type);
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}
