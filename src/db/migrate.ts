import mysql from 'mysql2/promise';
import 'dotenv/config';

async function migrate() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is missing');
    return;
  }

  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  console.log('Connected to MySQL...');

  const tables = [
    `CREATE TABLE IF NOT EXISTS products (
      id VARCHAR(255) PRIMARY KEY,
      kode_barang VARCHAR(255) NOT NULL,
      nama_barang VARCHAR(255) NOT NULL,
      supplier VARCHAR(255) NOT NULL,
      harga_beli DOUBLE NOT NULL,
      harga_jual DOUBLE NOT NULL,
      stok_awal INT NOT NULL,
      stok_barang INT DEFAULT 0,
      terjual INT DEFAULT 0,
      color VARCHAR(255) NOT NULL,
      bc VARCHAR(255) NOT NULL,
      kadar_air VARCHAR(255) NOT NULL,
      image_url VARCHAR(500),
      series_image_url VARCHAR(500),
      durasi VARCHAR(255),
      g_dia VARCHAR(255),
      diameter VARCHAR(255),
      rating DOUBLE,
      reviews_count INT,
      allow_dual_power BOOLEAN DEFAULT TRUE,
      group_name VARCHAR(255),
      custom_category VARCHAR(255),
      hide_specs BOOLEAN DEFAULT FALSE,
      not_softlens BOOLEAN DEFAULT FALSE,
      description VARCHAR(1000),
      is_flash_sale BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS incoming_goods (
      id VARCHAR(255) PRIMARY KEY,
      product_id VARCHAR(255) NOT NULL,
      kode_barang VARCHAR(255) NOT NULL,
      nama_barang VARCHAR(255) NOT NULL,
      qty INT NOT NULL,
      supplier VARCHAR(255),
      tanggal TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS sales (
      id VARCHAR(255) PRIMARY KEY,
      product_id VARCHAR(255) NOT NULL,
      kode_barang VARCHAR(255) NOT NULL,
      nama_barang VARCHAR(255) NOT NULL,
      qty INT NOT NULL,
      total_harga DOUBLE NOT NULL,
      tanggal_order VARCHAR(255),
      channel VARCHAR(255),
      no_pesanan VARCHAR(255),
      no_resi VARCHAR(255),
      nama_ekspedisi VARCHAR(255),
      hpp DOUBLE,
      total_hpp DOUBLE,
      laba DOUBLE,
      tanggal TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS sales_ds (
      id VARCHAR(255) PRIMARY KEY,
      kode_supplier VARCHAR(255) NOT NULL,
      tanggal_order VARCHAR(255) NOT NULL,
      channel VARCHAR(255) NOT NULL,
      no_pesanan VARCHAR(255) NOT NULL,
      no_resi VARCHAR(255) NOT NULL,
      nama_pelanggan VARCHAR(255) NOT NULL,
      alamat_pelanggan VARCHAR(500) NOT NULL,
      nama_produk VARCHAR(255) NOT NULL,
      qty INT NOT NULL,
      hpp DOUBLE NOT NULL,
      total_penjualan DOUBLE NOT NULL,
      ongkos_kirim DOUBLE NOT NULL,
      laba DOUBLE NOT NULL,
      tanggal TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS iklan (
      id VARCHAR(255) PRIMARY KEY,
      tanggal VARCHAR(255) NOT NULL,
      total_pembayaran DOUBLE NOT NULL,
      no_pesanan VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS weekly_sales (
      id VARCHAR(255) PRIMARY KEY,
      tahun INT NOT NULL,
      bulan INT NOT NULL,
      minggu INT NOT NULL,
      tanggal_start DOUBLE NOT NULL,
      tanggal_end DOUBLE NOT NULL,
      profit DOUBLE NOT NULL,
      profit_ds DOUBLE NOT NULL,
      total_profit DOUBLE NOT NULL,
      iklan DOUBLE NOT NULL,
      roi DOUBLE NOT NULL,
      hpp DOUBLE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS storefront_banners (
      id VARCHAR(255) PRIMARY KEY,
      image_url VARCHAR(500) NOT NULL,
      link_url VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS settings (
      id VARCHAR(255) PRIMARY KEY,
      announcement_texts JSON NOT NULL,
      logo_text VARCHAR(255) NOT NULL,
      logo_url VARCHAR(500),
      footer_about_text VARCHAR(1000) NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`
  ];

  for (const sql of tables) {
    console.log('Executing:', sql.substring(0, 50) + '...');
    await connection.execute(sql);
  }

  console.log('Migration completed successfully!');
  await connection.end();
}

migrate().catch(console.error);
