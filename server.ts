import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './src/db';
import { products, incomingGoods, sales, salesDs, iklan, weeklySales, storefrontBanners, settings } from './src/db/schema';
import { eq, desc, sql } from 'drizzle-orm';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

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

  // API Routes
  
  // Products
  app.get('/api/products', async (req, res) => {
    try {
      const allProducts = await db.select().from(products).orderBy(desc(products.createdAt));
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
      await db.insert(products).values({ ...data, id });
      res.json({ id, ...data });
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({ error: 'Failed' });
    }
  });

  // Settings
  app.get('/api/settings/branding', async (req, res) => {
    try {
      const result = await db.select().from(settings).where(eq(settings.id, 'branding')).limit(1);
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
      res.json({ id: 'branding', ...data });
    } catch (error) {
      console.error('Error updating settings:', error);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  });

  // Banners
  app.get('/api/banners', async (req, res) => {
    try {
      const banners = await db.select().from(storefrontBanners).orderBy(desc(storefrontBanners.createdAt));
      res.json(banners);
    } catch (error) {
      console.error('Error fetching banners:', error);
      res.status(500).json({ error: 'Failed to fetch banners' });
    }
  });

  // Incoming Goods
  app.get('/api/incoming-goods', async (req, res) => {
    try {
      const result = await db.select().from(incomingGoods).orderBy(desc(incomingGoods.tanggal));
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
      res.json({ id, ...data });
    } catch (error) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  // Sales
  app.get('/api/sales', async (req, res) => {
    try {
      const result = await db.select().from(sales).orderBy(desc(sales.tanggal));
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
      res.json({ id, ...data });
    } catch (error) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  // Sales DS
  app.get('/api/sales-ds', async (req, res) => {
    try {
      const result = await db.select().from(salesDs).orderBy(desc(salesDs.tanggal));
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
      res.json({ id, ...data });
    } catch (error) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  // Iklan
  app.get('/api/iklan', async (req, res) => {
    try {
      const result = await db.select().from(iklan).orderBy(desc(iklan.createdAt));
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
      res.json({ id, ...data });
    } catch (error) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  // Weekly Sales
  app.get('/api/weekly-sales', async (req, res) => {
    try {
      const result = await db.select().from(weeklySales).orderBy(desc(weeklySales.createdAt));
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
      const result = await db.update(products).set({ ...data, updatedAt: new Date() }).where(eq(products.id, id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  app.delete('/api/products/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(products).where(eq(products.id, id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  app.delete('/api/products', async (req, res) => {
    try {
      await db.delete(products);
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
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  app.delete('/api/sales/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(sales).where(eq(sales.id, id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  app.delete('/api/sales', async (req, res) => {
    try {
      await db.delete(sales);
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
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  app.delete('/api/sales-ds/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(salesDs).where(eq(salesDs.id, id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  app.delete('/api/sales-ds', async (req, res) => {
    try {
      await db.delete(salesDs);
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
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  app.delete('/api/incoming-goods', async (req, res) => {
    try {
      await db.delete(incomingGoods);
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
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  app.delete('/api/iklan/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(iklan).where(eq(iklan.id, id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  app.delete('/api/iklan', async (req, res) => {
    try {
      await db.delete(iklan);
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
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  app.delete('/api/weekly-sales/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(weeklySales).where(eq(weeklySales.id, id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  app.delete('/api/weekly-sales', async (req, res) => {
    try {
      await db.delete(weeklySales);
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
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
