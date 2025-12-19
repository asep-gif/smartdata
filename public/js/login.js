

document.addEventListener('DOMContentLoaded', () => {
    // Jika pengguna sudah login, langsung arahkan ke dashboard
    if (localStorage.getItem('authToken')) {
        window.location.href = 'index.html';
        return; // Hentikan eksekusi lebih lanjut
    }

    // Cek apakah ada email yang tersimpan untuk "Ingat Saya"
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
        document.getElementById('email').value = rememberedEmail;
        document.getElementById('remember-me').checked = true;
    }

    const loginForm = document.getElementById('login-form');
    loginForm.addEventListener('submit', handleLogin);

    // Logika untuk menampilkan/menyembunyikan password
    const togglePassword = document.getElementById('toggle-password');
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.getElementById('toggle-password-icon');

    togglePassword.addEventListener('click', function () {
        // Toggle tipe input
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);

        // Toggle ikon mata
        toggleIcon.classList.toggle('fa-eye');
        toggleIcon.classList.toggle('fa-eye-slash');
    });
});

async function handleLogin(event) {
    event.preventDefault();
    const form = event.target;
    const email = form.email.value;
    const password = form.password.value;
    const rememberMe = document.getElementById('remember-me').checked;

    const errorDiv = document.getElementById('login-error');
    const loginButton = document.getElementById('login-button');

    // Reset UI
    errorDiv.classList.add('hidden');
    loginButton.disabled = true;
    loginButton.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Memproses...';

    try {
        const response = await fetch(`${API_BASE_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            // If the response is not OK, try to get the error message from the body
            // but provide a default if it's not available or not in JSON format.
            const result = await response.json().catch(() => null);
            throw new Error(result.error || 'Terjadi kesalahan.');
        }

        const result = await response.json();
        localStorage.setItem('authToken', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));

        // Logika untuk "Ingat Saya"
        if (rememberMe) {
            localStorage.setItem('rememberedEmail', email);
        } else {
            localStorage.removeItem('rememberedEmail');
        }

        // Arahkan ke halaman utama
        window.location.href = 'index.html';

    } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.classList.remove('hidden');
        loginButton.disabled = false;
        loginButton.innerHTML = 'Masuk';
    }
}