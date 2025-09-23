// Install dulu:
// npm install whatsapp-web.js qrcode-terminal xlsx
// Nomor yang duplikat di hapus sejak awal, proses lebih cepat, namun baris duplikat tidak masuk log

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

    // Siapkan gambar (contoh file.jpg di folder project)
    const media = MessageMedia.fromFilePath('./file.jpeg');

    // Buat daftar unik (hapus duplikat berdasarkan nomor HP)
    let daftar = [];
    let seen = new Set();

    for (let i = 1; i < data.length; i++) {
        const noHp = data[i][0];
        const nama = data[i][1];

        if (noHp && nama) {
            let nomor = noHp.toString().replace(/^0/, '62'); // ubah 08... jadi 628...
            if (!seen.has(nomor)) {
                seen.add(nomor);
                daftar.push({ nomor, nama });
            }
        }
    }

    console.log(`Total unik nomor: ${daftar.length}`);

    let logData = [];

    // Fungsi kirim pesan dengan delay
    const kirimPesan = async (item, index) => {
        const nomorWA = item.nomor + "@c.us";
        const pesan = `Halo Bapak/Ibu ${item.nama}, anda belum bayar pajak. Silakan bisa mengunjungi Bapenda untuk bayar. Terima kasih`;

        try {
            await client.sendMessage(nomorWA, pesan);
            console.log(`[${index + 1}] Pesan terkirim ke ${item.nama} (${item.nomor})`);

            await client.sendMessage(nomorWA, media, { caption: "Surat pemberitahuan pajak" });
            console.log(`[${index + 1}] Gambar terkirim ke ${item.nama} (${item.nomor})`);

            logData.push(`${item.nomor},${item.nama},OKE`);
        } catch (err) {
            console.error(`[${index + 1}] Gagal kirim ke ${item.nama} (${item.nomor}):`, err);
            logData.push(`${item.nomor},${item.nama},GAGAL`);
        }
    };

    // Kirim pesan satu per satu dengan jeda
    for (let i = 0; i < daftar.length; i++) {
        await kirimPesan(daftar[i], i);

        // Delay 72 detik antar pesan (5 chat per 6 menit)
        if (i < daftar.length - 1) {
            console.log(`Menunggu 72 detik sebelum kirim berikutnya...`);
            await new Promise(resolve => setTimeout(resolve, 72 * 1000));
        }
    }

    // Simpan log setelah semua selesai
    fs.writeFileSync("log.txt", logData.join("\n"), "utf8");
    console.log("Selesai! Hasil log disimpan di log.txt");
});

client.initialize();
