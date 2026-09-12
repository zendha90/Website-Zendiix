/**
 * cPanel Passenger Entry Point (app.js)
 * Kompatibel dengan CloudLinux Node.js Selector & Phusion Passenger
 */

const fs = require('fs');
const path = require('path');

// Fungsi pembantu untuk mencatat error langsung ke file cpanel_error.log
function logErrorToFile(type, error) {
  const logPath = path.join(process.cwd(), 'cpanel_error.log');
  const timestamp = new Date().toISOString();
  const errorMsg = `[${timestamp}] [${type}] ${error?.stack || error?.message || error}\n`;
  try {
    fs.appendFileSync(logPath, errorMsg, 'utf8');
  } catch (writeErr) {
    console.error('Gagal menulis ke cpanel_error.log:', writeErr);
  }
}

// Tangkap crash global agar tidak hilang di Phusion Passenger
process.on('uncaughtException', (err) => {
  console.error('[CRASH] uncaughtException:', err);
  logErrorToFile('UNCAUGHT_EXCEPTION', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[CRASH] unhandledRejection:', reason);
  logErrorToFile('UNHANDLED_REJECTION', reason);
});

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
  console.error('Penyebab error:', err.message || err);
  logErrorToFile('STARTUP_REQUIRE_ERROR', err);
  throw err;
}

const app = (serverModule && serverModule.default) ? serverModule.default : serverModule;

// Ekspor objek app Express untuk Phusion Passenger node-loader
module.exports = app;


