// PERBAIKAN: Deklarasikan variabel yang akan diakses secara global di luar DOMContentLoaded
let replyModal;
let replyForm;

document.addEventListener('DOMContentLoaded', () => {
    const page = document.getElementById('page-guest-review-replies');
    if (!page) return;

    // PERBAIKAN: Inisialisasi variabel di dalam DOMContentLoaded
    replyModal = document.getElementById('reply-review-modal');
    replyForm = document.getElementById('reply-review-form');

    // --- Element Selectors ---
    const hotelFilter = document.getElementById('review-replies-hotel-filter');
    const ratingFilter = document.getElementById('review-replies-rating-filter');
    const statusFilter = document.getElementById('review-replies-status-filter');
    const startDateInput = document.getElementById('review-replies-start-date');
    const endDateInput = document.getElementById('review-replies-end-date');
    const applyFilterBtn = document.getElementById('review-replies-filter-apply-btn');
    const resetFilterBtn = document.getElementById('review-replies-filter-reset-btn');
    const reviewListContainer = document.getElementById('review-replies-list');
    const placeholder = document.getElementById('review-replies-placeholder');
    const paginationInfo = document.getElementById('review-replies-pagination-info');
    const paginationControls = document.getElementById('review-replies-pagination-controls');

    let currentPage = 1;
    let totalPages = 1;
    let isInitialized = false; // Flag untuk memastikan inisialisasi hanya berjalan sekali

    // --- Functions ---

    const loadHotelsForFilter = async () => {
        try {
            const hotels = await fetchAPI('/api/hotels');
            hotelFilter.innerHTML = '<option value="all">Semua Hotel</option>';
            hotels.forEach(hotel => {
                const option = document.createElement('option');
                option.value = hotel.id;
                option.textContent = hotel.name;
                hotelFilter.appendChild(option);
            });
        } catch (error) {
            console.error('Gagal memuat hotel untuk filter:', error);
            hotelFilter.innerHTML = '<option value="all">Gagal memuat hotel</option>';
        }
    };

    const fetchAndRenderReviews = async (pageNumber = 1) => {
        reviewListContainer.innerHTML = '';
        const loadingRow = `<tr><td colspan="9" class="text-center p-8"><div class="flex justify-center items-center gap-3"><i class="fa-solid fa-circle-notch fa-spin text-2xl text-blue-500"></i><span>Memuat ulasan...</span></div></td></tr>`;
        reviewListContainer.innerHTML = loadingRow;

        const params = new URLSearchParams({
            page: pageNumber, // PERBAIKAN: Gunakan pageNumber dari argumen fungsi
            limit: 5, // Tampilkan 5 ulasan per halaman
            hotel_id: hotelFilter.value,
            rating: ratingFilter.value,
            status: statusFilter.value,
            start_date: startDateInput.value,
            end_date: endDateInput.value,
        });

        try {
            const data = await fetchAPI(`/api/reviews?${params.toString()}`);
            
            reviewListContainer.innerHTML = ''; // Kosongkan lagi setelah fetch berhasil

            if (data.reviews && data.reviews.length > 0) {
                data.reviews.forEach(review => {
                    const reviewRow = createReviewRow(review);
                    reviewListContainer.appendChild(reviewRow); // PERBAIKAN: Gunakan reviewListContainer
                });
            } else {
                const emptyRow = `<tr><td colspan="9" class="text-center p-8"><div class="flex flex-col items-center gap-3"><i class="fa-solid fa-comment-slash text-4xl text-slate-400"></i><span>Tidak ada ulasan yang cocok dengan filter Anda.</span></div></td></tr>`;
                reviewListContainer.innerHTML = emptyRow;
            }

            // Update pagination
            currentPage = data.currentPage;
            totalPages = data.totalPages;
            renderPagination(data.totalReviews);

        } catch (error) {
            console.error('Gagal mengambil data ulasan:', error);
            const errorRow = `<tr><td colspan="9" class="text-center p-8 text-red-500"><div class="flex flex-col items-center gap-3"><i class="fa-solid fa-exclamation-triangle text-4xl"></i><span>Gagal mengambil data ulasan. Silakan coba lagi.</span></div></td></tr>`;
            reviewListContainer.innerHTML = errorRow;
        }
    };

    const createReviewRow = (review) => {
        const row = document.createElement('tr');
        row.className = 'bg-white border-b hover:bg-slate-50';
        row.id = `review-row-${review.id}`;

        // BARU: Format tanggal penggunaan voucher
        const voucherUsedDate = review.voucher_used_at 
            ? new Date(review.voucher_used_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) 
            : '-';

        let statusBadge = '';
        let actionButtons = '';

        switch (review.status) {
            case 'pending':
                statusBadge = '<span class="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800"><i class="fa-solid fa-hourglass-half mr-1.5"></i> Pending</span>';
                actionButtons = `
                    <button onclick="handleApproveReview('${review.id}')" class="text-green-600 hover:text-green-800" title="Approve">
                        <i class="fa-solid fa-check-circle"></i>
                    </button>
                    <button onclick="handleRejectReview('${review.id}')" class="text-orange-600 hover:text-orange-800" title="Reject">
                        <i class="fa-solid fa-times-circle"></i>
                    </button>
                `;
                break;
            case 'approved':
                statusBadge = review.reply_text
                    ? '<span class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800"><i class="fa-solid fa-check-circle mr-1.5"></i> Dibalas</span>'
                    : '<span class="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"><i class="fa-solid fa-thumbs-up mr-1.5"></i> Approved</span>';
                actionButtons = review.reply_text
                    ? `<button onclick="openReplyModal(this)" data-review='${JSON.stringify(review)}' class="text-indigo-600 hover:text-indigo-800" title="Edit Balasan"><i class="fa-solid fa-pen-to-square"></i></button>` : `<button onclick="openReplyModal(this)" data-review='${JSON.stringify(review)}' class="text-blue-600 hover:text-blue-800" title="Balas"><i class="fa-solid fa-reply"></i></button>`;
                break;
            case 'rejected':
                statusBadge = '<span class="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800"><i class="fa-solid fa-ban mr-1.5"></i> Rejected</span>';
                actionButtons = ''; // Tidak ada aksi untuk yang ditolak selain hapus
                break;
            default:
                statusBadge = `<span class="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">${review.status}</span>`;
        }
        
        row.innerHTML = `
            <td class="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">
                ${review.guest_name}
                <p class="font-normal text-slate-500">Kamar ${review.room_number || '-'}</p>
            </td>
            <td class="px-6 py-4">${review.hotel_name}</td>
            <td class="px-6 py-4 whitespace-nowrap">${review.checkin_date ? new Date(review.checkin_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap">${review.voucher_number || '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap">${voucherUsedDate}</td>
            <td class="px-6 py-4 text-center whitespace-nowrap" title="Rating: ${review.rating || '-'}/5">
                ${review.rating ? `
                    <div>
                        <span class="font-semibold text-slate-700">${review.rating}</span><span class="text-slate-400">/5</span>
                    </div>
                    <div class="mt-1">${generateStarRating(review.rating)}</div>
                ` : '<span class="text-slate-400">-</span>'}
            </td>
            <td class="px-6 py-4 max-w-xs truncate" title="${review.comment || ''}">${review.comment || '<i>Tidak ada komentar.</i>'}</td>
            <td class="px-6 py-4 text-center">
                ${review.media && review.media.length > 0 ? `<a href="${review.media[0].file_path}" target="_blank" class="block w-12 h-12 mx-auto rounded-md overflow-hidden border border-slate-200 hover:border-blue-500 transition-all"><img src="${review.media[0].file_path}" alt="Review Photo" class="w-full h-full object-cover"></a>` : `<span class="text-slate-400 text-xs">N/A</span>`}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">${new Date(review.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
            <td class="px-6 py-4 text-center">${statusBadge}</td>
            <td class="px-6 py-4 text-center">
                <div class="flex justify-center items-center gap-3">
                    ${actionButtons}
                    <button onclick="handleDeleteReview('${review.id}')" class="text-red-600 hover:text-red-800" title="Hapus Ulasan">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </td>
        `;

        return row;
    };

    /**
     * BARU: Fungsi untuk membuat HTML bintang rating.
     * Ini memisahkan logika dari `createReviewRow` untuk kejelasan.
     */
    const generateStarRating = (rating) => {
        let starsHtml = '';
        const numericRating = parseFloat(rating) || 0;
        const fullStars = Math.floor(numericRating);
        const hasHalfStar = numericRating % 1 !== 0;

        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                starsHtml += '<i class="fas fa-star text-amber-400"></i>'; // Bintang penuh
            } else if (i === fullStars && hasHalfStar) {
                starsHtml += '<i class="fas fa-star-half-alt text-amber-400"></i>'; // Bintang setengah
            } else {
                starsHtml += '<i class="far fa-star text-slate-300"></i>'; // Bintang kosong
            }
        }
        return starsHtml;
    };

    /**
     * BARU: Fungsi untuk menangani persetujuan (approve) ulasan.
     */
    window.handleApproveReview = async (reviewId) => {
        if (!confirm('Anda yakin ingin menyetujui ulasan ini?')) return;
        try {
            const result = await fetchAPI(`/api/reviews/${reviewId}/approve`, { method: 'PUT' });
            showToast(result.message, 'success');
            // Ganti baris yang ada dengan data yang diperbarui dari server
            const oldRow = document.getElementById(`review-row-${reviewId}`);
            if (oldRow) {
                const newRow = createReviewRow(result.review);
                oldRow.replaceWith(newRow);
            }
        } catch (error) {
            showToast(error.message || 'Gagal menyetujui ulasan.', 'error');
        }
    };

    /**
     * BARU: Fungsi untuk menangani penolakan (reject) ulasan.
     */
    window.handleRejectReview = async (reviewId) => {
        if (!confirm('Anda yakin ingin menolak ulasan ini?')) return;
        try {
            const result = await fetchAPI(`/api/reviews/${reviewId}/reject`, { method: 'PUT' });
            showToast(result.message, 'success');
            const oldRow = document.getElementById(`review-row-${reviewId}`);
            if (oldRow) {
                const newRow = createReviewRow(result.review);
                oldRow.replaceWith(newRow);
            }
        } catch (error) {
            showToast(error.message || 'Gagal menolak ulasan.', 'error');
        }
    };

    /**
     * BARU: Menangani penghapusan ulasan.
     * Ditempelkan ke window agar bisa diakses dari onclick.
     */
    window.handleDeleteReview = async (reviewId) => {
        // Gunakan konfirmasi yang lebih baik jika SweetAlert2 tersedia, jika tidak, gunakan confirm() bawaan.
        const confirmation = typeof Swal !== 'undefined'
            ? await Swal.fire({
                title: 'Anda Yakin?',
                text: "Ulasan ini akan dihapus secara permanen dan tidak dapat dibatalkan.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Ya, hapus!',
                cancelButtonText: 'Batal'
            })
            : { isConfirmed: confirm('Apakah Anda yakin ingin menghapus ulasan ini? Aksi ini tidak dapat dibatalkan.') };

        if (!confirmation.isConfirmed) return;

        try {
            await fetchAPI(`/api/reviews/${reviewId}`, { method: 'DELETE' });
            showToast('Ulasan berhasil dihapus.', 'success');
            fetchAndRenderReviews(currentPage); // Muat ulang halaman saat ini untuk memperbarui data dan paginasi.
        } catch (error) {
            showToast(error.message || 'Gagal menghapus ulasan.', 'error');
        }
    };

    window.openReplyModal = (button) => {
        const review = JSON.parse(button.dataset.review);
        
        document.getElementById('modal-review-guest-name').textContent = `${review.guest_name} - Kamar ${review.room_number || '-'}`;
        document.getElementById('modal-review-rating').innerHTML = generateStarRating(review.rating);
        document.getElementById('modal-review-date').textContent = new Date(review.created_at).toLocaleString('id-ID');
        document.getElementById('modal-review-voucher-number').textContent = review.voucher_number || '-';
        document.getElementById('modal-review-comment').textContent = review.comment || 'Tidak ada komentar.';
        document.getElementById('modal-review-id').value = review.id;

        // BARU: Tampilkan email tamu
        document.getElementById('modal-guest-email').textContent = review.guest_email || '-';

        // PERUBAHAN: Isi textarea jika ini adalah mode update/edit
        const replyTextarea = document.getElementById('modal-reply-text');
        replyTextarea.value = review.reply_text || '';

        // BARU: Kosongkan input BCC setiap kali modal dibuka
        const bccInput = document.getElementById('modal-bcc-email');
        if (bccInput) {
            bccInput.value = '';
        }

        replyModal.classList.remove('hidden');
        replyModal.classList.add('flex');
        document.getElementById('modal-reply-text').focus();
    };

    window.closeReplyModal = () => {
        replyModal.classList.add('hidden');
        replyModal.classList.remove('flex');
    };

    const handleModalReplySubmit = async (e) => {
        e.preventDefault();
        const button = replyForm.querySelector('button[type="submit"]');
        const originalButtonText = button.innerHTML;
        const reviewId = document.getElementById('modal-review-id').value;

        button.disabled = true;
        button.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Mengirim...';

        const formData = new FormData(replyForm);
        const replyText = formData.get('reply_text');
        const bccInput = document.getElementById('modal-bcc-email');
        const bccEmail = bccInput ? bccInput.value : null; // Ambil nilai BCC

        const requestBody = { reply_text: replyText };
        if (bccEmail) {
            requestBody.bccEmail = bccEmail; // Hanya tambahkan jika ada nilai
        }

        try {
            const result = await fetchAPI(`/api/reviews/${reviewId}/reply`, {
                method: 'POST',
                body: requestBody,
            });

            // Refresh only this card
            const updatedRow = createReviewRow(result.review);
            const oldRow = document.getElementById(`review-row-${reviewId}`);
            if (oldRow) {
                oldRow.replaceWith(updatedRow);
            }
            
            showToast('Balasan berhasil disimpan!');
            closeReplyModal();

        } catch (error) {
            console.error('Gagal mengirim balasan:', error);
            showToast('Gagal mengirim balasan: ' + error.message, 'error');
        } finally {
            // Selalu kembalikan tombol ke keadaan semula
            button.disabled = false;
            button.innerHTML = originalButtonText;
        }
    };

    const renderPagination = (totalItems) => {
        paginationInfo.innerHTML = '';
        paginationControls.innerHTML = '';

        if (totalItems === 0) return;

        const limit = 5;
        const startItem = (currentPage - 1) * limit + 1;
        const endItem = Math.min(currentPage * limit, totalItems);

        paginationInfo.textContent = `Menampilkan ${startItem} - ${endItem} dari ${totalItems} ulasan`;

        const prevButton = document.createElement('button');
        prevButton.innerHTML = `<i class="fa-solid fa-chevron-left"></i>`;
        prevButton.className = 'relative inline-flex items-center rounded-l-md px-3 py-2 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed';
        prevButton.disabled = currentPage === 1;
        prevButton.onclick = () => fetchAndRenderReviews(currentPage - 1);

        const nextButton = document.createElement('button');
        nextButton.innerHTML = `<i class="fa-solid fa-chevron-right"></i>`;
        nextButton.className = 'relative inline-flex items-center rounded-r-md px-3 py-2 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed';
        nextButton.disabled = currentPage === totalPages;
        nextButton.onclick = () => fetchAndRenderReviews(currentPage + 1);

        paginationControls.appendChild(prevButton);
        paginationControls.appendChild(nextButton);
    };

    // --- Event Listeners ---

    applyFilterBtn.addEventListener('click', () => fetchAndRenderReviews(1));

    resetFilterBtn.addEventListener('click', () => {
        hotelFilter.value = 'all';
        ratingFilter.value = 'all';
        statusFilter.value = 'all'; // Default kembali ke semua
        startDateInput.value = '';
        endDateInput.value = '';
        fetchAndRenderReviews(1);
    });

    replyForm.addEventListener('submit', handleModalReplySubmit);

    // --- Inisialisasi ---

    // Fungsi inisialisasi yang dipanggil oleh ui.js
    window.initGuestReviewRepliesPage = () => {
        // Gunakan flag untuk memastikan inisialisasi (memuat filter hotel dan ulasan pertama kali)
        // hanya berjalan sekali untuk mencegah duplikasi data saat navigasi.
        if (isInitialized) {
            // Jika sudah diinisialisasi, cukup muat ulang data ulasan
            fetchAndRenderReviews(1);
            return;
        }
        isInitialized = true;
        
        statusFilter.value = 'all'; // Set default ke 'semua' saat halaman dimuat

        loadHotelsForFilter();
        fetchAndRenderReviews();
    };
});