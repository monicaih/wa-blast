// Install dulu:
// npm install whatsapp-web.js qrcode-terminal xlsx

const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const xlsx = require('xlsx');

// Inisialisasi client WhatsApp Web
const client = new Client({
    authStrategy: new LocalAuth(), // simpan sesi login
    puppeteer: { headless: true } // ganti ke false kalau mau lihat browser terbuka
});

// QR Code untuk login pertama kali
client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('Scan QR ini di WhatsApp untuk login.');
});

client.on('ready', () => {
    console.log('WhatsApp sudah siap!');

    // Baca file Excel (misalnya daftar.xlsx)
    const file = xlsx.readFile('daftar.xlsx');
    const sheet = file.Sheets[file.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    // Asumsi: Kolom A = Nomor, Kolom B = Nama, Kolom C = Link wa.me
    for (let i = 1; i < data.length; i++) {
        const noHp = data[i][0];
        const nama = data[i][1];

        if (noHp && nama) {
            // Format nomor harus pakai kode negara, misal 62 untuk Indonesia
            const nomor = noHp.toString().replace(/^0/, '62') + '@c.us';

            // Pesan bisa langsung kita buat tanpa klik link wa.me
            const pesan = `Halo Bapak/Ibu ${nama}, anda belum bayar pajak. Silakan bisa mengunjungi Bapenda untuk bayar. Terima kasih`;

            client.sendMessage(nomor, pesan).then(() => {
                console.log(`Pesan terkirim ke ${nama} (${noHp})`);
            }).catch(err => {
                console.error(`Gagal kirim ke ${nama} (${noHp}):`, err);
            });
        }
    }
});

client.initialize();