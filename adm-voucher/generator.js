const mysql = require('mysql2');
const dotenv = require('dotenv');
dotenv.config();

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

// Fungsi membuat kode acak (Contoh: CNY-A1B2C)
function generateRandomCode(length) {
    let result = 'CNY-';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

// Fungsi utama membuat 10 voucher sebagai percobaan
async function createVouchers(amount) {
    for (let i = 0; i < amount; i++) {
        const code = generateRandomCode(5);
        const expiredAt = '2026-02-28 23:59:59'; // Contoh expired akhir Februari
        
        // Kita set reward_id secara acak atau default dulu (misal ID 3 = Angpao 10rb)
        const query = "INSERT INTO vouchers (code, reward_id, expired_at) VALUES (?, ?, ?)";
        db.query(query, [code, 3, expiredAt], (err, res) => {
            if (err) console.log("Gagal buat voucher:", err.message);
            else console.log("Berhasil buat voucher: " + code);
        });
    }
}

createVouchers(10); // Kita buat 10 dulu buat tes