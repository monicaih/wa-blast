// Install dulu:
// npm install whatsapp-web.js qrcode-terminal xlsx

const qrcode = require('qrcode-terminal');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const xlsx = require('xlsx');
const fs = require('fs');

// Inisialisasi client WhatsApp Web
const client = new Client({
    authStrategy: new LocalAuth(),
    //puppeteer: { headless: true } // kalau mau lihat browser ganti ke false
    puppeteer: {
        headless: false,
        executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" // path Chrome di PC
    }
});

// QR Code untuk login pertama kali
client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('Scan QR ini di WhatsApp untuk login.');
});

client.on('ready', async () => {
    console.log('WhatsApp sudah siap!');

    // Baca file Excel (misalnya daftar.xlsx)
    const file = xlsx.readFile('daftar.xlsx');
    const sheet = file.Sheets[file.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    // Siapkan gambar (contoh file.jpg di folder project)
    const media = MessageMedia.fromFilePath('./file.jpeg');

    // Asumsi: Kolom A = Nomor, Kolom B = Nama
    for (let i = 1; i < data.length; i++) {
        const noHp = data[i][0];
        const nama = data[i][1];

        if (noHp && nama) {
            const nomor = noHp.toString().replace(/^0/, '62') + '@c.us';

            const pesan = `Bapak/Ibu ${nama}, ayo semua jadi warga negara yang taat pajak. Silakan bisa mengunjungi Bapenda untuk bayar. Terima kasih`;

            try {
                // Kirim pesan teks
                await client.sendMessage(nomor, pesan);
                console.log(`Pesan terkirim ke ${nama} (${noHp})`);

                // Kirim gambar + caption
                await client.sendMessage(nomor, media, { caption: "Surat pemberitahuan pajak" });
                console.log(`Gambar terkirim ke ${nama} (${noHp})`);
            } catch (err) {
                console.error(`Gagal kirim ke ${nama} (${noHp}):`, err);
            }
        }
    }
});

client.initialize();
