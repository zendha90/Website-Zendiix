import { mysqlTable, varchar, int, double, timestamp, boolean, json, text } from 'drizzle-orm/mysql-core';

export const products = mysqlTable('products', {
  id: varchar('id', { length: 255 }).primaryKey(),
  kodeBarang: varchar('kode_barang', { length: 255 }).notNull(),
  namaBarang: varchar('nama_barang', { length: 255 }).notNull(),
  supplier: varchar('supplier', { length: 255 }).notNull(),
  hargaBeli: double('harga_beli').notNull(),
  hargaJual: double('harga_jual').notNull(),
  stokAwal: int('stok_awal').notNull(),
  stokBarang: int('stok_barang').default(0),
  terjual: int('terjual').default(0),
  color: varchar('color', { length: 255 }).notNull(),
  bc: varchar('bc', { length: 255 }).notNull(),
  kadarAir: varchar('kadar_air', { length: 255 }).notNull(),
  imageUrl: text('image_url'),
  durasi: varchar('durasi', { length: 255 }),
  gDia: varchar('g_dia', { length: 255 }),
  diameter: varchar('diameter', { length: 255 }),
  rating: double('rating'),
  reviewsCount: int('reviews_count'),
  allowDualPower: boolean('allow_dual_power').default(true),
  groupName: varchar('group_name', { length: 255 }),
  customCategory: varchar('custom_category', { length: 255 }),
  hideSpecs: boolean('hide_specs').default(false),
  notSoftlens: boolean('not_softlens').default(false),
  description: varchar('description', { length: 1000 }),
  isFlashSale: boolean('is_flash_sale').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const incomingGoods = mysqlTable('incoming_goods', {
  id: varchar('id', { length: 255 }).primaryKey(),
  productId: varchar('product_id', { length: 255 }).notNull(),
  kodeBarang: varchar('kode_barang', { length: 255 }).notNull(),
  namaBarang: varchar('nama_barang', { length: 255 }).notNull(),
  qty: int('qty').notNull(),
  supplier: varchar('supplier', { length: 255 }),
  tanggal: timestamp('tanggal').defaultNow(),
});

export const sales = mysqlTable('sales', {
  id: varchar('id', { length: 255 }).primaryKey(),
  productId: varchar('product_id', { length: 255 }).notNull(),
  kodeBarang: varchar('kode_barang', { length: 255 }).notNull(),
  namaBarang: varchar('nama_barang', { length: 255 }).notNull(),
  qty: int('qty').notNull(),
  totalHarga: double('total_harga').notNull(),
  tanggalOrder: varchar('tanggal_order', { length: 255 }),
  channel: varchar('channel', { length: 255 }),
  noPesanan: varchar('no_pesanan', { length: 255 }),
  noResi: varchar('no_resi', { length: 255 }),
  namaEkspedisi: varchar('nama_ekspedisi', { length: 255 }),
  hpp: double('hpp'),
  totalHpp: double('total_hpp'),
  laba: double('laba'),
  tanggal: timestamp('tanggal').defaultNow(),
});

export const salesDs = mysqlTable('sales_ds', {
  id: varchar('id', { length: 255 }).primaryKey(),
  kodeSupplier: varchar('kode_supplier', { length: 255 }).notNull(),
  tanggalOrder: varchar('tanggal_order', { length: 255 }).notNull(),
  channel: varchar('channel', { length: 255 }).notNull(),
  noPesanan: varchar('no_pesanan', { length: 255 }).notNull(),
  noResi: varchar('no_resi', { length: 255 }).notNull(),
  namaPelanggan: varchar('nama_pelanggan', { length: 255 }).notNull(),
  alamatPelanggan: varchar('alamat_pelanggan', { length: 500 }).notNull(),
  namaProduk: varchar('nama_produk', { length: 255 }).notNull(),
  qty: int('qty').notNull(),
  hpp: double('hpp').notNull(),
  totalPenjualan: double('total_penjualan').notNull(),
  ongkosKirim: double('ongkos_kirim').notNull(),
  laba: double('laba').notNull(),
  tanggal: timestamp('tanggal').defaultNow(),
});

export const iklan = mysqlTable('iklan', {
  id: varchar('id', { length: 255 }).primaryKey(),
  tanggal: varchar('tanggal', { length: 255 }).notNull(),
  totalPembayaran: double('total_pembayaran').notNull(),
  noPesanan: varchar('no_pesanan', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const weeklySales = mysqlTable('weekly_sales', {
  id: varchar('id', { length: 255 }).primaryKey(),
  tahun: int('tahun').notNull(),
  bulan: int('bulan').notNull(),
  minggu: int('minggu').notNull(),
  tanggalStart: double('tanggal_start').notNull(),
  tanggalEnd: double('tanggal_end').notNull(),
  profit: double('profit').notNull(),
  profitDS: double('profit_ds').notNull(),
  totalProfit: double('total_profit').notNull(),
  iklan: double('iklan').notNull(),
  roi: double('roi').notNull(),
  hpp: double('hpp').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const storefrontBanners = mysqlTable('storefront_banners', {
  id: varchar('id', { length: 255 }).primaryKey(),
  imageUrl: text('image_url').notNull(),
  linkUrl: varchar('link_url', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const settings = mysqlTable('settings', {
  id: varchar('id', { length: 255 }).primaryKey(),
  announcementTexts: json('announcement_texts').notNull(),
  logoText: varchar('logo_text', { length: 255 }).notNull(),
  logoUrl: text('logo_url'),
  footerAboutText: varchar('footer_about_text', { length: 1000 }).notNull(),
  browserTitle: varchar('browser_title', { length: 255 }),
  faviconUrl: text('favicon_url'),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const reviews = mysqlTable('reviews', {
  id: varchar('id', { length: 255 }).primaryKey(),
  productId: varchar('product_id', { length: 255 }).notNull(),
  reviewerName: varchar('reviewer_name', { length: 255 }).notNull(),
  rating: int('rating').notNull(),
  comment: text('comment'),
  photoUrl: text('photo_url'),
  createdAt: timestamp('created_at').defaultNow(),
});
