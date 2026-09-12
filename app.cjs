/**
 * cPanel Passenger Entry Point (app.cjs)
 * Kompatibel dengan CloudLinux Node.js Selector & Phusion Passenger
 */

try {
  require('dotenv').config();
} catch (e) {
  // Abaikan jika dotenv belum terpasang
}

process.env.NODE_ENV = 'production';

console.log('[cPanel] Memulai Zendiix Server di lingkungan produksi...');

let serverModule;
try {
  serverModule = require('./dist/server.cjs');
} catch (err) {
  console.error('\n❌ ERROR: Gagal memuat ./dist/server.cjs!');
  console.error('Pastikan Anda sudah mengklik "Run NPM Install" di cPanel dan folder "dist" sudah terunggah.');
  console.error('Penyebab error:', err.message || err);
  throw err;
}

const app = (serverModule && serverModule.default) ? serverModule.default : serverModule;

// Ekspor objek app Express untuk Phusion Passenger node-loader
module.exports = app;
