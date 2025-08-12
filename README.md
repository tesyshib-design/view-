# Bot WhatsApp View-Once Bypass
## Fitur

  - Membuka media sekali-lihat (foto, video, dan audio).
  - Meneruskan media yang berhasil dibuka ke grup target yang spesifik.
  - Konfigurasi grup target yang dinamis melalui perintah di dalam WhatsApp.
  - Menyimpan ID grup target secara permanen di file `config.json`.
  - Menampilkan QR code di terminal untuk proses login.
  - Menyimpan sesi login agar tidak perlu scan QR berulang kali.

## Prasyarat

Sebelum memulai, pastikan sistem Anda (PC/VPS/WSL) memiliki:

  - **Node.js** (versi 18.x atau lebih baru direkomendasikan).
  - **npm** (biasanya sudah terinstal bersama Node.js).
  - **Terminal** atau Command Line (CMD, PowerShell, atau terminal di WSL/Linux).

## Instalasi & Setup

Ikuti langkah-langkah ini untuk menyiapkan bot dari awal.

**1. Siapkan Folder Proyek**
Buat sebuah folder baru di komputer Anda untuk menyimpan semua file bot.

```bash
mkdir bot-wa
cd bot-wa
```

**2. Buat File-File yang Dibutuhkan**
Di dalam folder `bot-wa`, buat dua file:

  * **`app.js`**: Untuk menempelkan kode utama bot.
  * **`config.json`**: Untuk menyimpan konfigurasi.

Isi file **`config.json`** dengan kode berikut:

```json
{
  "PREFIX": ".",
  "TARGET_GROUP_ID": ""
}
```

**3. Buka Terminal**
Buka terminal atau CMD Anda, lalu pastikan Anda berada di dalam direktori folder proyek yang baru saja dibuat.

**4. Instal Dependensi**
Jalankan perintah berikut untuk mengunduh semua library yang dibutuhkan oleh bot. Proses ini hanya perlu dilakukan sekali saat pertama kali setup.

```bash
npm install @whiskeysockets/baileys @hapi/boom pino qrcode-terminal
```

## Menjalankan Bot

1.  Pastikan Anda berada di direktori yang benar di terminal.
2.  Jalankan skrip dengan perintah:
    ```bash
    node app.js
    ```
3.  **Scan QR Code (Untuk Pertama Kali)**
    Saat pertama kali dijalankan, sebuah QR code akan muncul di terminal. Buka aplikasi WhatsApp di HP Anda, masuk ke **Setelan \> Perangkat Tertaut \> Tautkan Perangkat**, lalu scan QR code tersebut.
4.  **Sesi Tersimpan**
    Setelah berhasil login, sebuah folder bernama `session` akan dibuat secara otomatis. Selama folder ini ada, Anda tidak perlu scan QR lagi saat menjalankan bot di waktu berikutnya. Bot akan login secara otomatis.

## Konfigurasi dan Perintah

Setelah bot berjalan dan terhubung, Anda perlu mengaturnya.

#### Mengatur Grup Target

Ini adalah grup tempat semua media "sekali lihat" akan dikirim.

1.  Pastikan akun WhatsApp bot sudah menjadi anggota di grup yang ingin Anda jadikan target.
2.  Menggunakan akun pribadi Anda, masuk ke grup target tersebut.
3.  Kirim pesan `.setgroup` di dalam grup itu.
4.  Bot akan membalas jika berhasil dan secara otomatis menyimpan ID grup tersebut ke file `config.json`. Pengaturan ini akan permanen.

#### Membuka Media Sekali-Lihat

1.  Bot akan otomatis mendeteksi media sekali-lihat di **semua chat** (pribadi maupun grup) di mana bot menjadi anggota.
2.  Untuk memicu bot, **balas (reply)** atau **beri reaksi (react)** pada pesan media sekali-lihat tersebut.
3.  Media yang berhasil dibuka akan otomatis diteruskan ke grup target yang sudah Anda atur.

## Struktur File Proyek

Struktur folder proyek Anda akan terlihat seperti ini setelah bot dijalankan:

```
folder-bot/
├── app.js          # Skrip utama bot Anda
├── config.json     # File konfigurasi (prefix dan ID grup)
├── session/        # Folder yang dibuat otomatis untuk menyimpan info login
└── node_modules/   # Folder yang dibuat otomatis setelah 'npm install'
```
