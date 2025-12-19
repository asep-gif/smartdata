// --- E-BOOK & FLIPBOOK FUNCTIONS ---

// Inisialisasi worker untuk pdf.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

/**
 * Inisialisasi halaman E-Book dengan mengisi filter hotel.
 */
async function initEbookPage() {
    await populateHotelDropdown('ebook-hotel-filter', true);
}

// --- CORE FLIPBOOK FUNCTIONS ---

function updateZoomDisplay() {
    const container = document.getElementById('book-container');
    const label = document.getElementById('zoom-level');
    if(container && label) {
        container.style.transformOrigin = 'center center';
        container.style.transform = `scale(${currentZoom})`;
        label.textContent = `${Math.round(currentZoom * 100)}%`;
    }
}

function zoomIn() {
    if(currentZoom < 2.0) { // Max zoom 200%
        currentZoom += 0.1;
        updateZoomDisplay();
    }
}

function zoomOut() {
    if(currentZoom > 0.5) { // Min zoom 50%
        currentZoom -= 0.1;
        updateZoomDisplay();
    }
}

function resetZoom() {
    currentZoom = 1.0;
    updateZoomDisplay();
}

async function openBook(bookId, bookTitle) {
    const modal = document.getElementById('book-modal');
    const wrapper = document.getElementById('book-wrapper');
    let container = document.getElementById('book-container');
    const title = document.getElementById('modal-title');
    const loader = document.getElementById('pdf-loading');

    if (!container) {
        container = document.createElement('div');
        container.id = 'book-container';
        container.className = 'book-container shadow-2xl';
        wrapper.appendChild(container);
    }
    
    resetZoom();

    title.textContent = bookTitle;
    container.innerHTML = ''; 
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    loader.classList.remove('hidden'); 
    loader.classList.add('flex');

    try {
        const bookData = await fetchAPI(`/api/books/${bookId}`);

        if (!Array.isArray(bookData.file_paths)) {
            throw new Error('Format data file_paths tidak valid.');
        }
        const pdfUrls = bookData.file_paths;

        const firstPdfUrl = pdfUrls[0];
        const pdfDoc = await pdfjsLib.getDocument(firstPdfUrl).promise;
        const firstPage = await pdfDoc.getPage(1);
        const viewport = firstPage.getViewport({ scale: 1.0 });
        const firstPageDimensions = { width: viewport.width, height: viewport.height };

        await renderPdfToBookContainer(pdfUrls, container);

        initSimplePageFlip(container, firstPageDimensions);

    } catch (err) {
        console.error(err);
        alert("Gagal merender PDF: " + err.message);
        closeBook();
    } finally {
        loader.classList.add('hidden');
        loader.classList.remove('flex');
    }
}

async function renderPdfToBookContainer(pdfSourceList, container) {
    const pdfDocs = [];
    for (const source of pdfSourceList) {
        const doc = await pdfjsLib.getDocument(source).promise;
        pdfDocs.push(doc);
    }

    const totalPagesGlobal = pdfDocs.reduce((acc, doc) => acc + doc.numPages, 0);
    let currentGlobalPage = 0;

    for (const pdfDoc of pdfDocs) {
        for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
            currentGlobalPage++;
            const page = await pdfDoc.getPage(pageNum);
            
            const pageWrapper = document.createElement('div');
            
            const isFrontCover = (currentGlobalPage === 1);
            const isBackCover = (currentGlobalPage === totalPagesGlobal);
            
            pageWrapper.className = (isFrontCover || isBackCover) ? 'my-page --hardcover' : 'my-page';
            pageWrapper.setAttribute('data-density', (isFrontCover || isBackCover) ? 'hard' : 'soft');

            const canvas = document.createElement('canvas');
            canvas.className = 'pdf-canvas';
            const context = canvas.getContext('2d');

            const baseScale = 1.5; 
            const viewport = page.getViewport({ scale: baseScale });
            
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const renderContext = { canvasContext: context, viewport: viewport };
            
            await page.render(renderContext).promise;

            pageWrapper.appendChild(canvas);
            container.appendChild(pageWrapper);
        }
    }
}

function initSimplePageFlip(container, pageDimensions) {
    if (pageFlip) pageFlip.destroy();
    const isMobile = window.innerWidth < 768;

    const maxHeight = isMobile ? 420 : 600;
    const aspectRatio = pageDimensions.width / pageDimensions.height;
    let bookHeight = maxHeight;
    let bookWidth = bookHeight * aspectRatio;

    const maxWidth = isMobile ? 300 : 450;
    if (bookWidth > maxWidth) {
        bookWidth = maxWidth;
        bookHeight = bookWidth / aspectRatio;
    }

    pageFlip = new St.PageFlip(container, {
        width: bookWidth,
        height: bookHeight,
        size: 'stretch',
        showCover: true,
        maxShadowOpacity: 0.5,
        mobileScrollSupport: false
    });
    
    pageFlip.on('flip', (e) => {
        flipSound.currentTime = 0;
        flipSound.play().catch(error => console.log('Audio autoplay prevented:', error));
    });

    pageFlip.loadFromHTML(document.querySelectorAll('.my-page'));
}

