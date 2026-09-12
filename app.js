/**
 * cPanel Passenger Entry Point (app.js)
 * 
 * Di cPanel "Setup Node.js App", gunakan file ini sebagai "Application startup file".
 * File ini akan memuat seluruh aplikasi web Zendiix yang sudah dikompilasi secara otomatis.
 */

// Menandakan runtime dalam mode produksi
process.env.NODE_ENV = 'production';

console.log('Memulai Zendiix Server di cPanel...');

// Memulai backend server yang sudah di-bundle oleh esbuild dengan penanganan error yang ramah
import('./dist/server.cjs').catch(err => {
  console.error('\n❌ ERROR: Gagal memuat server.cjs!');
  console.error('Silakan pastikan Anda sudah menjalankan perintah "npm run build" terlebih dahulu sebelum menjalankan aplikasi di cPanel.');
  console.error('Penyebab: File "./dist/server.cjs" tidak ditemukan atau gagal dieksekusi.');
  console.error('Detail Error:', err.message || err);
  process.exit(1);
});
