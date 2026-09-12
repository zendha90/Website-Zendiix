/**
 * Zendiix cPanel Diagnostic Tool (diagnose.js)
 * Jalankan file ini via Terminal cPanel:
 *    node diagnose.js
 */

const fs = require('fs');
const path = require('path');

console.log('\n======================================================');
console.log('🔍 MEMULAI DIAGNOSTIK KESEHATAN SISTEM DI CPANEL');
console.log('======================================================\n');

// 1. Cek Node.js Version
console.log(`1. Versi Node.js: ${process.version}`);
const majorVersion = parseInt(process.version.slice(1).split('.')[0], 10);
if (majorVersion < 18) {
  console.log('   ⚠️ PERINGATAN: Disarankan menggunakan Node.js versi 18.x atau 20.x di Setup Node.js App cPanel.');
} else {
  console.log('   ✅ Versi Node.js memenuhi syarat (>= 18.x).');
}

// 2. Cek Folder dist & server.cjs
console.log('\n2. Memeriksa File Hasil Kompilasi (Build)...');
const distDir = path.join(process.cwd(), 'dist');
const serverCjs = path.join(distDir, 'server.cjs');
const indexHtml = path.join(distDir, 'index.html');

if (!fs.existsSync(distDir)) {
  console.log('   ❌ FATAL ERROR: Folder "dist" TIDAK DITEMUKAN!');
  console.log('      Solusi: Unggah folder "dist" hasil "npm run build" ke cPanel.');
} else {
  console.log('   ✅ Folder "dist" ditemukan.');
  
  if (!fs.existsSync(serverCjs)) {
    console.log('   ❌ FATAL ERROR: File "dist/server.cjs" TIDAK DITEMUKAN!');
    console.log('      Solusi: Pastikan Anda menjalankan "npm run build" dan menyertakan dist/server.cjs.');
  } else {
    const stat = fs.statSync(serverCjs);
    console.log(`   ✅ File "dist/server.cjs" ditemukan (${(stat.size / 1024).toFixed(1)} KB).`);
  }

  if (!fs.existsSync(indexHtml)) {
    console.log('   ⚠️ File "dist/index.html" tidak ditemukan. Halaman frontend mungkin blank.');
  } else {
    console.log('   ✅ File "dist/index.html" ditemukan.');
  }
}

// 3. Cek node_modules
console.log('\n3. Memeriksa Folder node_modules...');
const nodeModules = path.join(process.cwd(), 'node_modules');
if (!fs.existsSync(nodeModules)) {
  console.log('   ❌ FATAL ERROR: Folder "node_modules" TIDAK DITEMUKAN!');
  console.log('      Solusi: Buka cPanel -> Setup Node.js App -> Klik tombol "Run NPM Install".');
} else {
  console.log('   ✅ Folder "node_modules" ditemukan.');
}

// 4. Cek Environment Variables (.env / cPanel)
console.log('\n4. Memeriksa Konfigurasi Database (DATABASE_URL)...');
try {
  require('dotenv').config();
} catch (e) {}

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.log('   ⚠️ PERINGATAN: Variabel DATABASE_URL tidak terdeteksi.');
  console.log('      Aplikasi akan mencoba berjalan dalam mode fallback JSON.');
  console.log('      Solusi: Tambahkan DATABASE_URL di menu Environment Variables cPanel.');
} else {
  console.log('   ✅ DATABASE_URL terdeteksi.');
  if (dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1')) {
    console.log('   ℹ️ Terhubung ke localhost MySQL.');
  }
}

// 5. Tes Memuat Aplikasi (Require Test)
console.log('\n5. Menjalankan Tes Import Aplikasi (require("./app.js"))...');
try {
  process.env.NODE_ENV = 'production';
  const app = require('./app.js');
  console.log('   ✅ File app.js BERHASIL dimuat tanpa error!');
  console.log(`   ℹ️ Tipe output: ${typeof app}`);
  console.log('\n======================================================');
  console.log('🎉 SEMUA PEMERIKSAAN MANDIRI BERHASIL!');
  console.log('Jika web masih 503, periksa langkah Passenger socket di CPANEL_DEPLOY_GUIDE.md');
  console.log('======================================================\n');
  process.exit(0);
} catch (err) {
  console.log('\n   ❌ CRASH TERDETEKSI SAAT MEMUAT APLIKASI!');
  console.log('   ----------------------------------------');
  console.error('   Pesan Error :', err.message);
  console.error('   Kode Error  :', err.code);
  console.log('\n   Stack Trace Lengkap:');
  console.error(err.stack);
  console.log('   ----------------------------------------');
  console.log('   Silakan copy pesan error di atas untuk perbaikan langsung.\n');
  process.exit(1);
}