function closeBook() {
    const modal = document.getElementById('book-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    if (pageFlip) {
        pageFlip.destroy();
        pageFlip = null;
    }
}

function bookNext() { if(pageFlip) pageFlip.flipNext(); }
function bookPrev() { if(pageFlip) pageFlip.flipPrev(); }


// --- UPLOAD & MERGE FUNCTIONS ---

function handleFileSelect(input) {
    const files = Array.from(input.files);
    const btn = document.getElementById('btn-convert');
    const list = document.getElementById('file-list');
    const label = document.getElementById('upload-label');
    const titleInput = document.getElementById('book-title-input');

    if (files.length > 0) {
        if (titleInput.value.trim() === '' && pdfUploadQueue.length === 0) {
            let defaultTitle = files[0].name.toLowerCase().endsWith('.pdf') ? files[0].name.slice(0, -4) : files[0].name;
            titleInput.value = defaultTitle;
        }

        files.forEach(file => {
            file.uniqueId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            pdfUploadQueue.push(file);

            const item = document.createElement('div');
            item.className = "flex items-center justify-between gap-2 bg-slate-100 p-2 rounded cursor-grab";
            item.setAttribute('data-id', file.uniqueId);
            item.innerHTML = `
                <div class="flex items-center gap-2 overflow-hidden">
                    <i class="fa-solid fa-file-pdf text-red-500 flex-shrink-0"></i>
                    <span class="truncate">${file.name}</span>
                </div>
                <i class="fa-solid fa-grip-vertical text-slate-400 flex-shrink-0"></i>
            `;
            list.appendChild(item);
        });

        label.textContent = `${pdfUploadQueue.length} file akan digabung`;
        btn.disabled = false;
        btn.classList.remove('bg-slate-300', 'cursor-not-allowed');
        btn.classList.add('bg-blue-600', 'hover:bg-blue-700');
    }
}

async function generatePdfThumbnail(pdfBuffer) {
    try {
        const loadingTask = pdfjsLib.getDocument(pdfBuffer.slice(0));
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);
        
        const viewport = page.getViewport({ scale: 0.3 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport: viewport }).promise;
        return canvas.toDataURL();
    } catch (e) {
        console.error("Error generating thumbnail", e);
        return null;
    }
}

async function processUploadQueue() {    
    const btn = document.getElementById('btn-convert');
    const titleInput = document.getElementById('book-title-input');
    let mergedTitle = titleInput.value.trim();

    if (pdfUploadQueue.length === 0) {
        alert("Pilih file PDF terlebih dahulu.");
        return;
    }
    if (mergedTitle === '') {
        alert("Judul buku tidak boleh kosong.");
        return;
    }

    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Menggabungkan...';
    btn.disabled = true;

    try {
        const firstFileBuffer = await pdfUploadQueue[0].arrayBuffer();
        const thumbUrl = await generatePdfThumbnail(firstFileBuffer);

        const formData = new FormData();
        formData.append('title', mergedTitle);

        const hotelId = document.getElementById('book-hotel-select').value;
        if (hotelId && hotelId !== 'public') {
            formData.append('hotel_id', hotelId);
        }

        if (thumbUrl) {
            formData.append('thumbnailData', thumbUrl);
        }
        pdfUploadQueue.forEach(file => {
            formData.append('pdfFiles', file);
        });

        const newBook = await fetchAPI('/api/books', {
            method: 'POST',
            body: formData
        });
        createBookCard(newBook.id, newBook.title, thumbUrl);

        alert(`Berhasil! Buku "${newBook.title}" telah dibuat.`);
        closeUploadModal();
        showPage('ebook');

    } catch (error) {
        console.error(error);
        alert("Terjadi kesalahan: " + error.message);
    } finally {
        btn.innerHTML = '<i class="fa-solid fa-object-group mr-2"></i> Gabung & Buat Buku';
        btn.classList.add('bg-slate-300', 'cursor-not-allowed');
        btn.classList.remove('bg-blue-600');
    }
}

function openUploadModal() {
    const modal = document.getElementById('upload-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    populateHotelDropdown('book-hotel-select', true);

    const fileListEl = document.getElementById('file-list');
    new Sortable(fileListEl, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        handle: '.fa-grip-vertical',
        onEnd: function (evt) {
            const newOrderIds = Array.from(fileListEl.children).map(item => item.getAttribute('data-id'));
            const queueMap = new Map(pdfUploadQueue.map(file => [file.uniqueId, file]));
            const newQueue = newOrderIds.map(id => queueMap.get(id));
            pdfUploadQueue = newQueue;
        }
    });
    if(window.innerWidth < 768) toggleSidebar(false);
}

