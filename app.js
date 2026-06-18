/**
 * cPanel Passenger Entry Point (app.js) - Versi Fail-Safe
 * 
 * Di cPanel "Setup Node.js App", gunakan file ini sebagai "Application startup file".
 * File ini dilengkapi pendeteksi otomatis agar sistem TIDAK crash saat modul NPM belum diinstal.
 */

process.env.NODE_ENV = 'production';

try {
  // Coba muat backend server utama yang sudah di-bundle oleh esbuild
  console.log('Mencoba memulai Zendiix Server di cPanel...');
  require('./dist/server.cjs');
} catch (error) {
  console.error('SERVER CRASH / BELUM DI-INSTALL:', error.message);

  // FAIL-SAFE: Jika server tidak bisa dimuat (biasanya karena belum run NPM install)
  // Kita buat HTTP server native (tanpa dependensi luar) agar cPanel tidak mendeteksi error "Inaccessible by its address"
  const http = require('http');
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Zendiix Softlens - Mempersiapkan Sistem</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; text-align: center; padding: 50px; background-color: #f8fafc; color: #1e293b; }
            .card { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
            h1 { color: #f97316; font-size: 26px; margin-bottom: 16px; font-weight: 800; }
            p { color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 24px; }
            .badge { display: inline-block; padding: 8px 16px; background: #ffedd5; color: #ea580c; border-radius: 9999px; font-weight: 700; font-size: 14px; margin-bottom: 20px; }
            .terminal { background: #0f172a; color: #38bdf8; padding: 15px; border-radius: 8px; text-align: left; font-family: monospace; font-size: 13px; line-height: 1.5; overflow-x: auto; }
          </style>
        </head>
        <body>
          <div class="card">
            <span class="badge">Status: Persiapan Modul/Dependensi</span>
            <h1>Zendiix Softlens</h1>
            <p>Sistem mendeteksi modul (<code>node_modules</code>) sedang atau belum dipasang di cPanel Anda.</p>
            
            <div class="terminal">
              $ # Tenang, halaman ini aktif untuk menghindari error cPanel!<br>
              $ # Silakan klik tombol "Run NPM Install" di cPanel sekarang,<br>
              $ # lalu restart aplikasi Node.js setelah selesai.
            </div>
          </div>
        </body>
      </html>
    `);
  });

  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`Fail-safe server aktif di port ${port} untuk merespon probe cPanel.`);
  });
}
