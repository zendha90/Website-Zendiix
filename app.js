/**
 * cPanel Passenger Entry Point (app.js)
 * 
 * Di cPanel "Setup Node.js App", gunakan file ini sebagai "Application startup file".
 * File ini akan memuat seluruh aplikasi web Zendiix yang sudah dikompilasi secara otomatis.
 */

// Menandakan runtime dalam mode produksi
process.env.NODE_ENV = 'production';

// Memulai backend server yang sudah di-bundle oleh esbuild
console.log('Memulai Zendiix Server di cPanel...');
require('./dist/server.cjs');
