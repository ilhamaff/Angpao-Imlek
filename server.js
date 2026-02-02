const express = require('express');
const mysql = require('mysql2');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();
const app = express(); // <--- BARIS INI HARUS ADA DI ATAS!

app.use(cors());
app.use(express.json());

// 1. Koneksi ke MySQL
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.error('Database konek GAGAL: ' + err.stack);
        return;
    }
    console.log('Berhasil terhubung ke Database MySQL XAMPP!');
});

// 2. Endpoint untuk Validasi Voucher (Taruh di bawah "const app")
app.post('/api/validate', (req, res) => {
    const { code } = req.body;

    const query = `
        SELECT v.code, v.status, r.reward_name 
        FROM vouchers v 
        JOIN rewards r ON v.reward_id = r.id 
        WHERE v.code = ?`;

    db.query(query, [code], (err, results) => {
        if (err) return res.status(500).json({ message: "Error Database" });
        
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: "Voucher tidak ditemukan!" });
        }

        const voucher = results[0];

        if (voucher.status === 'USED') {
            return res.status(400).json({ success: false, message: "Voucher sudah digunakan!" });
        }

        res.json({ success: true, reward: voucher.reward_name });
    });
});

// 3. Endpoint untuk Update Status Voucher jadi USED
app.post('/api/claim', (req, res) => {
    const { code } = req.body;
    db.query("UPDATE vouchers SET status = 'USED' WHERE code = ?", [code], (err) => {
        if (err) return res.status(500).json({ message: "Gagal klaim" });
        res.json({ success: true });
    });
});

// 4. Jalankan Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server lari di http://localhost:${PORT}`);
});

// Endpoint untuk melihat semua data voucher di Admin
app.get('/api/admin/vouchers', (req, res) => {
    // Kita hapus v.updated_at sementara untuk memastikan koneksi lancar
    const query = `
        SELECT v.code, v.status, r.reward_name 
        FROM vouchers v 
        JOIN rewards r ON v.reward_id = r.id`;

    db.query(query, (err, results) => {
        if (err) {
            console.error(err); // Ini akan memunculkan detail error di terminal VS Code
            return res.status(500).json({ message: "Gagal ambil data", error: err.message });
        }
        res.json(results);
    });
});
// Endpoint untuk menambah voucher baru
app.post('/api/admin/add-voucher', (req, res) => {
    const { code, reward_id } = req.body;
    
    if (!code || !reward_id) {
        return res.status(400).json({ success: false, message: "Data tidak lengkap" });
    }

    const query = "INSERT INTO vouchers (code, reward_id, status) VALUES (?, ?, 'READY')";
    
    db.query(query, [code.toUpperCase(), reward_id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: "Gagal menambah voucher (mungkin kode sudah ada)" });
        }
        res.json({ success: true, message: "Voucher berhasil ditambahkan!" });
    });
});