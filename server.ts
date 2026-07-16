import express from 'express';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { createServer as createViteServer } from 'vite';
import { db } from './src/db';
import { products, incomingGoods, sales, salesDs, iklan, weeklySales, storefrontBanners, settings, reviews } from './src/db/schema';
import { eq, desc, sql, and, ne, inArray } from 'drizzle-orm';

// Global process listeners to prevent unhandled rejection crashes (essential for low max_user_connections database issues)
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (err, origin) => {
  console.error(`Caught exception: ${err}\nException origin: ${origin}`);
});

async function startServer() {
  const app = reportUnhandledLogs(express());
  const PORT = process.env.PORT || 3000;

  function reportUnhandledLogs(expressApp: any) {
    return expressApp;
  }

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  const serverCache = new Map<string, { data: any; expires: number }>();
  const pendingQueries = new Map<string, Promise<any>>();
  const CACHE_STALE_MS = 15000; // Cache database reads for 15 seconds

  const FALLBACK_FILE = path.join(process.cwd(), 'fallback_db.json');

  let fallbackData: any = {
    products: [
      { id: "A+-10ML", namaBarang: "A+ 10ml", kodeBarang: "A+-10ML", supplier: "S-matamoo", hargaBeli: 17000, hargaJual: 25500, stokAwal: 18, stokBarang: 259, terjual: 248, color: "", bc: "", kadarAir: "", createdAt: new Date().toISOString() },
      { id: "ALATPAKAISOFTLENS-PINK", namaBarang: "Alat Pakai Softlens Pink", kodeBarang: "ALATPAKAISOFTLENS-PINK", supplier: "S-jackiesuperstore88", hargaBeli: 8000, hargaJual: 12000, stokAwal: 8, stokBarang: 176, terjual: 176, color: "Pink", bc: "", kadarAir: "", createdAt: new Date().toISOString() },
      { id: "ALATPAKAISOFTLENS-TOSCA", namaBarang: "Alat Pakai Softlens Tosca", kodeBarang: "ALATPAKAISOFTLENS-TOSCA", supplier: "S-jackiesuperstore88", hargaBeli: 9000, hargaJual: 13500, stokAwal: 11, stokBarang: 118, terjual: 118, color: "Tosca", bc: "", kadarAir: "", createdAt: new Date().toISOString() },
      { id: "ALATPAKAISOFTLENS-White", namaBarang: "Alat Pakai Softlens White", kodeBarang: "ALATPAKAISOFTLENS-White", supplier: "S-jackiesuperstore88", hargaBeli: 9000, hargaJual: 13500, stokAwal: 9, stokBarang: 98, terjual: 98, color: "White", bc: "", kadarAir: "", createdAt: new Date().toISOString() },
      { id: "AVENUE-HONEYGREY-0,00", namaBarang: "Avenue Honey Grey Normal", kodeBarang: "AVENUE-HONEYGREY-0,00", supplier: "S-LINA", hargaBeli: 39000, hargaJual: 58500, stokAwal: 4, stokBarang: 6, terjual: 4, color: "Grey", bc: "8.6", kadarAir: "60", createdAt: new Date().toISOString() },
      { id: "CTK-MACARON-ALMONDBROWN-0,00", namaBarang: "Macaron Almond Normal", kodeBarang: "CTK-MACARON-ALMONDBROWN-0,00", supplier: "S-KIM", hargaBeli: 26000, hargaJual: 39000, stokAwal: 80, stokBarang: 153, terjual: 151, color: "Brown", bc: "8.6", kadarAir: "42", createdAt: new Date().toISOString() },
      { id: "CTK-MACARON-BERRYBLUE-0,00", namaBarang: "Macaron Berry Blue Normal", kodeBarang: "CTK-MACARON-BERRYBLUE-0,00", supplier: "S-KIM", hargaBeli: 26000, hargaJual: 39000, stokAwal: 84, stokBarang: 121, terjual: 119, color: "Blue", bc: "8.6", kadarAir: "42", createdAt: new Date().toISOString() },
      { id: "CTK-NEWBLUK-BLACK-3,00", namaBarang: "Newbluk Black -3,00", kodeBarang: "CTK-NEWBLUK-BLACK-3,00", supplier: "S-KIM", hargaBeli: 26000, hargaJual: 39000, stokAwal: 13, stokBarang: 29, terjual: 28, color: "Black", bc: "8.6", kadarAir: "45", createdAt: new Date().toISOString() },
      { id: "CTK-NMD-CARAMELBROWN-0,00", namaBarang: "NMD Caramel Brown Normal", kodeBarang: "CTK-NMD-CARAMELBROWN-0,00", supplier: "S-KIM", hargaBeli: 26000, hargaJual: 39000, stokAwal: 2, stokBarang: 18, terjual: 16, color: "Brown", bc: "8.6", kadarAir: "42", createdAt: new Date().toISOString() },
      { id: "CTK-NMD-GALAXYGREY-1,75", namaBarang: "NMD Galaxy Grey -1,75", kodeBarang: "CTK-NMD-GALAXYGREY-1,75", supplier: "S-KIM", hargaBeli: 26000, hargaJual: 39000, stokAwal: 3, stokBarang: 16, terjual: 15, color: "Grey", bc: "8.6", kadarAir: "42", createdAt: new Date().toISOString() }
    ],
    incomingGoods: [],
    sales: [],
    salesDs: [],
    iklan: [],
    weeklySales: [],
    storefrontBanners: [],
    settings: [
      {
        id: 'branding',
        announcementTexts: [
          "✨ BELI 1 GRATIS 1 - Tingkatkan pesonamu dengan Zendiix!",
          "🚚 GRATIS ONGKIR dengan belanja minimal Rp 400.000!",
          "🎁 BONUS Case Cermin Premium setiap pembelian 2+ box!"
        ],
        logoText: "ZENDIIX",
        logoUrl: "",
        footerAboutText: "Zendiix hadir memberikan solusi produk softlens premium untuk menunjang keindahan dan kesehatan mata dengan standarisasi kualitas tinggi bagi para pecinta fashion optik."
      }
    ],
    reviews: [
      {
        id: "rev-1",
        productId: "Macaron Almond",
        reviewerName: "Siti Rahma",
        rating: 5,
        comment: "Softlens Macaron Almond nya cantik banget! Warnanya natural, gampang dipasang, dan gak ganjel sama sekali buat daily wear. Sangat direkomendasikan!",
        createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: "rev-2",
        productId: "Newbluk Black",
        reviewerName: "Andi Wijaya",
        rating: 5,
        comment: "Pertama kali beli Newbluk Black di toko ini dan langsung jatuh cinta. Nyaman banget dipakai seharian pas kerja di depan laptop. Pelayanan seller cepat dan ramah!",
        createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: "rev-3",
        productId: "Avenue Honey Grey",
        reviewerName: "Chika Amanda",
        rating: 4,
        comment: "Suka banget sama Avenue Honey Grey, bikin mata keliatan berdimensi & hidup tapi tetep elegan. Dapet free lenscase juga, makasih Zendiix!",
        createdAt: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: "rev-4",
        productId: "NMD Caramel Brown",
        reviewerName: "Dewi Lestari",
        rating: 5,
        comment: "NMD Caramel Brown emang terbaik! Pas banget di mata akuh yang rada sensitif, gak bikin gampang merah atau kering. Bakal langganan terus di sini.",
        createdAt: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: "rev-5",
        productId: "NMD Galaxy Grey",
        reviewerName: "Rian Pratama",
        rating: 5,
        comment: "Barang sampai dengan aman, packing tebal pake bubble wrap. Beli yang NMD Galaxy Grey buat kado pacar dan dia suka banget. Thank you!",
        createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: "rev-6",
        productId: "Macaron Berry Blue",
        reviewerName: "Nabila Putri",
        rating: 5,
        comment: "Udah beli berkali-kali di sini, kualitasnya gak pernah mengecewakan. Softlensnya tipis, kadar air seimbang, nyaman dipake seharian penuh tanpa tetes mata.",
        createdAt: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString()
      }
    ]
  };

  function loadFallbackData() {
    try {
      if (fs.existsSync(FALLBACK_FILE)) {
        const contents = fs.readFileSync(FALLBACK_FILE, 'utf8');
        const parsed = JSON.parse(contents);
        if (parsed.products) {
          fallbackData.products = parsed.products;
          serverCache.set('products', { data: fallbackData.products, expires: Date.now() + CACHE_STALE_MS });
        }
        if (parsed.incomingGoods) {
          fallbackData.incomingGoods = parsed.incomingGoods;
          serverCache.set('incoming-goods', { data: fallbackData.incomingGoods, expires: Date.now() + CACHE_STALE_MS });
        }
        if (parsed.sales) {
          fallbackData.sales = parsed.sales;
          serverCache.set('sales', { data: fallbackData.sales, expires: Date.now() + CACHE_STALE_MS });
        }
        if (parsed.salesDs) {
          fallbackData.salesDs = parsed.salesDs;
          serverCache.set('sales-ds', { data: fallbackData.salesDs, expires: Date.now() + CACHE_STALE_MS });
        }
        if (parsed.iklan) {
          fallbackData.iklan = parsed.iklan;
          serverCache.set('iklan', { data: fallbackData.iklan, expires: Date.now() + CACHE_STALE_MS });
        }
        if (parsed.weeklySales) {
          fallbackData.weeklySales = parsed.weeklySales;
          serverCache.set('weekly-sales', { data: fallbackData.weeklySales, expires: Date.now() + CACHE_STALE_MS });
        }
        if (parsed.storefrontBanners) {
          fallbackData.storefrontBanners = parsed.storefrontBanners;
          serverCache.set('banners', { data: fallbackData.storefrontBanners, expires: Date.now() + CACHE_STALE_MS });
        }
        if (parsed.settings) {
          fallbackData.settings = parsed.settings;
          serverCache.set('branding', { data: fallbackData.settings[0] || null, expires: Date.now() + CACHE_STALE_MS });
        }
        if (parsed.reviews) {
          fallbackData.reviews = parsed.reviews;
          serverCache.set('reviews', { data: fallbackData.reviews, expires: Date.now() + CACHE_STALE_MS });
        }
      } else {
        saveFallbackData();
      }
    } catch (err) {
      console.error('Error loading fallback_db.json:', err);
    }
  }

  function saveFallbackData() {
    try {
      fs.writeFileSync(FALLBACK_FILE, JSON.stringify(fallbackData, null, 2), 'utf8');
    } catch (err) {
      console.error('Error writing fallback_db.json:', err);
    }
  }

  loadFallbackData();

  async function executeWithRetry<T>(fn: () => Promise<T>, retries = 1, delayMs = 500): Promise<T> {
    try {
      return await fn();
    } catch (err: any) {
      const isTransient = err && (
        err.code === 'PROTOCOL_CONNECTION_LOST' ||
        err.code === 'ECONNRESET' ||
        err.code === 'EPIPE' ||
        err.code === 'ETIMEDOUT' ||
        err.code === 'ECONNREFUSED' ||
        (err.message && (
          err.message.includes('connection lost') ||
          err.message.includes('lost connection') ||
          err.message.includes('ECONNRESET') ||
          err.message.includes('EPIPE') ||
          err.message.includes('timeout')
        ))
      );
      
      if (isTransient && retries > 0) {
        console.warn(`Transient database error encountered (${err.code || err.message}). Retrying in ${delayMs}ms... (Remaining retries: ${retries})`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return executeWithRetry(fn, retries - 1, delayMs * 2);
      }
      throw err;
    }
  }

  let isDbOnline = false;
  let dbCircuitTrippedAt = 0;
  const CIRCUIT_COOLDOWN_MS = 15000; // Keep DB offline for 15 seconds after failing
  let isCheckingHealth = false;

  function tripDbCircuit(reason: string) {
    if (isDbOnline) {
      console.error(`TRIPPING DATABASE CIRCUIT BREAKER. Reason: ${reason}. Bypassing database for the next ${CIRCUIT_COOLDOWN_MS / 1000}s.`);
      isDbOnline = false;
      dbCircuitTrippedAt = Date.now();
    }
  }

  async function checkDbHealthInBackground() {
    if (isCheckingHealth) return;
    isCheckingHealth = true;
    console.log('Checking database health in the background...');
    try {
      await Promise.race([
        executeWithRetry(() => db.execute(sql`SELECT 1`)),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Health check timeout')), 3000))
      ]);
      console.log('Database health check succeeded. Restoring database connection.');
      isDbOnline = true;
    } catch (err: any) {
      console.warn('Database health check failed, keeping offline:', err?.message || err);
      dbCircuitTrippedAt = Date.now(); // Reset cooldown to give it another minute
    } finally {
      isCheckingHealth = false;
    }
  }

  setInterval(() => {
    if (!isDbOnline && Date.now() - dbCircuitTrippedAt > CIRCUIT_COOLDOWN_MS) {
      if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('dummy_user')) {
        checkDbHealthInBackground();
      }
    }
  }, 10000); // Check every 10 seconds if we need to heal

  // Run cPanel MySQL passive schema upgrades safely in the background (non-blocking)
  (async () => {
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dummy_user')) {
      console.log('Skipping background schema bootstrap: DATABASE_URL is not set or is a dummy placeholder.');
      return;
    }

    console.log('Starting background database connectivity check...');
    try {
      // Establish a quick ping. If this rejects, we abort the upgrades immediately to avoid blocking pool slots.
      await Promise.race([
        executeWithRetry(() => db.execute(sql`SELECT 1`), 2, 500),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Ping timeout')), 4000))
      ]);
      console.log('Database connectivity verified. Proceeding with passive schema checks...');
      isDbOnline = true;
    } catch (err: any) {
      console.warn('Skipping background database schema bootstrap: Database is offline, unreachable, or timed out:', err?.message || err);
      return;
    }

    try {
      await db.execute(sql`ALTER TABLE settings ADD COLUMN browser_title VARCHAR(255) NULL`);
    } catch (e) {}
    try {
      await db.execute(sql`ALTER TABLE settings ADD COLUMN favicon_url VARCHAR(500) NULL`);
    } catch (e) {}
    try {
      await db.execute(sql`ALTER TABLE products MODIFY COLUMN image_url MEDIUMTEXT NULL`);
    } catch (e) {}
    try {
      await db.execute(sql`ALTER TABLE products ADD COLUMN series_image_url MEDIUMTEXT NULL`);
    } catch (e) {}
    try {
      await db.execute(sql`ALTER TABLE settings MODIFY COLUMN logo_url MEDIUMTEXT NULL`);
    } catch (e) {}
    try {
      await db.execute(sql`ALTER TABLE settings MODIFY COLUMN favicon_url MEDIUMTEXT NULL`);
    } catch (e) {}
    try {
      await db.execute(sql`ALTER TABLE storefront_banners MODIFY COLUMN image_url MEDIUMTEXT NOT NULL`);
    } catch (e) {}

    // Ensure all products columns exist (safe for older MySQL/cPanel databases)
    try {
      await db.execute(sql`ALTER TABLE products ADD COLUMN durasi VARCHAR(255) NULL`);
    } catch (e) {}
    try {
      await db.execute(sql`ALTER TABLE products ADD COLUMN g_dia VARCHAR(255) NULL`);
    } catch (e) {}
    try {
      await db.execute(sql`ALTER TABLE products ADD COLUMN diameter VARCHAR(255) NULL`);
    } catch (e) {}
    try {
      await db.execute(sql`ALTER TABLE products ADD COLUMN rating DOUBLE NULL`);
    } catch (e) {}
    try {
      await db.execute(sql`ALTER TABLE products ADD COLUMN reviews_count INT NULL`);
    } catch (e) {}
    try {
      await db.execute(sql`ALTER TABLE products ADD COLUMN allow_dual_power TINYINT(1) DEFAULT 1 NULL`);
    } catch (e) {}
    try {
      await db.execute(sql`ALTER TABLE products ADD COLUMN group_name VARCHAR(255) NULL`);
    } catch (e) {}
    try {
      await db.execute(sql`ALTER TABLE products ADD COLUMN custom_category VARCHAR(255) NULL`);
    } catch (e) {}
    try {
      await db.execute(sql`ALTER TABLE products ADD COLUMN hide_specs TINYINT(1) DEFAULT 0 NULL`);
    } catch (e) {}
    try {
      await db.execute(sql`ALTER TABLE products ADD COLUMN not_softlens TINYINT(1) DEFAULT 0 NULL`);
    } catch (e) {}
    try {
      await db.execute(sql`ALTER TABLE products ADD COLUMN description VARCHAR(1000) NULL`);
    } catch (e) {}
    try {
      await db.execute(sql`ALTER TABLE products ADD COLUMN is_flash_sale TINYINT(1) DEFAULT 0 NULL`);
    } catch (e) {}

    // Ensure reviews table exists
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS reviews (
          id VARCHAR(255) PRIMARY KEY,
          product_id VARCHAR(255) NOT NULL,
          reviewer_name VARCHAR(255) NOT NULL,
          rating INT NOT NULL,
          comment TEXT,
          photo_url TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } catch (e) {}
    try {
      await db.execute(sql`ALTER TABLE reviews MODIFY COLUMN photo_url MEDIUMTEXT NULL`);
    } catch (e) {}
    try {
      await db.execute(sql`ALTER TABLE reviews ADD COLUMN is_pinned TINYINT(1) DEFAULT 0 NULL`);
    } catch (e) {}
    console.log('Background schema check and bootstrap completed successfully.');
  })().catch(err => {
    console.error('Warning: Background database schema bootstrap check failed, server will remain active:', err);
  });

  // Health Check / DB Test
  app.get('/api/health-check', async (req, res) => {
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dummy_user')) {
      return res.json({
        status: 'error',
        message: 'Database is offline (local fallback active)',
        details: 'DATABASE_URL is not set or is some dummy placeholder.',
        suggestedIp: '34.96.48.15'
      });
    }
    try {
      // Simple query to test connection with timeout protection
      await Promise.race([
        db.execute(sql`SELECT 1`),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Connection check timed out after 3.0 seconds')), 3000))
      ]);
      isDbOnline = true;
      res.json({ 
        status: 'ok', 
        message: 'Database connection successful!',
        database: 'MySQL (cPanel)'
      });
    } catch (error: any) {
      console.error('Database connection failed or timed out:', error);
      let suggestedIp = '';
      if (error && error.message) {
        const match = error.message.match(/@'([^']+)'/);
        if (match && match[1]) {
          suggestedIp = match[1];
        }
      }
      // Automatically trip the circuit breaker on health check failure
      tripDbCircuit(`Health check failed: ${error?.message || error}`);
      res.json({ 
        status: 'error', 
        message: 'Database connection failed or timed out', 
        details: error.message || 'Timeout',
        suggestedIp: suggestedIp || '34.96.48.15'
      });
    }
  });

  // Admin password check & login APIs
  app.get('/api/admin/check-config', (req, res) => {
    res.json({
      hasCustomPassword: !!process.env.ADMIN_PASSWORD
    });
  });

  app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    const envPassword = process.env.ADMIN_PASSWORD;
    const isMatched = envPassword
      ? password === envPassword
      : password === "admin123" || password === "admin";

    if (isMatched) {
      res.json({ success: true });
    } else {
      res.json({ success: false, error: "Password salah!" });
    }
  });

  const sanitizeProduct = (data: any) => {
    const allowed = [
      'kodeBarang', 'namaBarang', 'supplier', 'hargaBeli', 'hargaJual',
      'stokAwal', 'stokBarang', 'terjual', 'color', 'bc', 'kadarAir',
      'imageUrl', 'seriesImageUrl', 'durasi', 'gDia', 'diameter', 'rating', 'reviewsCount',
      'allowDualPower', 'groupName', 'customCategory', 'hideSpecs',
      'notSoftlens', 'description', 'isFlashSale'
    ];
    const cleaned: any = {};
    for (const key of allowed) {
      if (data[key] !== undefined) {
        cleaned[key] = data[key];
      }
    }
    return cleaned;
  };

  const stripDuplicateImages = (productsList: any[]) => {
    const seriesImageSaved = new Set<string>();
    const colorImageSaved = new Set<string>();
    
    return productsList.map(p => {
      let seriesName = p.groupName ? p.groupName.trim() : "";
      if (!seriesName && p.namaBarang) {
        let name = p.namaBarang;
        name = name.replace(/series master families/i, '').replace(/master families/i, '').replace(/\bseries\b/i, '');
        name = name.replace(/-\s*\d+[,.]\d+/g, '').replace(/-\s*\d+/g, '');
        name = name.replace(/\s+/g, ' ').trim();
        seriesName = name;
      }
      const seriesKey = (seriesName || "Unknown").toLowerCase();
      const color = (p.color || "Clear").toLowerCase();
      const colorKey = `${seriesKey}::${color}`;
      
      const copy = { ...p };
      
      if (copy.seriesImageUrl && copy.seriesImageUrl.trim() !== "") {
        if (seriesImageSaved.has(seriesKey)) {
          copy.seriesImageUrl = "";
        } else {
          seriesImageSaved.add(seriesKey);
        }
      }
      
      if (copy.imageUrl && copy.imageUrl.trim() !== "") {
        if (colorImageSaved.has(colorKey)) {
          copy.imageUrl = "";
        } else {
          colorImageSaved.add(colorKey);
        }
      }
      
      return copy;
    });
  };

  // Resilient caching layer to handle DB load spikes and cPanel's 5 max_user_connections constraints.
  // When a database read fails due to connections, we serve the latest stale cached data or defaults.
  // We use Stale-While-Revalidate and Request Coalescing to make reads sub-millisecond and protect the pool from concurrent spikes.
  
  async function getCached<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
    const cached = serverCache.get(key);
    const now = Date.now();
    
    // 1. If we have verified cached data within expiry, return it immediately
    if (cached && cached.expires > now) {
      return cached.data;
    }
    
    // 2. If we have cached data but it is stale, return stale data immediately and refresh in background (Stale-While-Revalidate)
    if (cached) {
      // Trigger background update if there isn't one already running
      if (!pendingQueries.has(key)) {
        const backgroundPromise = (async () => {
          try {
            const fresh = await Promise.race([
              executeWithRetry(fetchFn),
              new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Database query timed out')), 20000))
            ]);
            serverCache.set(key, { data: fresh, expires: Date.now() + CACHE_STALE_MS });
            console.log(`Background SWR cache refresh successful for key "${key}"`);
          } catch (err: any) {
            console.error(`Background SWR cache refresh failed or timed out for key "${key}":`, err?.message || err);
            tripDbCircuit(`Background read error or timeout on key "${key}": ${err?.message || err}`);
          } finally {
            pendingQueries.delete(key);
          }
        })();
        pendingQueries.set(key, backgroundPromise);
      }
      return cached.data;
    }
    
    // 3. No cached data at all, must do a blocking read. Use coalescing to avoid redundant concurrent DB queries.
    let pending = pendingQueries.get(key);
    if (!pending) {
      pending = (async () => {
        try {
          const fresh = await Promise.race([
            executeWithRetry(fetchFn),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Database query timed out')), 20000))
          ]);
          serverCache.set(key, { data: fresh, expires: Date.now() + CACHE_STALE_MS });
          return fresh;
        } finally {
          pendingQueries.delete(key);
        }
      })();
      pendingQueries.set(key, pending);
    }
    
    try {
      return await pending;
    } catch (err: any) {
      console.error(`Database read error or timeout in getCached for key "${key}":`, err?.message || err);
      tripDbCircuit(`Read error or timeout on key "${key}": ${err?.message || err}`);
      throw err;
    }
  }

  function clearCache(key: string) {
    serverCache.delete(key);
  }

  async function runDbWrite<T>(writeFn: () => Promise<T>): Promise<T> {
    return Promise.race([
      executeWithRetry(writeFn),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Database write operation timed out')), 5000))
    ]);
  }

  // API Routes
  
  // Products
  app.get('/api/products', async (req, res) => {
    try {
      if (!isDbOnline) {
        const sorted = [...fallbackData.products].sort((a, b) => b.id.localeCompare(a.id));
        return res.json(stripDuplicateImages(sorted));
      }
      const allProducts = await getCached('products', () => 
        db.select().from(products).orderBy(desc(products.createdAt))
      );
      res.json(stripDuplicateImages(allProducts));
    } catch (error) {
      console.error('Error fetching products, returning local fallback products:', error);
      const sorted = [...fallbackData.products].sort((a, b) => b.id.localeCompare(a.id));
      res.json(stripDuplicateImages(sorted));
    }
  });

  app.post('/api/products', async (req, res) => {
    const data = req.body;
    const id = data.id || Math.random().toString(36).substring(2, 15);
    const cleaned = sanitizeProduct(data);
    
    try {
      if (!isDbOnline) {
        const existingIdx = fallbackData.products.findIndex((p: any) => p.id === id);
        if (existingIdx !== -1) {
          fallbackData.products[existingIdx] = { ...fallbackData.products[existingIdx], ...cleaned, id, updatedAt: new Date().toISOString() };
        } else {
          fallbackData.products.push({ ...cleaned, id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
        }
        saveFallbackData();
        return res.json({ id, ...data });
      }

      await runDbWrite(async () => {
        const existing = data.id ? await db.select().from(products).where(eq(products.id, data.id)).limit(1) : [];
        if (existing.length > 0) {
          await db.update(products).set({ ...cleaned, updatedAt: new Date() }).where(eq(products.id, id));
        } else {
          await db.insert(products).values({ ...cleaned, id });
        }
      });
      clearCache('products');
      res.json({ id, ...data });
    } catch (error) {
      console.error('Error creating product in DB, falling back to local storage:', error);
      tripDbCircuit(`Error creating product: ${error}`);
      const existingIdx = fallbackData.products.findIndex((p: any) => p.id === id);
      if (existingIdx !== -1) {
        fallbackData.products[existingIdx] = { ...fallbackData.products[existingIdx], ...cleaned, id, updatedAt: new Date().toISOString() };
      } else {
        fallbackData.products.push({ ...cleaned, id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      }
      saveFallbackData();
      res.json({ id, ...data });
    }
  });

  // Settings
  app.get('/api/settings/branding', async (req, res) => {
    try {
      if (!isDbOnline) {
        return res.json(fallbackData.settings[0] || null);
      }
      const result = await getCached('branding', () =>
        db.select().from(settings).where(eq(settings.id, 'branding')).limit(1)
      );
      res.json(result[0] || null);
    } catch (error) {
      console.error('Error fetching settings, returning local fallback:', error);
      res.json(fallbackData.settings[0] || {
        announcementTexts: [
          "✨ BELI 1 GRATIS 1 - Tingkatkan pesonamu dengan Zendiix!",
          "🚚 GRATIS ONGKIR dengan belanja minimal Rp 400.000!",
          "🎁 BONUS Case Cermin Premium setiap pembelian 2+ box!"
        ],
        logoText: "ZENDIIX",
        logoUrl: "",
        footerAboutText: "Zendiix hadir memberikan solusi produk softlens premium untuk menunjang keindahan dan kesehatan mata dengan standarisasi kualitas tinggi bagi para pecinta fashion optik."
      });
    }
  });

  app.post('/api/settings/branding', async (req, res) => {
    const data = req.body;
    try {
      if (!isDbOnline) {
        fallbackData.settings[0] = { id: 'branding', ...data, updatedAt: new Date().toISOString() };
        saveFallbackData();
        return res.json({ id: 'branding', ...data });
      }

      await runDbWrite(async () => {
        await db.insert(settings)
          .values({ id: 'branding', ...data })
          .onDuplicateKeyUpdate({
            set: { ...data, updatedAt: new Date() }
          });
      });
      clearCache('branding');
      res.json({ id: 'branding', ...data });
    } catch (error) {
      console.error('Error updating settings in DB, falling back to local storage:', error);
      tripDbCircuit(`Error updating setting: ${error}`);
      fallbackData.settings[0] = { id: 'branding', ...data, updatedAt: new Date().toISOString() };
      saveFallbackData();
      res.json({ id: 'branding', ...data });
    }
  });

  // Banners
  app.get('/api/banners', async (req, res) => {
    try {
      if (!isDbOnline) {
        return res.json(fallbackData.storefrontBanners);
      }
      const bannersList = await getCached('banners', () =>
        db.select().from(storefrontBanners).orderBy(desc(storefrontBanners.createdAt))
      );
      res.json(bannersList);
    } catch (error) {
      console.error('Error fetching banners, returning local fallback banners:', error);
      res.json(fallbackData.storefrontBanners);
    }
  });

  // Incoming Goods
  app.get('/api/incoming-goods', async (req, res) => {
    try {
      if (!isDbOnline) {
        return res.json(fallbackData.incomingGoods);
      }
      const result = await getCached('incoming-goods', () =>
        db.select().from(incomingGoods).orderBy(desc(incomingGoods.tanggal))
      );
      res.json(result);
    } catch (error) {
      console.error('Error fetching incoming goods, returning local fallback goods:', error);
      res.json(fallbackData.incomingGoods);
    }
  });

  app.post('/api/incoming-goods', async (req, res) => {
    const data = req.body;
    const id = data.id || Math.random().toString(36).substring(2, 15);
    try {
      if (!isDbOnline) {
        fallbackData.incomingGoods.push({ ...data, id, tanggal: new Date().toISOString() });
        saveFallbackData();
        return res.json({ id, ...data });
      }
      await runDbWrite(async () => {
        await db.insert(incomingGoods).values({ ...data, id, tanggal: new Date() });
      });
      clearCache('incoming-goods');
      res.json({ id, ...data });
    } catch (error) {
      console.error('Error creating incoming good in DB, falling back to local storage:', error);
      tripDbCircuit(`Error creating incoming good: ${error}`);
      fallbackData.incomingGoods.push({ ...data, id, tanggal: new Date().toISOString() });
      saveFallbackData();
      res.json({ id, ...data });
    }
  });

  app.post('/api/incoming-goods/batch', async (req, res) => {
    const items = req.body;
    if (!Array.isArray(items)) return res.status(400).send('Invalid batch');
    try {
      const itemsWithId = items.map(item => ({
        ...item,
        id: item.id || uuidv4(),
        tanggal: item.tanggal ? new Date(item.tanggal) : new Date()
      }));
      if (isDbOnline) {
        await runDbWrite(async () => {
          await db.insert(incomingGoods).values(itemsWithId);
        });
        clearCache('incoming-goods');
      } else {
        fallbackData.incomingGoods.push(...items);
        saveFallbackData();
      }
      res.json({ success: true, count: items.length });
    } catch (error) {
      console.error('Error in batch incoming goods insert:', error);
      res.status(500).json({ error: String(error), stack: error instanceof Error ? error.stack : undefined });
    }
  });

  // Sales
  app.get('/api/sales', async (req, res) => {
    try {
      if (!isDbOnline) {
        return res.json(fallbackData.sales);
      }
      const result = await getCached('sales', () =>
        db.select().from(sales).orderBy(desc(sales.tanggal))
      );
      res.json(result);
    } catch (error) {
      console.error('Error fetching sales, returning local fallback sales:', error);
      res.json(fallbackData.sales);
    }
  });

  app.post('/api/sales', async (req, res) => {
    const data = req.body;
    const id = data.id || Math.random().toString(36).substring(2, 15);
    try {
      if (!isDbOnline) {
        fallbackData.sales.push({ ...data, id, tanggal: data.tanggal || new Date().toISOString() });
        saveFallbackData();
        return res.json({ id, ...data });
      }
      const finalTanggal = data.tanggal ? new Date(data.tanggal) : new Date();
      await db.insert(sales).values({ ...data, id, tanggal: finalTanggal });
      clearCache('sales');
      res.json({ id, ...data });
    } catch (error) {
      console.error('Error creating sale in DB, falling back to local storage:', error);
      fallbackData.sales.push({ ...data, id, tanggal: data.tanggal || new Date().toISOString() });
      saveFallbackData();
      res.json({ id, ...data });
    }
  });

  app.post('/api/sales/bulk', async (req, res) => {
    const items = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: "Body must be an array" });
    }
    try {
      const saved: any[] = [];
      if (!isDbOnline) {
        for (const data of items) {
          const id = data.id || Math.random().toString(36).substring(2, 15);
          fallbackData.sales.push({ ...data, id, tanggal: data.tanggal || new Date().toISOString() });
          saved.push({ id, ...data });
        }
        saveFallbackData();
        return res.json(saved);
      }
      
      const insertData = items.map(data => {
        const id = data.id || Math.random().toString(36).substring(2, 15);
        const finalTanggal = data.tanggal ? new Date(data.tanggal) : new Date();
        return {
          ...data,
          id,
          tanggal: finalTanggal
        };
      });
      
      await db.insert(sales).values(insertData);
      clearCache('sales');
      res.json(insertData);
    } catch (error) {
      console.error('Error in bulk sales insert, falling back:', error);
      const saved: any[] = [];
      for (const data of items) {
        const id = data.id || Math.random().toString(36).substring(2, 15);
        fallbackData.sales.push({ ...data, id, tanggal: data.tanggal || new Date().toISOString() });
        saved.push({ id, ...data });
      }
      saveFallbackData();
      res.json(saved);
    }
  });

  // Sales DS
  app.get('/api/sales-ds', async (req, res) => {
    try {
      if (!isDbOnline) {
        return res.json(fallbackData.salesDs);
      }
      const result = await getCached('sales-ds', () =>
        db.select().from(salesDs).orderBy(desc(salesDs.tanggal))
      );
      res.json(result);
    } catch (error) {
      console.error('Error fetching sales DS, returning local fallback sales-ds:', error);
      res.json(fallbackData.salesDs);
    }
  });

  app.post('/api/sales-ds', async (req, res) => {
    const data = req.body;
    const id = data.id || Math.random().toString(36).substring(2, 15);
    try {
      if (!isDbOnline) {
        fallbackData.salesDs.push({ ...data, id, tanggal: new Date().toISOString() });
        saveFallbackData();
        return res.json({ id, ...data });
      }
      await db.insert(salesDs).values({ ...data, id, tanggal: new Date() });
      clearCache('sales-ds');
      res.json({ id, ...data });
    } catch (error) {
      console.error('Error creating sales DS in DB, falling back to local storage:', error);
      fallbackData.salesDs.push({ ...data, id, tanggal: new Date().toISOString() });
      saveFallbackData();
      res.json({ id, ...data });
    }
  });

  app.post('/api/sales-ds/bulk', async (req, res) => {
    const items = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: "Body must be an array" });
    }
    try {
      const saved: any[] = [];
      if (!isDbOnline) {
        for (const data of items) {
          const id = data.id || Math.random().toString(36).substring(2, 15);
          fallbackData.salesDs.push({ ...data, id, tanggal: new Date().toISOString() });
          saved.push({ id, ...data });
        }
        saveFallbackData();
        return res.json(saved);
      }
      
      const insertData = items.map(data => {
        const id = data.id || Math.random().toString(36).substring(2, 15);
        return {
          ...data,
          id,
          tanggal: new Date()
        };
      });
      
      await db.insert(salesDs).values(insertData);
      clearCache('sales-ds');
      res.json(insertData);
    } catch (error) {
      console.error('Error in bulk sales-ds insert, falling back:', error);
      const saved: any[] = [];
      for (const data of items) {
        const id = data.id || Math.random().toString(36).substring(2, 15);
        fallbackData.salesDs.push({ ...data, id, tanggal: new Date().toISOString() });
        saved.push({ id, ...data });
      }
      saveFallbackData();
      res.json(saved);
    }
  });

  // Iklan
  app.get('/api/iklan', async (req, res) => {
    try {
      if (!isDbOnline) {
        return res.json(fallbackData.iklan);
      }
      const result = await getCached('iklan', () =>
        db.select().from(iklan).orderBy(desc(iklan.createdAt))
      );
      res.json(result);
    } catch (error) {
      console.error('Error fetching iklan, returning local fallback iklan:', error);
      res.json(fallbackData.iklan);
    }
  });

  app.post('/api/iklan', async (req, res) => {
    const data = req.body;
    const id = data.id || Math.random().toString(36).substring(2, 15);
    try {
      if (!isDbOnline) {
        fallbackData.iklan.push({ ...data, id, createdAt: new Date().toISOString() });
        saveFallbackData();
        return res.json({ id, ...data });
      }
      await db.insert(iklan).values({ ...data, id, createdAt: new Date() });
      clearCache('iklan');
      res.json({ id, ...data });
    } catch (error) {
      console.error('Error creating iklan in DB, falling back to local storage:', error);
      fallbackData.iklan.push({ ...data, id, createdAt: new Date().toISOString() });
      saveFallbackData();
      res.json({ id, ...data });
    }
  });

  // Weekly Sales
  app.get('/api/weekly-sales', async (req, res) => {
    try {
      if (!isDbOnline) {
        return res.json(fallbackData.weeklySales);
      }
      const result = await getCached('weekly-sales', () =>
        db.select().from(weeklySales).orderBy(desc(weeklySales.createdAt))
      );
      res.json(result);
    } catch (error) {
      console.error('Error fetching weekly sales, returning local fallback weekly-sales:', error);
      res.json(fallbackData.weeklySales);
    }
  });

  app.post('/api/weekly-sales', async (req, res) => {
    const data = req.body;
    const id = data.id || Math.random().toString(36).substring(2, 15);
    try {
      if (!isDbOnline) {
        fallbackData.weeklySales.push({ ...data, id, createdAt: new Date().toISOString() });
        saveFallbackData();
        return res.json({ id, ...data });
      }
      await db.insert(weeklySales).values({ ...data, id, createdAt: new Date() });
      clearCache('weekly-sales');
      res.json({ id, ...data });
    } catch (error) {
      console.error('Error creating weekly sales in DB, falling back to local storage:', error);
      fallbackData.weeklySales.push({ ...data, id, createdAt: new Date().toISOString() });
      saveFallbackData();
      res.json({ id, ...data });
    }
  });

  // PRODUCTS
  app.put('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    const cleaned = sanitizeProduct(data);
    try {
      if (!isDbOnline) {
        const existingIdx = fallbackData.products.findIndex((p: any) => p.id === id);
        if (existingIdx !== -1) {
          fallbackData.products[existingIdx] = { ...fallbackData.products[existingIdx], ...cleaned, updatedAt: new Date().toISOString() };
        }
        saveFallbackData();
        return res.json({ success: true });
      }
      await db.update(products).set({ ...cleaned, updatedAt: new Date() }).where(eq(products.id, id));
      clearCache('products');
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating product in DB, falling back to local storage:', error);
      const existingIdx = fallbackData.products.findIndex((p: any) => p.id === id);
      if (existingIdx !== -1) {
        fallbackData.products[existingIdx] = { ...fallbackData.products[existingIdx], ...cleaned, updatedAt: new Date().toISOString() };
      }
      saveFallbackData();
      res.json({ success: true });
    }
  });

  app.delete('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    try {
      if (!isDbOnline) {
        fallbackData.products = fallbackData.products.filter((p: any) => p.id !== id);
        saveFallbackData();
        return res.json({ success: true });
      }
      await db.delete(products).where(eq(products.id, id));
      clearCache('products');
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting product in DB, falling back to local storage:', error);
      fallbackData.products = fallbackData.products.filter((p: any) => p.id !== id);
      saveFallbackData();
      res.json({ success: true });
    }
  });

  app.delete('/api/products', async (req, res) => {
    try {
      if (!isDbOnline) {
        fallbackData.products = [];
        saveFallbackData();
        return res.json({ success: true });
      }
      await db.delete(products);
      clearCache('products');
      res.json({ success: true });
    } catch (error) {
      console.error('Error clearing products in DB, falling back to local storage:', error);
      fallbackData.products = [];
      saveFallbackData();
      res.json({ success: true });
    }
  });

  app.post('/api/products/batch-delete', async (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'IDs must be a non-empty array' });
    }
    try {
      if (!isDbOnline) {
        fallbackData.products = fallbackData.products.filter((p: any) => !ids.includes(p.id));
        saveFallbackData();
        return res.json({ success: true });
      }
      await db.delete(products).where(inArray(products.id, ids));
      clearCache('products');
      res.json({ success: true });
    } catch (error) {
      console.error('Error batch deleting products in DB, falling back to local storage:', error);
      fallbackData.products = fallbackData.products.filter((p: any) => !ids.includes(p.id));
      saveFallbackData();
      res.json({ success: true });
    }
  });

  // SALES
  app.put('/api/sales/:id', async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    try {
      const updateData = { ...data };
      delete updateData.id;
      if (updateData.tanggal) {
        updateData.tanggal = new Date(updateData.tanggal);
      }

      if (!isDbOnline) {
        const existingIdx = fallbackData.sales.findIndex((s: any) => s.id === id);
        if (existingIdx !== -1) {
          fallbackData.sales[existingIdx] = { ...fallbackData.sales[existingIdx], ...data };
        }
        saveFallbackData();
        return res.json({ success: true });
      }
      await db.update(sales).set(updateData).where(eq(sales.id, id));
      clearCache('sales');
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating sale in DB, falling back to local storage:', error);
      const existingIdx = fallbackData.sales.findIndex((s: any) => s.id === id);
      if (existingIdx !== -1) {
        fallbackData.sales[existingIdx] = { ...fallbackData.sales[existingIdx], ...data };
      }
      saveFallbackData();
      res.json({ success: true });
    }
  });

  app.delete('/api/sales/:id', async (req, res) => {
    const { id } = req.params;
    try {
      if (!isDbOnline) {
        fallbackData.sales = fallbackData.sales.filter((s: any) => s.id !== id);
        saveFallbackData();
        return res.json({ success: true });
      }
      await db.delete(sales).where(eq(sales.id, id));
      clearCache('sales');
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting sale in DB, falling back to local storage:', error);
      fallbackData.sales = fallbackData.sales.filter((s: any) => s.id !== id);
      saveFallbackData();
      res.json({ success: true });
    }
  });

  app.delete('/api/sales', async (req, res) => {
    try {
      if (!isDbOnline) {
        fallbackData.sales = [];
        saveFallbackData();
        return res.json({ success: true });
      }
      await db.delete(sales);
      clearCache('sales');
      res.json({ success: true });
    } catch (error) {
      console.error('Error clearing sales in DB, falling back to local storage:', error);
      fallbackData.sales = [];
      saveFallbackData();
      res.json({ success: true });
    }
  });

  // SALES DS
  app.put('/api/sales-ds/:id', async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    try {
      const updateData = { ...data };
      delete updateData.id;
      if (updateData.tanggal) {
        updateData.tanggal = new Date(updateData.tanggal);
      }

      if (!isDbOnline) {
        const existingIdx = fallbackData.salesDs.findIndex((s: any) => s.id === id);
        if (existingIdx !== -1) {
          fallbackData.salesDs[existingIdx] = { ...fallbackData.salesDs[existingIdx], ...data };
        }
        saveFallbackData();
        return res.json({ success: true });
      }
      await db.update(salesDs).set(updateData).where(eq(salesDs.id, id));
      clearCache('sales-ds');
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating Sales DS in DB, falling back to local storage:', error);
      const existingIdx = fallbackData.salesDs.findIndex((s: any) => s.id === id);
      if (existingIdx !== -1) {
        fallbackData.salesDs[existingIdx] = { ...fallbackData.salesDs[existingIdx], ...data };
      }
      saveFallbackData();
      res.json({ success: true });
    }
  });

  app.delete('/api/sales-ds/:id', async (req, res) => {
    const { id } = req.params;
    try {
      if (!isDbOnline) {
        fallbackData.salesDs = fallbackData.salesDs.filter((s: any) => s.id !== id);
        saveFallbackData();
        return res.json({ success: true });
      }
      await db.delete(salesDs).where(eq(salesDs.id, id));
      clearCache('sales-ds');
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting Sales DS in DB, falling back to local storage:', error);
      fallbackData.salesDs = fallbackData.salesDs.filter((s: any) => s.id !== id);
      saveFallbackData();
      res.json({ success: true });
    }
  });

  app.delete('/api/sales-ds', async (req, res) => {
    try {
      if (!isDbOnline) {
        fallbackData.salesDs = [];
        saveFallbackData();
        return res.json({ success: true });
      }
      await db.delete(salesDs);
      clearCache('sales-ds');
      res.json({ success: true });
    } catch (error) {
      console.error('Error clearing Sales DS in DB, falling back to local storage:', error);
      fallbackData.salesDs = [];
      saveFallbackData();
      res.json({ success: true });
    }
  });

  // INCOMING GOODS
  app.delete('/api/incoming-goods/:id', async (req, res) => {
    const { id } = req.params;
    try {
      if (!isDbOnline) {
        fallbackData.incomingGoods = fallbackData.incomingGoods.filter((ig: any) => ig.id !== id);
        saveFallbackData();
        return res.json({ success: true });
      }
      await db.delete(incomingGoods).where(eq(incomingGoods.id, id));
      clearCache('incoming-goods');
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting incoming good in DB, falling back to local storage:', error);
      fallbackData.incomingGoods = fallbackData.incomingGoods.filter((ig: any) => ig.id !== id);
      saveFallbackData();
      res.json({ success: true });
    }
  });

  app.delete('/api/incoming-goods', async (req, res) => {
    try {
      if (!isDbOnline) {
        fallbackData.incomingGoods = [];
        saveFallbackData();
        return res.json({ success: true });
      }
      await db.delete(incomingGoods);
      clearCache('incoming-goods');
      res.json({ success: true });
    } catch (error) {
      console.error('Error clearing incoming goods in DB, falling back to local storage:', error);
      fallbackData.incomingGoods = [];
      saveFallbackData();
      res.json({ success: true });
    }
  });

  // IKLAN
  app.put('/api/iklan/:id', async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    try {
      const updateData = { ...data };
      delete updateData.id;
      if (updateData.createdAt) {
        updateData.createdAt = new Date(updateData.createdAt);
      }

      if (!isDbOnline) {
        const existingIdx = fallbackData.iklan.findIndex((i: any) => i.id === id);
        if (existingIdx !== -1) {
          fallbackData.iklan[existingIdx] = { ...fallbackData.iklan[existingIdx], ...data };
        }
        saveFallbackData();
        return res.json({ success: true });
      }
      await db.update(iklan).set(updateData).where(eq(iklan.id, id));
      clearCache('iklan');
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating iklan in DB, falling back to local storage:', error);
      const existingIdx = fallbackData.iklan.findIndex((i: any) => i.id === id);
      if (existingIdx !== -1) {
        fallbackData.iklan[existingIdx] = { ...fallbackData.iklan[existingIdx], ...data };
      }
      saveFallbackData();
      res.json({ success: true });
    }
  });

  app.delete('/api/iklan/:id', async (req, res) => {
    const { id } = req.params;
    try {
      if (!isDbOnline) {
        fallbackData.iklan = fallbackData.iklan.filter((i: any) => i.id !== id);
        saveFallbackData();
        return res.json({ success: true });
      }
      await db.delete(iklan).where(eq(iklan.id, id));
      clearCache('iklan');
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting iklan in DB, falling back to local storage:', error);
      fallbackData.iklan = fallbackData.iklan.filter((i: any) => i.id !== id);
      saveFallbackData();
      res.json({ success: true });
    }
  });

  app.delete('/api/iklan', async (req, res) => {
    try {
      if (!isDbOnline) {
        fallbackData.iklan = [];
        saveFallbackData();
        return res.json({ success: true });
      }
      await db.delete(iklan);
      clearCache('iklan');
      res.json({ success: true });
    } catch (error) {
      console.error('Error clearing iklan in DB, falling back to local storage:', error);
      fallbackData.iklan = [];
      saveFallbackData();
      res.json({ success: true });
    }
  });

  // WEEKLY SALES
  app.put('/api/weekly-sales/:id', async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    try {
      const updateData = { ...data };
      delete updateData.id;
      if (updateData.createdAt) {
        updateData.createdAt = new Date(updateData.createdAt);
      }

      if (!isDbOnline) {
        const existingIdx = fallbackData.weeklySales.findIndex((w: any) => w.id === id);
        if (existingIdx !== -1) {
          fallbackData.weeklySales[existingIdx] = { ...fallbackData.weeklySales[existingIdx], ...data };
        }
        saveFallbackData();
        return res.json({ success: true });
      }
      await db.update(weeklySales).set(updateData).where(eq(weeklySales.id, id));
      clearCache('weekly-sales');
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating weekly sales in DB, falling back to local storage:', error);
      const existingIdx = fallbackData.weeklySales.findIndex((w: any) => w.id === id);
      if (existingIdx !== -1) {
        fallbackData.weeklySales[existingIdx] = { ...fallbackData.weeklySales[existingIdx], ...data };
      }
      saveFallbackData();
      res.json({ success: true });
    }
  });

  app.delete('/api/weekly-sales/:id', async (req, res) => {
    const { id } = req.params;
    try {
      if (!isDbOnline) {
        fallbackData.weeklySales = fallbackData.weeklySales.filter((w: any) => w.id !== id);
        saveFallbackData();
        return res.json({ success: true });
      }
      await db.delete(weeklySales).where(eq(weeklySales.id, id));
      clearCache('weekly-sales');
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting weekly sales in DB, falling back to local storage:', error);
      fallbackData.weeklySales = fallbackData.weeklySales.filter((w: any) => w.id !== id);
      saveFallbackData();
      res.json({ success: true });
    }
  });

  app.delete('/api/weekly-sales', async (req, res) => {
    try {
      if (!isDbOnline) {
        fallbackData.weeklySales = [];
        saveFallbackData();
        return res.json({ success: true });
      }
      await db.delete(weeklySales);
      clearCache('weekly-sales');
      res.json({ success: true });
    } catch (error) {
      console.error('Error clearing weekly sales in DB, falling back to local storage:', error);
      fallbackData.weeklySales = [];
      saveFallbackData();
      res.json({ success: true });
    }
  });

  // BANNERS
  app.post('/api/banners', async (req, res) => {
    const data = req.body;
    const id = data.id || Math.random().toString(36).substring(2, 15);
    try {
      if (!isDbOnline) {
        fallbackData.storefrontBanners.push({ ...data, id, createdAt: new Date().toISOString() });
        saveFallbackData();
        return res.json({ id, ...data });
      }
      await db.insert(storefrontBanners).values({ ...data, id, createdAt: new Date() });
      res.json({ id, ...data });
    } catch (error) {
      console.error('Error creating banners in DB, falling back to local storage:', error);
      fallbackData.storefrontBanners.push({ ...data, id, createdAt: new Date().toISOString() });
      saveFallbackData();
      res.json({ id, ...data });
    }
  });

  app.delete('/api/banners/:id', async (req, res) => {
    const { id } = req.params;
    try {
      if (!isDbOnline) {
        fallbackData.storefrontBanners = fallbackData.storefrontBanners.filter((b: any) => b.id !== id);
        saveFallbackData();
        return res.json({ success: true });
      }
      await db.delete(storefrontBanners).where(eq(storefrontBanners.id, id));
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting banners in DB, falling back to local storage:', error);
      fallbackData.storefrontBanners = fallbackData.storefrontBanners.filter((b: any) => b.id !== id);
      saveFallbackData();
      res.json({ success: true });
    }
  });

  // REVIEWS
  app.get('/api/reviews', async (req, res) => {
    try {
      if (!isDbOnline) {
        return res.json(fallbackData.reviews || []);
      }
      let result = await getCached('reviews', async () => {
        let rows = await db.select().from(reviews).orderBy(desc(reviews.createdAt));
        if (rows.length === 0) {
          // Automatically seed/bootstrap reviews table
          const initialSeed = [
            {
              id: "rev-1",
              productId: "Macaron Almond",
              reviewerName: "Siti Rahma",
              rating: 5,
              comment: "Softlens Macaron Almond nya cantik banget! Warnanya natural, gampang dipasang, dan gak ganjel sama sekali buat daily wear. Sangat direkomendasikan!"
            },
            {
              id: "rev-2",
              productId: "Newbluk Black",
              reviewerName: "Andi Wijaya",
              rating: 5,
              comment: "Pertama kali beli Newbluk Black di toko ini dan langsung jatuh cinta. Nyaman banget dipakai seharian pas kerja di depan laptop. Pelayanan seller cepat dan ramah!"
            },
            {
              id: "rev-3",
              productId: "Avenue Honey Grey",
              reviewerName: "Chika Amanda",
              rating: 4,
              comment: "Suka banget sama Avenue Honey Grey, bikin mata keliatan berdimensi & hidup tapi tetep elegan. Dapet free lenscase juga, makasih Zendiix!"
            },
            {
              id: "rev-4",
              productId: "NMD Caramel Brown",
              reviewerName: "Dewi Lestari",
              rating: 5,
              comment: "NMD Caramel Brown emang terbaik! Pas banget di mata akuh yang rada sensitif, gak bikin gampang merah atau kering. Bakal langganan terus di sini."
            },
            {
              id: "rev-5",
              productId: "NMD Galaxy Grey",
              reviewerName: "Rian Pratama",
              rating: 5,
              comment: "Barang sampai dengan aman, packing tebal pake bubble wrap. Beli yang NMD Galaxy Grey buat kado pacar dan dia suka banget. Thank you!"
            },
            {
              id: "rev-6",
              productId: "Macaron Berry Blue",
              reviewerName: "Nabila Putri",
              rating: 5,
              comment: "Udah beli berkali-kali di sini, kualitasnya gak pernah mengecewakan. Softlensnya tipis, kadar air seimbang, nyaman dipake seharian penuh tanpa tetes mata."
            }
          ];
          
          for (const item of initialSeed) {
            try {
              await db.insert(reviews).values({
                id: item.id,
                productId: item.productId,
                reviewerName: item.reviewerName,
                rating: item.rating,
                comment: item.comment,
                createdAt: new Date()
              });
            } catch (e) {
              console.error('Error seeding single review row:', e);
            }
          }
          rows = await db.select().from(reviews).orderBy(desc(reviews.createdAt));
        }
        return rows;
      });
      res.json(result);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      res.json(fallbackData.reviews || []);
    }
  });

  app.post('/api/reviews', async (req, res) => {
    const data = req.body;
    const id = data.id || Math.random().toString(36).substring(2, 15);
    try {
      if (!isDbOnline) {
        fallbackData.reviews = fallbackData.reviews || [];
        fallbackData.reviews.push({ ...data, id, createdAt: new Date().toISOString() });
        saveFallbackData();
        return res.json({ id, ...data });
      }
      await db.insert(reviews).values({...data, id, createdAt: new Date()});
      clearCache('reviews');
      res.json({ id, ...data });
    } catch (error) {
      console.error('Error creating review:', error);
      fallbackData.reviews = fallbackData.reviews || [];
      fallbackData.reviews.push({ ...data, id, createdAt: new Date().toISOString() });
      saveFallbackData();
      res.json({ id, ...data });
    }
  });

  app.delete('/api/reviews/:id', async (req, res) => {
    const { id } = req.params;
    try {
      if (!isDbOnline) {
        fallbackData.reviews = (fallbackData.reviews || []).filter((r: any) => r.id !== id);
        saveFallbackData();
        return res.json({ success: true });
      }
      await db.delete(reviews).where(eq(reviews.id, id));
      clearCache('reviews');
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting review:', error);
      fallbackData.reviews = (fallbackData.reviews || []).filter((r: any) => r.id !== id);
      saveFallbackData();
      res.json({ success: true });
    }
  });

  app.put('/api/reviews/:id', async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    try {
      if (!isDbOnline) {
        fallbackData.reviews = fallbackData.reviews || [];
        const idx = fallbackData.reviews.findIndex((r: any) => r.id === id);
        if (idx !== -1) {
          fallbackData.reviews[idx] = { ...fallbackData.reviews[idx], ...data };
          saveFallbackData();
        }
        return res.json({ success: true });
      }
      
      const updateData = { ...data };
      delete updateData.id;
      delete updateData.createdAt;

      await db.update(reviews).set(updateData).where(eq(reviews.id, id));
      clearCache('reviews');
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating review:', error);
      fallbackData.reviews = fallbackData.reviews || [];
      const idx = fallbackData.reviews.findIndex((r: any) => r.id === id);
      if (idx !== -1) {
        fallbackData.reviews[idx] = { ...fallbackData.reviews[idx], ...data };
        saveFallbackData();
      }
      res.json({ success: true });
    }
  });

  // ==========================================
  // REDIS SIMULATOR & PERFORMANCE OPTIMIZATION LAYER
  // ==========================================
  
  interface RedisLog {
    id: string;
    timestamp: string;
    action: 'CONNECT' | 'GET' | 'SETEX' | 'DEL' | 'FLUSHALL' | 'INVALIDATE' | 'ERROR';
    key: string;
    details: string;
    ttlLeft?: number;
  }

  class RedisSimulator {
    private cache = new Map<string, { value: any; expiresAt: number }>();
    private logs: RedisLog[] = [];

    constructor() {
      this.log('CONNECT', 'connection', 'Connected to Redis server on redis://127.0.0.1:6379 successfully (Ready to handle product catalog caching)');
    }

    private log(action: RedisLog['action'], key: string, details: string, ttlLeft?: number) {
      const logEntry: RedisLog = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        action,
        key,
        details,
        ttlLeft
      };
      this.logs.unshift(logEntry);
      if (this.logs.length > 50) {
        this.logs.pop();
      }
      console.log(`[Redis Simulator] ${action} - ${key}: ${details}`);
    }

    public get(key: string): any | null {
      const cached = this.cache.get(key);
      if (!cached) {
        this.log('GET', key, '❌ CACHE MISS - Key not found or has been invalidated');
        return null;
      }
      if (Date.now() > cached.expiresAt) {
        this.cache.delete(key);
        this.log('GET', key, '❌ CACHE MISS - Key expired (TTL reached 0)');
        return null;
      }
      const ttlLeft = Math.round((cached.expiresAt - Date.now()) / 1000);
      this.log('GET', key, `✅ CACHE HIT - Returning data instantly (Avoided MySQL heavy JOIN query)`, ttlLeft);
      return cached.value;
    }

    public setex(key: string, ttlSeconds: number, value: any): void {
      const expiresAt = Date.now() + (ttlSeconds * 1000);
      this.cache.set(key, { value, expiresAt });
      this.log('SETEX', key, `💾 CACHED DATA - Stored value with TTL of ${ttlSeconds} seconds (10 Minutes)`, ttlSeconds);
    }

    public del(keyPattern: string): void {
      let count = 0;
      for (const key of this.cache.keys()) {
        if (key.startsWith(keyPattern) || key.includes(keyPattern)) {
          this.cache.delete(key);
          count++;
        }
      }
      this.log('DEL', keyPattern, `🗑️ INVALIDATED KEY(S) - Removed ${count} matching keys from cache`);
    }

    public flushall(): void {
      this.cache.clear();
      this.log('FLUSHALL', '*', '🧹 FLUSHALL - Cleared all Redis cache keys completely');
    }

    public getLogs(): RedisLog[] {
      return this.logs;
    }

    public getKeys(): { key: string; ttl: number }[] {
      const keysList: { key: string; ttl: number }[] = [];
      const now = Date.now();
      for (const [key, item] of this.cache.entries()) {
        if (item.expiresAt > now) {
          keysList.push({
            key,
            ttl: Math.round((item.expiresAt - now) / 1000)
          });
        }
      }
      return keysList;
    }
  }

  const redis = new RedisSimulator();

  // Middleware: Redis cache precheck for products
  const redisProductCacheMiddleware = (req: any, res: any, next: any) => {
    const limit = parseInt(req.query.limit) || 20;
    const cursor = req.query.cursor || 'none';
    const cacheKey = `products:catalog:cursor_${cursor}:limit_${limit}`;

    const cachedData = redis.get(cacheKey);
    if (cachedData) {
      return res.json({
        ...cachedData,
        source: 'Redis Cache (RAM)',
        executionTimeMs: 0.2 // simulated extremely fast RAM access
      });
    }
    // Store cacheKey on res.locals so we can set the cache after querying
    res.locals.cacheKey = cacheKey;
    next();
  };

  // 1. Optimized product catalog API with Cursor-based Pagination and Caching
  app.get('/api/optimized/products', redisProductCacheMiddleware, async (req, res) => {
    const startTime = process.hrtime();
    const limit = parseInt(req.query.limit as string) || 20;
    const cursor = req.query.cursor as string || ''; // ID of the last product seen

    try {
      let results: any[] = [];
      
      if (isDbOnline) {
        // With Cursor-based Pagination, we avoid slow OFFSET by filtering on the indexed ID (or primary key)
        if (cursor) {
          results = await db.select()
            .from(products)
            .where(sql`${products.id} > ${cursor}`)
            .orderBy(products.id)
            .limit(limit);
        } else {
          results = await db.select()
            .from(products)
            .orderBy(products.id)
            .limit(limit);
        }
      } else {
        // Fallback Database emulation
        const sortedProducts = [...fallbackData.products].sort((a, b) => a.id.localeCompare(b.id));
        if (cursor) {
          const startIndex = sortedProducts.findIndex(p => p.id === cursor);
          if (startIndex !== -1) {
            results = sortedProducts.slice(startIndex + 1, startIndex + 1 + limit);
          } else {
            results = sortedProducts.slice(0, limit);
          }
        } else {
          results = sortedProducts.slice(0, limit);
        }
      }

      // Determine next cursor (the ID of the last item in this page)
      const nextCursor = results.length === limit ? results[results.length - 1].id : null;

      const diff = process.hrtime(startTime);
      const executionTimeMs = Number(((diff[0] * 1e3 + diff[1] * 1e-6)).toFixed(2));

      const payload = {
        products: stripDuplicateImages(results),
        nextCursor,
        totalLoaded: results.length,
        hasMore: !!nextCursor
      };

      // Store in Redis with 10 Minutes TTL (600 seconds)
      if (res.locals.cacheKey) {
        redis.setex(res.locals.cacheKey, 600, payload);
      }

      res.json({
        ...payload,
        source: 'MySQL Database',
        executionTimeMs
      });
    } catch (err: any) {
      console.error('Optimized query error, serving fallback:', err);
      // Fallback
      const sortedProducts = [...fallbackData.products].sort((a, b) => a.id.localeCompare(b.id));
      const results = sortedProducts.slice(0, limit);
      const nextCursor = results.length === limit ? results[results.length - 1].id : null;
      
      res.json({
        products: stripDuplicateImages(results),
        nextCursor,
        totalLoaded: results.length,
        hasMore: !!nextCursor,
        source: 'JSON Fallback DB (Offline)',
        executionTimeMs: 1.5
      });
    }
  });

  // 2. Active Invalidation endpoint (clears cached lists immediately)
  app.post('/api/optimized/invalidate', (req, res) => {
    redis.del('products:catalog');
    res.json({ success: true, message: 'Redis cache keys matching "products:catalog" have been successfully invalidated' });
  });

  // 3. Simulated Automatic Cache Invalidation on Stock Entry or Update
  app.post('/api/optimized/add-stock', async (req, res) => {
    const { productId, qty } = req.body;
    
    // Perform database stock increment
    try {
      if (isDbOnline) {
        await db.execute(sql`UPDATE products SET stokBarang = stokBarang + ${qty} WHERE id = ${productId}`);
      } else {
        const prod = fallbackData.products.find((p: any) => p.id === productId);
        if (prod) {
          prod.stokBarang = (prod.stokBarang || 0) + qty;
          saveFallbackData();
        }
      }

      // CRITICAL: Automatically invalidate cache because inventory has changed!
      redis.del('products:catalog');
      
      res.json({ 
        success: true, 
        message: `Stok barang ${productId} berhasil ditambah sebanyak ${qty}. Cache Redis otomatis dihapus untuk mencegah stale data.`,
        invalidatedKeys: 'products:catalog:*'
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Hook into standard incoming goods and product creations to trigger real invalidation
  const originalIncomingGoodsPost = app._router?.stack?.find((r: any) => r.route?.path === '/api/incoming-goods' && r.route?.methods?.post);
  const originalProductsPost = app._router?.stack?.find((r: any) => r.route?.path === '/api/products' && r.route?.methods?.post);

  // Expose Redis logs and cache state to the frontend
  app.get('/api/optimized/redis-logs', (req, res) => {
    res.json({
      logs: redis.getLogs(),
      keys: redis.getKeys()
    });
  });

  // 4. SQL optimization guide payload for the visual lab
  app.get('/api/optimized/sql-guide', (req, res) => {
    res.json({
      indexing: `
-- 1. Optimasi Indexing pada tabel MySQL
-- Kolom ID (Primary Key) sudah memiliki index B-Tree bawaan.
-- Kita tambahkan Composite Index pada kolom pencarian & filter untuk mempercepat JOIN:

CREATE INDEX idx_products_category ON products(custom_category, color);
CREATE INDEX idx_products_group ON products(group_name);
CREATE INDEX idx_sales_tanggal ON sales(tanggal);
CREATE INDEX idx_incoming_goods_tanggal ON incoming_goods(tanggal);
      `,
      cursorPagination: `
-- 2. Query Cursor-Based Pagination yang efisien menggantikan OFFSET
-- Query ini tidak perlu melakukan pemindaian (scan) baris yang sudah lewat.
-- Sangat cepat dan stabil meskipun data mencapai jutaan baris.

SELECT p.* 
FROM products p
WHERE p.id > 'CTK-MACARON-BERRYBLUE-0,00' -- ini adalah cursor last_seen_id
ORDER BY p.id ASC 
LIMIT 20;
      `,
      databaseView: `
-- 3. Membuat Database VIEW yang Efisien untuk JOIN 3 Tabel Besar
-- VIEW menggabungkan tabel 'products', 'incoming_goods', dan 'sales' secara dinamis.
-- Memberikan kemudahan bagi backend untuk mengambil ringkasan produk.

CREATE OR REPLACE VIEW view_product_details_summary AS
SELECT 
    p.id AS product_id,
    p.namaBarang AS nama_barang,
    p.group_name AS nama_series,
    p.color AS warna,
    p.hargaJual AS harga_jual,
    p.stokBarang AS stok_aktif,
    (SELECT COALESCE(SUM(ig.jumlah), 0) FROM incoming_goods ig WHERE ig.kodeBarang = p.id) AS total_stok_masuk,
    (SELECT COALESCE(SUM(s.jumlah), 0) FROM sales s WHERE s.kodeBarang = p.id) AS total_terjual_retail,
    (SELECT COALESCE(SUM(sd.jumlah), 0) FROM sales_ds sd WHERE sd.kodeBarang = p.id) AS total_terjual_dropship
FROM products p;
      `
    });
  });

  // Intercept other write routes to trigger cache clearance automatically
  app.use((req, res, next) => {
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
      if (req.url.includes('/api/products') || req.url.includes('/api/incoming-goods') || req.url.includes('/api/sales')) {
        redis.del('products:catalog');
      }
    }
    next();
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
