import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { db } from './src/db';
import { products, incomingGoods, sales, salesDs, iklan, weeklySales, storefrontBanners, settings } from './src/db/schema';
import { eq, desc, sql } from 'drizzle-orm';

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
    ]
  };

  function loadFallbackData() {
    try {
      if (fs.existsSync(FALLBACK_FILE)) {
        const contents = fs.readFileSync(FALLBACK_FILE, 'utf8');
        const parsed = JSON.parse(contents);
        if (parsed.products) fallbackData.products = parsed.products;
        if (parsed.incomingGoods) fallbackData.incomingGoods = parsed.incomingGoods;
        if (parsed.sales) fallbackData.sales = parsed.sales;
        if (parsed.salesDs) fallbackData.salesDs = parsed.salesDs;
        if (parsed.iklan) fallbackData.iklan = parsed.iklan;
        if (parsed.weeklySales) fallbackData.weeklySales = parsed.weeklySales;
        if (parsed.storefrontBanners) fallbackData.storefrontBanners = parsed.storefrontBanners;
        if (parsed.settings) fallbackData.settings = parsed.settings;
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
        db.execute(sql`SELECT 1`),
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
        db.execute(sql`SELECT 1`),
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
      await db.execute(sql`ALTER TABLE settings MODIFY COLUMN logo_url MEDIUMTEXT NULL`);
    } catch (e) {}
    try {
      await db.execute(sql`ALTER TABLE settings MODIFY COLUMN favicon_url MEDIUMTEXT NULL`);
    } catch (e) {}
    try {
      await db.execute(sql`ALTER TABLE storefront_banners MODIFY COLUMN image_url MEDIUMTEXT NOT NULL`);
    } catch (e) {}
    console.log('Background schema check and bootstrap completed successfully.');
  })().catch(err => {
    console.error('Warning: Background database schema bootstrap check failed, server will remain active:', err);
  });

  // Health Check / DB Test
  app.get('/api/health-check', async (req, res) => {
    if (!isDbOnline) {
      return res.json({
        status: 'error',
        message: 'Database is offline (local fallback active)',
        details: 'Circuit breaker is active. Bypassing database to maintain high performance.',
        suggestedIp: '34.96.48.15'
      });
    }
    try {
      // Simple query to test connection with timeout protection
      await Promise.race([
        db.execute(sql`SELECT 1`),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Connection check timed out after 1.5 seconds')), 1500))
      ]);
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
      'imageUrl', 'durasi', 'gDia', 'diameter', 'rating', 'reviewsCount',
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

  // Resilient caching layer to handle DB load spikes and cPanel's 5 max_user_connections constraints.
  // When a database read fails due to connections, we serve the latest stale cached data or defaults.
  const serverCache = new Map<string, { data: any; expires: number }>();
  const CACHE_STALE_MS = 15000; // Cache database reads for 15 seconds

  async function getCached<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
    const cached = serverCache.get(key);
    const now = Date.now();
    
    // If we have verified cached data within expiry, return it immediately
    if (cached && cached.expires > now) {
      return cached.data;
    }
    
    try {
      // Timeout database read after 5 seconds to protect request/response loop
      const fresh = await Promise.race([
        fetchFn(),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Database query timed out')), 5000))
      ]);
      serverCache.set(key, { data: fresh, expires: now + CACHE_STALE_MS });
      return fresh;
    } catch (err: any) {
      console.error(`Database read error or timeout in getCached for key "${key}":`, err?.message || err);
      tripDbCircuit(`Read error or timeout on key "${key}": ${err?.message || err}`);
      if (cached) {
        console.warn(`Serving stale database backup cache for key "${key}"`);
        return cached.data;
      }
      throw err;
    }
  }

  function clearCache(key: string) {
    serverCache.delete(key);
  }

  async function runDbWrite<T>(writeFn: () => Promise<T>): Promise<T> {
    return Promise.race([
      writeFn(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Database write operation timed out')), 5000))
    ]);
  }

  // API Routes
  
  // Products
  app.get('/api/products', async (req, res) => {
    try {
      if (!isDbOnline) {
        const sorted = [...fallbackData.products].sort((a, b) => b.id.localeCompare(a.id));
        return res.json(sorted);
      }
      const allProducts = await getCached('products', () => 
        db.select().from(products).orderBy(desc(products.createdAt))
      );
      res.json(allProducts);
    } catch (error) {
      console.error('Error fetching products, returning local fallback products:', error);
      const sorted = [...fallbackData.products].sort((a, b) => b.id.localeCompare(a.id));
      res.json(sorted);
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
      if (isDbOnline) {
        await runDbWrite(async () => {
          await db.insert(incomingGoods).values(items);
        });
        clearCache('incoming-goods');
      } else {
        fallbackData.incomingGoods.push(...items);
        saveFallbackData();
      }
      res.json({ success: true, count: items.length });
    } catch (error) {
      console.error('Error in batch incoming goods insert:', error);
      res.status(500).send('Batch import failed');
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
        fallbackData.sales.push({ ...data, id, tanggal: new Date().toISOString() });
        saveFallbackData();
        return res.json({ id, ...data });
      }
      await db.insert(sales).values({ ...data, id, tanggal: new Date() });
      clearCache('sales');
      res.json({ id, ...data });
    } catch (error) {
      console.error('Error creating sale in DB, falling back to local storage:', error);
      fallbackData.sales.push({ ...data, id, tanggal: new Date().toISOString() });
      saveFallbackData();
      res.json({ id, ...data });
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

  // SALES
  app.put('/api/sales/:id', async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    try {
      if (!isDbOnline) {
        const existingIdx = fallbackData.sales.findIndex((s: any) => s.id === id);
        if (existingIdx !== -1) {
          fallbackData.sales[existingIdx] = { ...fallbackData.sales[existingIdx], ...data };
        }
        saveFallbackData();
        return res.json({ success: true });
      }
      await db.update(sales).set(data).where(eq(sales.id, id));
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
      if (!isDbOnline) {
        const existingIdx = fallbackData.salesDs.findIndex((s: any) => s.id === id);
        if (existingIdx !== -1) {
          fallbackData.salesDs[existingIdx] = { ...fallbackData.salesDs[existingIdx], ...data };
        }
        saveFallbackData();
        return res.json({ success: true });
      }
      await db.update(salesDs).set(data).where(eq(salesDs.id, id));
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
      if (!isDbOnline) {
        const existingIdx = fallbackData.iklan.findIndex((i: any) => i.id === id);
        if (existingIdx !== -1) {
          fallbackData.iklan[existingIdx] = { ...fallbackData.iklan[existingIdx], ...data };
        }
        saveFallbackData();
        return res.json({ success: true });
      }
      await db.update(iklan).set(data).where(eq(iklan.id, id));
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
      if (!isDbOnline) {
        const existingIdx = fallbackData.weeklySales.findIndex((w: any) => w.id === id);
        if (existingIdx !== -1) {
          fallbackData.weeklySales[existingIdx] = { ...fallbackData.weeklySales[existingIdx], ...data };
        }
        saveFallbackData();
        return res.json({ success: true });
      }
      await db.update(weeklySales).set(data).where(eq(weeklySales.id, id));
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