function closeUploadModal() {
    const modal = document.getElementById('upload-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    pdfUploadQueue = [];
    document.getElementById('file-list').innerHTML = '';
    document.getElementById('pdf-input').value = '';
    document.getElementById('book-title-input').value = '';
    document.getElementById('upload-label').textContent = 'Klik untuk memilih file PDF';
}

async function deleteBook(event, bookId, element) {
    event.stopPropagation();
    
    if(confirm('Apakah Anda yakin ingin menghapus buku ini? Aksi ini tidak dapat dibatalkan.')) {
        try {
            await fetchAPI(`/api/books/${bookId}`, {
                method: 'DELETE'
            });

            element.style.opacity = '0';
            element.style.transform = 'scale(0.9)';
            setTimeout(() => element.remove(), 300);
        } catch (error) {
            console.error(error);
            alert('Terjadi kesalahan saat menghapus buku: ' + error.message);
        }
    }
}

async function loadBooksFromAPI() {
    const grid = document.getElementById('library-grid');
    grid.innerHTML = '<p class="col-span-full text-center p-4"><i class="fa-solid fa-circle-notch fa-spin"></i> Memuat E-Book...</p>';

    const hotelFilter = document.getElementById('ebook-hotel-filter');
    const selectedHotelId = hotelFilter.value;

    const params = new URLSearchParams();
    if (selectedHotelId && selectedHotelId !== 'public') {
        params.append('hotel_id', selectedHotelId);
    }
    try {
        const books = await fetchAPI(`/api/books?${params.toString()}`);
        grid.innerHTML = '';

        if (books.length === 0) {
            grid.innerHTML = '<p class="col-span-full text-center text-slate-500 p-8">Tidak ada E-Book yang ditemukan.</p>';
        } else {
            books.forEach(book => { 
                createBookCard(book.id, book.title, book.thumbnail_url); // PERBAIKAN: Gunakan URL yang sudah lengkap dari API
            });
        }
    } catch (error) {
        console.error("Gagal memuat buku dari API:", error);
        grid.innerHTML = `<p class="col-span-full text-center text-red-500 p-8">Gagal memuat E-Book: ${error.message}</p>`;
    }
}

function createBookCard(id, title, thumbUrl = null) {
    const grid = document.getElementById('library-grid');
    const div = document.createElement('div');
    div.className = "group cursor-pointer fade-in relative transition-all duration-300";
    div.onclick = () => openBook(id, title);

    const elementId = 'book-' + Math.random().toString(36).substr(2, 9);
    div.id = elementId;

    const deleteBtn = `
        <button onclick="deleteBook(event, ${id}, document.getElementById('${elementId}'))" class="delete-btn" title="Hapus Buku">
            <i class="fa-solid fa-trash-can"></i>
        </button>
    `;

    let cardContent = '';

    if (thumbUrl) {
        cardContent = `
            <div class="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">${deleteBtn}</div>
            <div class="rounded-lg shadow-md hover:-translate-y-1 hover:shadow-xl transition-all duration-300 overflow-hidden relative bg-slate-200" title="${title}">
                <img src="${thumbUrl}" class="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105">
                <div class="absolute inset-x-0 bottom-0 bg-black/70 p-2 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex items-center justify-center">
                    <p class="text-white text-xs text-center truncate px-2">${title}</p>
                </div>
            </div>
        `;
    } else {
        cardContent = `
            <div class="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">${deleteBtn}</div>
            <div class="bg-white rounded-r-lg rounded-l-sm shadow-md border-l-4 border-purple-500 p-4 hover:-translate-y-2 transition-transform duration-300 h-64 flex flex-col justify-between relative overflow-hidden">
                <div class="absolute right-0 top-0 w-24 h-24 bg-purple-50 rounded-bl-full -mr-4 -mt-4 z-0"></div>
                <div class="z-10">
                    <h3 class="font-serif font-bold text-lg text-slate-800 leading-tight mb-2 break-words line-clamp-3">${title}</h3>
                    <p class="text-xs text-slate-500 uppercase tracking-widest">Merged E-Book</p>
                </div>
                <div class="z-10 flex justify-between items-end">
                    <span class="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-1 rounded">Gabungan</span>
                    <i class="fa-solid fa-book-open text-slate-300 group-hover:text-purple-500 transition-colors text-2xl"></i>
                </div>
            </div>
        `;
    }

    div.innerHTML = cardContent;
    grid.insertBefore(div, grid.children[0]);
}

function searchBooks() {
    const searchTerm = document.getElementById('search-book-input').value.toLowerCase();
    const grid = document.getElementById('library-grid');
    const books = grid.getElementsByClassName('group');

    for (let i = 0; i < books.length; i++) {
        const bookCard = books[i];
        let title = '';

        const thumbImg = bookCard.querySelector('img[title]');
        if (thumbImg) {
            title = thumbImg.getAttribute('title').toLowerCase();
        } else {
            const titleElement = bookCard.querySelector('h3');
            if (titleElement) {
                title = titleElement.textContent.toLowerCase();
            }
        }

        if (title.includes(searchTerm)) {
            bookCard.style.display = '';
        } else {
            bookCard.style.display = 'none';
        }
    }
}
