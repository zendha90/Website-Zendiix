# 🚀 Panduan Penyebaran (Deployment Guide) Zendiix ke cPanel

Panduan ini menjelaskan langkah demi langkah untuk melakukan deploy aplikasi full-stack Zendiix (Express + Vite + MySQL) ke cPanel hosting Anda, menggunakan fitur **Setup Node.js App**.

Karena aplikasi dan database MySQL akan berjalan berdampingan pada server cPanel Anda, koneksi database akan menjadi sangat cepat dan aman tanpa memerlukan konfigurasi IP Jarak Jauh (Remote MySQL) di cPanel!

---

## 📋 Prasyarat Sebelum Deploy
1. **Akses cPanel**: Pastikan Anda memiliki akses masuk ke cPanel hosting Anda.
2. **Fitur Setup Node.js App**: Pastikan hosting Anda memiliki menu **Setup Node.js App** (Jika tidak ada, silakan minta pihak hosting untuk mengaktifkannya).
3. **Database MySQL**: Gunakan nama database, pengguna, dan kata sandi yang sudah Anda buat di cPanel (seperti yang terlihat di `phpMyAdmin` Anda).

---

## 📂 Langkah 1: Persiapan Berkas (File) Aplikasi

1. Kami telah memodifikasi struktur aplikasi sehingga kompatibel dengan cPanel.
2. Kami telah membuat file start-up otomatis bernama `app.js`.
3. Jalankan build di lokal atau gunakan hasil kompilasi yang ada. 
4. Buat file **ZIP** dari folder proyek ini.
   > **⚠️ PENTING:** Jangan ikut sertakan folder `node_modules` ke dalam file ZIP Anda. Ini untuk menghemat ukuran unggahan. Dependencies akan dipasang secara otomatis langsung di server cPanel.

---

## 📤 Langkah 2: Mengunggah Berkas ke cPanel

1. Masuk ke **cPanel** -> buka **File Manager** (Pengelola Berkas).
2. Buat folder baru di luar folder `public_html` untuk keamanan (misalnya buat folder bernama `zendiix`).
3. Masuk ke dalam folder `zendiix` yang baru dibuat, lalu **Unggah (Upload)** file ZIP proyek Anda.
4. **Ekstrak (Extract)** file ZIP tersebut di dalam folder tersebut.

---

## ⚙️ Langkah 3: Membuat Node.js Application di cPanel

1. Kembali ke Beranda cPanel, cari dan pilih menu **Setup Node.js App**.
2. Klik tombol **Create Application** di kanan atas.
3. Isikan formulir konfigurasi sebagai berikut:
   - **Node.js version**: Pilih versi **18.x** atau **20.x** (atau lebih baru jika tersedia).
   - **Application mode**: Pilih **Production**.
   - **Application root**: Isi dengan nama folder tempat Anda mengekstrak file tadi (misalnya: `zendiix`).
   - **Application URL**: Pilih domain atau subdomain Anda tempat aplikasi ingin diakses.
   - **Application startup file**: Isikan dengan `app.js` (ini akan menunjuk ke file start-up otomatis yang telah kami buat).
4. Klik tombol **Create** di bagian kanan atas untuk membuat dan menjalankan aplikasi pertama kali.

---

## 🔐 Langkah 4: Mengonfigurasi Environment Variables

Setelah aplikasi berhasil dibuat di cPanel, gulir ke bawah ke bagian **Environment variables**:

1. Tambahkan variabel baru:
   - **Name**: `DATABASE_URL`
   - **Value**: Masukkan kredensial MySQL cPanel Anda dengan format:
     `mysql://nama_user_db:password_db@localhost:3306/nama_db`
     *(Contoh: `mysql://zendhare_admin:ZendiixSandi123@localhost:3306/zendhare_zendiixdb`)*
2. Tambahkan variabel baru:
   - **Name**: `NODE_ENV`
   - **Value**: `production`
3. Tambahkan variabel baru (opsional, jika Anda menggunakan layanan eksternal):
   - **Name**: `PORT`
   - **Value**: `3000` (atau biarkan kosong karena cPanel Passenger akan otomatis mengaturnya melalui socket lokal).
4. Klik **Save** setelah menambahkan variabel lingkungan.

---

## 📦 Langkah 5: Memasang Dependensi (NPM Install)

1. Masih di halaman panel **Setup Node.js App** Anda.
2. Temukan bagian tombol **Run NPM Install**, lalu klik tombol tersebut.
3. Tunggu hingga proses instalasi paket selesai (biasanya memakan waktu 1-2 menit).

> 💡 **Troubleshooting: Mengatasi Error / Peringatan saat NPM Install di cPanel**
> 
> Jika cPanel menampilkan pesan peringatan merah seperti: *"...check availability of application has failed... return code 'None'..."*, **jangan khawatir!** 
> 
> Pesan ini adalah peringatan umum (benign warning) dari sistem Passenger cPanel. Hal ini terjadi karena cPanel otomatis mengetes/memanggil aplikasi sesaat setelah instalasi modul selesai, namun pada saat itu database Anda belum migrasi atau konfigurasi belum sepenuhnya dimuat oleh sistem.
> 
> **Cara memastikannya:**
> - Cek folder proyek Anda di **File Manager**. Jika folder `node_modules` sudah muncul dan berisi banyak file, artinya instalasi **telah berhasil dengan sempurna**.
> - Anda dapat mengabaikan peringatan tersebut dan langsung melanjutkan ke **Langkah 6**.

---

## 🛠️ Langkah 6: Menjalankan Sinkronisasi Struktur Database (Migrasi)

Karena database Anda di cPanel masih baru dan kosong, Anda perlu membuat tabel-tabel database-nya. Kami telah menyiapkan script migrasi otomatis!

1. Anda dapat menjalankan perintah migrasi melalui Terminal cPanel dengan menyalin baris perintah yang ada di bagian atas halaman Node.js App Anda (biasanya bertuliskan seperti: `source /home/username/nodevenv/zendiix/18/bin/activate && cd /home/username/zendiix`).
2. Tempelkan perintah tersebut di terminal cPanel Anda untuk mengaktifkan environment virtual Node.js.
3. Jalankan perintah migrasi berikut untuk langsung membuat semua tabel database secara instan:
   ```bash
   npx tsx src/db/migrate.ts
   ```
4. Jika proses sukses, Anda akan melihat pesan **"Migration completed successfully!"** di terminal Anda.

---

## 🎉 Langkah 7: Restart & Selesai!

1. Setelah semua selesai, kembali ke menu **Setup Node.js App**.
2. Klik tombol **Restart** di bagian atas konfigurasi aplikasi Anda.
3. Buka URL domain atau subdomain Anda di peramban web (browser). Aplikasi online Zendiix Anda kini siap digunakan!

*Catatan: Jika sewaktu-waktu Anda mengunggah pembaruan kode, Anda hanya perlu mengunggah filenya lalu mengklik tombol **Restart** di menu Setup Node.js App cPanel Anda.*
