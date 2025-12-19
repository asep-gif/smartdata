const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // 1. Buat transporter (objek yang akan mengirim email)
    // Gunakan variabel lingkungan untuk konfigurasi
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        // Untuk beberapa provider, Anda mungkin perlu mengaktifkan "less secure apps"
        // atau menggunakan OAuth2 jika keamanan lebih tinggi diperlukan.
        // secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
    });

    // 2. Definisikan opsi email
    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: options.to,
        subject: options.subject,
        text: options.text, // Versi plain text
        html: options.html, // Versi HTML
    };

    // 3. Kirim email
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.response);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        // Melempar error agar bisa ditangkap oleh pemanggil fungsi
        throw new Error('Gagal mengirim email. Silakan periksa konfigurasi server email Anda.');
    }
};

module.exports = sendEmail;
