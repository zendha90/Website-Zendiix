/**
 * cPanel Passenger Entry Point (app.cjs)
 * Kompatibel dengan CloudLinux Node.js Selector & Phusion Passenger
 */

const fs = require('fs');
const path = require('path');

// Tambahkan path nodevenv cPanel secara otomatis jika ada
if (process.env.HOME) {
  const possiblePaths = [
    path.join(process.cwd(), 'node_modules'),
    path.join(process.env.HOME, 'nodevenv', path.basename(process.cwd()), '20', 'lib', 'node_modules'),
    path.join(process.env.HOME, 'nodevenv', path.basename(process.cwd()), '22', 'lib', 'node_modules'),
    path.join(process.env.HOME, 'nodevenv', 'zendiixsoftlens', '20', 'lib', 'node_modules'),
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p) && !module.paths.includes(p)) {
      module.paths.unshift(p);
    }
  }
}

function logErrorToFile(type, error) {
  const logPath = path.join(process.cwd(), 'cpanel_error.log');
  const timestamp = new Date().toISOString();
  const errorMsg = `[${timestamp}] [${type}] ${error?.stack || error?.message || error}\n`;
  try {
    fs.appendFileSync(logPath, errorMsg, 'utf8');
  } catch (writeErr) {}
}

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
} catch (e) {}

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

module.exports = app;

