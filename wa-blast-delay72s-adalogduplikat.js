// Install dulu:
// npm install whatsapp-web.js qrcode-terminal xlsx
// Nomor yang duplikat tetap keproses antrian kirim pesan, jika sudah pernah dikirim nomor tidak kekirim lagi, nomor duplikat masuk log, namun proses lebih lama

const qrcode = require('qrcode-terminal');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const xlsx = require('xlsx');
const fs = require('fs');

// Inisialisasi client WhatsApp Web
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: false,
        executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" // sesuaikan path Chrome
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

    // Siapkan gambar (contoh file.jpeg di folder project)
    const media = MessageMedia.fromFilePath('./file.jpeg');

    let logData = [];
    let seen = new Set();

    // Kirim pesan dengan pengecekan duplikat
    const kirimPesan = async (nomor, nama, index) => {
        if (seen.has(nomor)) {
            console.log(`[${index + 1}] Duplikat, tidak dikirim ke ${nama} (${nomor})`);
            logData.push(`${nomor},${nama},DUPLIKAT`);
            return;
        }

        seen.add(nomor);

        const nomorWA = nomor + "@c.us";
        const pesan = `Halo Bapak/Ibu ${nama}, anda belum bayar pajak. Silakan bisa mengunjungi Bapenda untuk bayar. Terima kasih`;

        try {
            await client.sendMessage(nomorWA, pesan);
            console.log(`[${index + 1}] Pesan terkirim ke ${nama} (${nomor})`);

            await client.sendMessage(nomorWA, media, { caption: "Surat pemberitahuan pajak" });
            console.log(`[${index + 1}] Gambar terkirim ke ${nama} (${nomor})`);

            logData.push(`${nomor},${nama},OKE`);
        } catch (err) {
            console.error(`[${index + 1}] Gagal kirim ke ${nama} (${nomor}):`, err);
            logData.push(`${nomor},${nama},GAGAL`);
        }
    };

    // Looping semua baris Excel
    for (let i = 1; i < data.length; i++) {
        const noHp = data[i][0];
        const nama = data[i][1];

        if (noHp && nama) {
            let nomor = noHp.toString().replace(/^0/, '62'); // ubah 08... jadi 628...
            await kirimPesan(nomor, nama, i);

            // Delay 72 detik antar pesan (5 chat per 6 menit)
            if (i < data.length - 1) {
                console.log(`Menunggu 72 detik sebelum kirim berikutnya...`);
                await new Promise(resolve => setTimeout(resolve, 72 * 1000));
            }
        }
    }

    // Simpan log setelah semua selesai
    fs.writeFileSync("log.txt", logData.join("\n"), "utf8");
    console.log("Selesai! Hasil log disimpan di log.txt");
});

client.initialize();
