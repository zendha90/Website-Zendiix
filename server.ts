import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './src/db';
import { products, incomingGoods, sales, salesDs, iklan, weeklySales, storefrontBanners, settings } from './src/db/schema';
import { eq, desc, sql } from 'drizzle-orm';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Bootstrap passive schema updates for cPanel MySQL
  try {
    await db.execute(sql`ALTER TABLE settings ADD COLUMN browser_title VARCHAR(255) NULL`);
  } catch (error) {
    // Column already exists or table doesn't exist yet
  }
  try {
    await db.execute(sql`ALTER TABLE settings ADD COLUMN favicon_url VARCHAR(500) NULL`);
  } catch (error) {
    // Column already exists or table doesn't exist yet
  }
  try {
    await db.execute(sql`ALTER TABLE products MODIFY COLUMN image_url MEDIUMTEXT NULL`);
  } catch (error) {
    // Table/Column might not be initialized yet
  }
  try {
    await db.execute(sql`ALTER TABLE settings MODIFY COLUMN logo_url MEDIUMTEXT NULL`);
  } catch (error) {
    // Table/Column might not be initialized yet
  }
  try {
    await db.execute(sql`ALTER TABLE settings MODIFY COLUMN favicon_url MEDIUMTEXT NULL`);
  } catch (error) {
    // Table/Column might not be initialized yet
  }
  try {
    await db.execute(sql`ALTER TABLE storefront_banners MODIFY COLUMN image_url MEDIUMTEXT NOT NULL`);
  } catch (error) {
    // Table/Column might not be initialized yet
  }

  // Health Check / DB Test
  app.get('/api/health-check', async (req, res) => {
    try {
      // Simple query to test connection
      await db.execute(sql`SELECT 1`);
      res.json({ 
        status: 'ok', 
        message: 'Database connection successful!',
        database: 'MySQL (cPanel)'
      });
    } catch (error: any) {
      console.error('Database connection failed:', error);
      let suggestedIp = '';
      if (error && error.message) {
        const match = error.message.match(/@'([^']+)'/);
        if (match && match[1]) {
          suggestedIp = match[1];
        }
      }
      res.json({ 
        status: 'error', 
        message: 'Database connection failed', 
        details: error.message,
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

  // Simple, short-duration server-side cache to protect cPanel MySQL from max_user_connections (5 client limit)
  const serverCache = new Map<string, { data: any; expires: number }>();
  const CACHE_STALE_MS = 5000; // Cache for 5 seconds

  async function getCached<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
    const cached = serverCache.get(key);
    const now = Date.now();
    if (cached && cached.expires > now) {
      return cached.data;
    }
    const fresh = await fetchFn();
    serverCache.set(key, { data: fresh, expires: now + CACHE_STALE_MS });
    return fresh;
  }

  function clearCache(key: string) {
    serverCache.delete(key);
  }

  // API Routes
  
  // Products
  app.get('/api/products', async (req, res) => {
    try {
      const allProducts = await getCached('products', () => 
        db.select().from(products).orderBy(desc(products.createdAt))
      );
      res.json(allProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  });

  app.post('/api/products', async (req, res) => {
    try {
      const data = req.body;
      const id = data.id || Math.random().toString(36).substring(2, 15);
      const cleaned = sanitizeProduct(data);
      
      const existing = data.id ? await db.select().from(products).where(eq(products.id, data.id)).limit(1) : [];
      if (existing.length > 0) {
        await db.update(products).set({ ...cleaned, updatedAt: new Date() }).where(eq(products.id, id));
      } else {
        await db.insert(products).values({ ...cleaned, id });
      }
      clearCache('products');
      res.json({ id, ...data });
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({ error: 'Failed' });
    }
  });

  // Settings
  app.get('/api/settings/branding', async (req, res) => {
    try {
      const result = await getCached('branding', () =>
        db.select().from(settings).where(eq(settings.id, 'branding')).limit(1)
      );
      res.json(result[0] || null);
    } catch (error) {
      console.error('Error fetching settings:', error);
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  });

  app.post('/api/settings/branding', async (req, res) => {
    try {
      const data = req.body;
      await db.insert(settings)
        .values({ id: 'branding', ...data })
        .onDuplicateKeyUpdate({
          set: { ...data, updatedAt: new Date() }
        });
      clearCache('branding');
      res.json({ id: 'branding', ...data });
    } catch (error) {
      console.error('Error updating settings:', error);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  });

  // Banners
  app.get('/api/banners', async (req, res) => {
    try {
      const bannersList = await getCached('banners', () =>
        db.select().from(storefrontBanners).orderBy(desc(storefrontBanners.createdAt))
      );
      res.json(bannersList);
    } catch (error) {
      console.error('Error fetching banners:', error);
      res.status(500).json({ error: 'Failed to fetch banners' });
    }
  });

  // Incoming Goods
  app.get('/api/incoming-goods', async (req, res) => {
    try {
      const result = await getCached('incoming-goods', () =>
        db.select().from(incomingGoods).orderBy(desc(incomingGoods.tanggal))
      );
      res.json(result);
    } catch (error) {
      console.error('Error fetching incoming goods:', error);
      res.status(500).json({ error: 'Failed' });
    }
  });

  app.post('/api/incoming-goods', async (req, res) => {
    try {
      const data = req.body;
      const id = data.id || Math.random().toString(36).substring(2, 15);
      await db.insert(incomingGoods).values({ ...data, id, tanggal: new Date() });
      clearCache('incoming-goods');
      res.json({ id, ...data });
    } catch (error) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  // Sales
  app.get('/api/sales', async (req, res) => {
    try {
      const result = await getCached('sales', () =>
        db.select().from(sales).orderBy(desc(sales.tanggal))
      );
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  app.post('/api/sales', async (req, res) => {
    try {
      const data = req.body;
      const id = data.id || Math.random().toString(36).substring(2, 15);
      await db.insert(sales).values({ ...data, id, tanggal: new Date() });
      clearCache('sales');
      res.json({ id, ...data });
    } catch (error) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  // Sales DS
  app.get('/api/sales-ds', async (req, res) => {
    try {
      const result = await getCached('sales-ds', () =>
        db.select().from(salesDs).orderBy(desc(salesDs.tanggal))
      );
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  app.post('/api/sales-ds', async (req, res) => {
    try {
      const data = req.body;
      const id = data.id || Math.random().toString(36).substring(2, 15);
      await db.insert(salesDs).values({ ...data, id, tanggal: new Date() });
      clearCache('sales-ds');
      res.json({ id, ...data });
    } catch (error) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  // Iklan
  app.get('/api/iklan', async (req, res) => {
    try {
      const result = await getCached('iklan', () =>
        db.select().from(iklan).orderBy(desc(iklan.createdAt))
      );
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  app.post('/api/iklan', async (req, res) => {
    try {
      const data = req.body;
      const id = data.id || Math.random().toString(36).substring(2, 15);
      await db.insert(iklan).values({ ...data, id, createdAt: new Date() });
      clearCache('iklan');
      res.json({ id, ...data });
    } catch (error) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  // Weekly Sales
  app.get('/api/weekly-sales', async (req, res) => {
    try {
      const result = await getCached('weekly-sales', () =>
        db.select().from(weeklySales).orderBy(desc(weeklySales.createdAt))
      );
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  app.post('/api/weekly-sales', async (req, res) => {
    try {
      const data = req.body;
      const id = data.id || Math.random().toString(36).substring(2, 15);
      await db.insert(weeklySales).values({ ...data, id, createdAt: new Date() });
      clearCache('weekly-sales');
      res.json({ id, ...data });
    } catch (error) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  // PRODUCTS
  app.put('/api/products/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const cleaned = sanitizeProduct(data);
      const result = await db.update(products).set({ ...cleaned, updatedAt: new Date() }).where(eq(products.id, id));
      clearCache('products');
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({ error: 'Failed' });
    }
  });

  app.delete('/api/products/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(products).where(eq(products.id, id));
      clearCache('products');
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  app.delete('/api/products', async (req, res) => {
    try {
      await db.delete(products);
      clearCache('products');
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  // SALES
  app.put('/api/sales/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;
      await db.update(sales).set(data).where(eq(sales.id, id));
      clearCache('sales');
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  app.delete('/api/sales/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(sales).where(eq(sales.id, id));
      clearCache('sales');
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  app.delete('/api/sales', async (req, res) => {
    try {
      await db.delete(sales);
      clearCache('sales');
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  // SALES DS
  app.put('/api/sales-ds/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;
      await db.update(salesDs).set(data).where(eq(salesDs.id, id));
      clearCache('sales-ds');
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  app.delete('/api/sales-ds/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(salesDs).where(eq(salesDs.id, id));
      clearCache('sales-ds');
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  app.delete('/api/sales-ds', async (req, res) => {
    try {
      await db.delete(salesDs);
      clearCache('sales-ds');
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  // INCOMING GOODS
  app.delete('/api/incoming-goods/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(incomingGoods).where(eq(incomingGoods.id, id));
      clearCache('incoming-goods');
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  app.delete('/api/incoming-goods', async (req, res) => {
    try {
      await db.delete(incomingGoods);
      clearCache('incoming-goods');
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  // IKLAN
  app.put('/api/iklan/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;
      await db.update(iklan).set(data).where(eq(iklan.id, id));
      clearCache('iklan');
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  app.delete('/api/iklan/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(iklan).where(eq(iklan.id, id));
      clearCache('iklan');
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  app.delete('/api/iklan', async (req, res) => {
    try {
      await db.delete(iklan);
      clearCache('iklan');
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  // WEEKLY SALES
  app.put('/api/weekly-sales/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;
      await db.update(weeklySales).set(data).where(eq(weeklySales.id, id));
      clearCache('weekly-sales');
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  app.delete('/api/weekly-sales/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(weeklySales).where(eq(weeklySales.id, id));
      clearCache('weekly-sales');
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  app.delete('/api/weekly-sales', async (req, res) => {
    try {
      await db.delete(weeklySales);
      clearCache('weekly-sales');
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  // BANNERS
  app.post('/api/banners', async (req, res) => {
    try {
      const data = req.body;
      const id = data.id || Math.random().toString(36).substring(2, 15);
      await db.insert(storefrontBanners).values({ ...data, id, createdAt: new Date() });
      res.json({ id, ...data });
    } catch (error) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  app.delete('/api/banners/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(storefrontBanners).where(eq(storefrontBanners.id, id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed' });
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
    const distPath = __dirname;
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
