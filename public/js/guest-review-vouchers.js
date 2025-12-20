// This would be in public/js/guest-review-vouchers.js
document.addEventListener('DOMContentLoaded', () => {
    // Check if the user is on the voucher page
    if (window.location.hash === '#guest-review-vouchers') {
        initVoucherUsePage();
    }
});

// Listen for hash changes to initialize the page
window.addEventListener('hashchange', () => {
    if (window.location.hash === '#guest-review-vouchers') {
        initVoucherUsePage();
    }
});

let voucherUseCurrentPage = 1;
const VOUCHER_USE_LIMIT = 15;

function initVoucherUsePage() {
    const hotelFilter = document.getElementById('voucher-use-hotel-filter');
    const statusFilter = document.getElementById('voucher-use-status-filter');
    const searchInput = document.getElementById('voucher-use-search-input');
    
    // Populate hotel filter
    populateHotelFilterForVouchers(hotelFilter);

    // Add event listeners
    hotelFilter.addEventListener('change', () => { voucherUseCurrentPage = 1; loadVouchers(); });
    statusFilter.addEventListener('change', () => { voucherUseCurrentPage = 1; loadVouchers(); });
    
    let searchTimeout;
    searchInput.addEventListener('keyup', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            voucherUseCurrentPage = 1;
            loadVouchers();
        }, 500); // Debounce search
    });

    // Handle form submission for verification
    const verifyForm = document.getElementById('verify-voucher-form');
    verifyForm.addEventListener('submit', handleVerifyVoucher);

    // Initial load
    loadVouchers();
}

async function loadVouchers() {
    const hotelId = document.getElementById('voucher-use-hotel-filter').value;
    const status = document.getElementById('voucher-use-status-filter').value;
    const search = document.getElementById('voucher-use-search-input').value;
    const tableBody = document.getElementById('voucher-use-list-body');

    showLoading(tableBody, 6);

    try {
        const params = new URLSearchParams({ hotel_id: hotelId, status: status, search: search, page: voucherUseCurrentPage, limit: VOUCHER_USE_LIMIT });
        const response = await fetchAPI(`/api/reviews/vouchers?${params.toString()}`);
        
        tableBody.innerHTML = ''; // Clear loading state

        if (response.data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" class="text-center p-8 text-slate-500">Tidak ada voucher yang cocok dengan filter.</td></tr>`;
            updateVoucherPagination(null);
            return;
        }

        response.data.forEach(voucher => {
            const isUsed = !!voucher.voucher_used_at;
            const statusClass = isUsed ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800';
            const statusText = isUsed ? `Used ${new Date(voucher.voucher_used_at).toLocaleDateString('id-ID')}` : 'Tersedia';

            const tr = document.createElement('tr');
            tr.className = 'bg-white border-b';
            tr.innerHTML = `
                <td class="px-6 py-4 font-medium text-slate-900">${voucher.guest_name}</td>
                <td class="px-6 py-4">${voucher.hotel_name}</td>
                <td class="px-6 py-4 font-mono">${voucher.voucher_number}</td>
                <td class="px-6 py-4">${new Date(voucher.created_at).toLocaleDateString('id-ID')}</td>
                <td class="px-6 py-4 text-center"><span class="px-2 py-1 text-xs font-semibold rounded-full ${statusClass}">${statusText}</span></td>
                <td class="px-6 py-4 text-center">
                    <button onclick="openVerifyVoucherModal('${voucher.id}', '${voucher.voucher_number}', '${voucher.guest_name}')" class="font-medium text-blue-600 hover:underline ${isUsed ? 'opacity-50 cursor-not-allowed' : ''}" ${isUsed ? 'disabled' : ''}>Verifikasi</button>
                </td>
            `;
            tableBody.appendChild(tr);
        });

        updateVoucherPagination(response.pagination);

    } catch (error) {
        console.error('Error loading vouchers:', error);
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center p-8 text-red-500">Gagal memuat data voucher.</td></tr>`;
        updateVoucherPagination(null);
    }
}

function updateVoucherPagination(pagination) {
    const paginationInfo = document.getElementById('voucher-use-pagination-info');
    const paginationControls = document.getElementById('voucher-use-pagination-controls');
    if (!pagination || pagination.totalItems === 0) { paginationInfo.innerHTML = ''; paginationControls.innerHTML = ''; return; }
    const { totalItems, currentPage, totalPages, limit } = pagination;
    const startItem = (currentPage - 1) * limit + 1;
    const endItem = Math.min(startItem + limit - 1, totalItems);
    paginationInfo.innerHTML = `Menampilkan <span class="font-medium">${startItem}</span> - <span class="font-medium">${endItem}</span> dari <span class="font-medium">${totalItems}</span> hasil`;
    let controlsHtml = '';
    if (currentPage > 1) { controlsHtml += `<button onclick="changeVoucherPage(${currentPage - 1})" class="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0"><span class="sr-only">Previous</span><i class="fa-solid fa-chevron-left h-5 w-5"></i></button>`; }
    if (currentPage < totalPages) { controlsHtml += `<button onclick="changeVoucherPage(${currentPage + 1})" class="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0"><span class="sr-only">Next</span><i class="fa-solid fa-chevron-right h-5 w-5"></i></button>`; }
    paginationControls.innerHTML = `<nav class="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">${controlsHtml}</nav>`;
}

function changeVoucherPage(page) { voucherUseCurrentPage = page; loadVouchers(); }

function openVerifyVoucherModal(reviewId, voucherCode, guestName) {
    const modal = document.getElementById('verify-voucher-modal');
    document.getElementById('modal-voucher-review-id').value = reviewId;
    document.getElementById('modal-voucher-code').textContent = voucherCode;
    document.getElementById('modal-voucher-guest-name').textContent = guestName;
    document.getElementById('modal-voucher-guest-name-used').value = guestName;
    document.getElementById('modal-voucher-use-date').valueAsDate = new Date();
    modal.classList.remove('hidden'); modal.classList.add('flex');
}

function closeVerifyVoucherModal() { const modal = document.getElementById('verify-voucher-modal'); modal.classList.add('hidden'); modal.classList.remove('flex'); document.getElementById('verify-voucher-form').reset(); }

async function handleVerifyVoucher(event) {
    event.preventDefault();
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonHtml = submitButton.innerHTML;
    const data = { reviewId: document.getElementById('modal-voucher-review-id').value, use_date: document.getElementById('modal-voucher-use-date').value, guest_name_used: document.getElementById('modal-voucher-guest-name-used').value, room_number: document.getElementById('modal-voucher-room-number').value, folio_number: document.getElementById('modal-voucher-folio-number').value, };
    setLoading(submitButton, 'Memverifikasi...');
    try {
        await fetchAPI('/api/reviews/vouchers/use', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        showToast('Voucher berhasil digunakan!');
        closeVerifyVoucherModal();
        loadVouchers();
    } catch (error) { showToast(`Error: ${error.message}`, 'error'); } finally { resetLoading(submitButton, originalButtonHtml); }
}

async function populateHotelFilterForVouchers(selectElement) {
    if (!selectElement) return;
    try {
        const hotels = await fetchAPI('/api/hotels');
        selectElement.innerHTML = '<option value="all">Semua Hotel</option>';
        hotels.forEach(hotel => { const option = document.createElement('option'); option.value = hotel.id; option.textContent = hotel.name; selectElement.appendChild(option); });
    } catch (error) { console.error('Failed to populate hotel filter:', error); selectElement.innerHTML = '<option value="">Gagal memuat hotel</option>'; }
}