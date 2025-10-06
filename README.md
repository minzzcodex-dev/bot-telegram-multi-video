:

🤖 Multi Video Telegram Bot

Bot Telegram dengan fitur dashboard web untuk mengelola upload video dan link berbasis integrasi grup/channel. Mendukung kontrol akses berdasarkan keanggotaan grup/channel dan dijalankan secara permanen menggunakan PM2.

📚 Table of Contents

Features

Installation

Configuration

Project Structure

Usage

Bot Testing

Running with PM2

Admin Panel

Full Workflow Test

Optional: HTTPS Setup

Maintenance

License

🚀 Features

Upload video atau link melalui web admin

Mendukung proteksi grup/channel (wajib join untuk akses)

Bot auto-reply video jika syarat keanggotaan terpenuhi

Link format: t.me/<bot>?start=...

Admin panel berbasis web

PM2 process management

🛠️ Installation
1️⃣ Update & Install Dasar
apt update && apt upgrade -y
apt install -y nodejs npm git unzip
npm install -g pm2

🔍 Cek Versi
node -v
npm -v
pm2 -v

2️⃣ Clone atau Masuk ke Proyek
Jika belum ada:
cd /root
git clone https://github.com/minzzcodex-dev/bot-telegram-multi-video.git
cd bot-telegram-multi-video

Jika sudah ada:
cd /root/multi-video-bot

⚙️ Configuration
3️⃣ Buat file .env
nano .env


Isi dengan:

BOT_TOKEN=ISI_TOKEN_BOT_KAMU
BOT_USERNAME=cek123123_bot
PORT=3000


Simpan dengan CTRL+X, tekan Y, lalu Enter.

📦 Install Dependency
4️⃣ Install NPM Packages
npm install

📁 Project Structure
5️⃣ Pastikan Struktur Folder

Gunakan:

ls -lah


Harus ada file dan folder berikut:

bot.js
server.js
package.json
.env
views/
data/
data-video/

▶️ Usage
6️⃣ Jalankan Manual Web Server
node server.js


Buka browser:

http://IP_VPS:3000


Akan muncul tampilan dashboard upload.

🧪 Bot Testing
7️⃣ Jalankan Bot Manual
node bot.js


Kirim perintah ke bot:

/getgroupid


Pastikan bot merespons dengan ID grup atau channel.

⚡ Running with PM2
8️⃣ Jalankan Bot & Server
pm2 start bot.js --name mediaboom-bot
pm2 start server.js --name mediaboom-admin
pm2 save
pm2 startup

🔍 Cek Status & Log
pm2 status
pm2 logs mediaboom-bot
pm2 logs mediaboom-admin

🌐 Admin Panel
9️⃣ Akses Panel Web

Buka di browser:

http://IP_VPS:3000

Fitur:

Upload video atau link

Tambah grup/channel wajib join

Hasil upload → t.me/<bot>?start=...

✅ Full Workflow Test
10️⃣ Langkah-langkah:

Tambahkan bot ke grup & channel sebagai admin

Kirim /getgroupid untuk dapatkan ID

Input ID & link ke dashboard admin

Upload video → dapat link

Kirim link ke user → klik → bot cek join → kirim video otomatis

🔐 Optional: HTTPS Setup
11️⃣ Menggunakan Nginx + Cloudflare

Install:

apt install nginx certbot python3-certbot-nginx -y


Set domain ke port 3000, lalu jalankan:

certbot --nginx -d domainkamu.com

🧰 Maintenance
12️⃣ Perintah Berguna
Lihat status semua proses:
pm2 list

Restart bot/server:
pm2 restart mediaboom-bot
pm2 restart mediaboom-admin

Hapus proses:
pm2 delete mediaboom-bot

📄 License

This project is licensed. Refer to the original repository for more details.
