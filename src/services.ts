import { queryClient } from './queryClient';

export interface Product {
  id?: string;
  kodeBarang: string;
  namaBarang: string;
  supplier: string;
  hargaBeli: number;
  hargaJual: number;
  stokAwal: number;
  stokBarang?: number;
  terjual?: number;
  color: string;
  bc: string;
  kadarAir: string;
  imageUrl?: string;
  seriesImageUrl?: string;
  durasi?: string;
  gDia?: string;
  diameter?: string;
  rating?: number;
  reviewsCount?: number;
  allowDualPower?: boolean;
  groupName?: string;
  customCategory?: string;
  hideSpecs?: boolean;
  notSoftlens?: boolean;
  description?: string;
  isFlashSale?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface IncomingGood {
  id?: string;
  productId: string;
  kodeBarang: string;
  namaBarang: string;
  qty: number;
  tanggal: any;
  supplier?: string;
}

export interface Sale {
  id?: string;
  productId: string;
  kodeBarang: string;
  namaBarang: string;
  qty: number;
  totalHarga: number;
  tanggalOrder?: string;
  channel?: string;
  noPesanan?: string;
  noResi?: string;
  namaEkspedisi?: string;
  hpp?: number;
  totalHpp?: number;
  laba?: number;
  tanggal: any;
}

export interface SaleDS {
  id?: string;
  kodeSupplier: string;
  tanggalOrder: string;
  channel: string;
  noPesanan: string;
  noResi: string;
  namaPelanggan: string;
  alamatPelanggan: string;
  namaProduk: string;
  qty: number;
  hpp: number;
  totalPenjualan: number;
  ongkosKirim: number;
  laba: number;
  tanggal: any;
}

export interface Iklan {
  id?: string;
  tanggal: string;
  totalPembayaran: number;
  noPesanan: string;
  createdAt?: any;
}

export interface WeeklySale {
  id?: string;
  tahun: number;
  bulan: number;
  minggu: number;
  tanggalStart: number;
  tanggalEnd: number;
  profit: number;
  profitDS: number;
  totalProfit: number;
  iklan: number;
  roi: number;
  hpp: number;
  createdAt?: any;
}

export interface StorefrontBanner {
  id?: string;
  imageUrl: string;
  linkUrl?: string;
  createdAt?: any;
}

export interface Review {
  id?: string;
  productId: string;
  reviewerName: string;
  rating: number;
  comment?: string;
  photoUrl?: string;
  isPinned?: boolean;
  createdAt?: any;
}

export interface BrandingSettings {
  announcementTexts: string[];
  logoText: string;
  logoUrl?: string;
  footerAboutText: string;
  browserTitle?: string;
  faviconUrl?: string;
  updatedAt?: any;
}

// Utility for fetching
export async function fetchApi(path: string, options?: RequestInit) {
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`API Error: ${res.status} ${errText || res.statusText}`);
  }
  return res.json();
}

// Registry to store the runFetch callbacks for all active smart subscribers
const subscribersRegistry = new Map<string, Set<() => void>>();

export function triggerFetch(path: string) {
  const listeners = subscribersRegistry.get(path);
  if (listeners) {
    listeners.forEach(runFetch => {
      try {
        runFetch();
      } catch (e) {
        console.error(`Error triggering subscriber for ${path}:`, e);
      }
    });
  }
}

// Smart subscription creator to save background API requests, optimize memory queries, and respect tab visibility states
function createSmartSubscriber<T>(path: string, callback: (data: T) => void, intervalMs = 60000, defaultValue?: T) {
  let active = true;
  const runFetch = () => {
    if (!active || document.visibilityState !== 'visible') return;
    fetchApi(path)
      .then(data => {
        if (active) {
          if (data !== undefined && data !== null) callback(data);
          else if (defaultValue !== undefined) callback(defaultValue);
        }
      })
      .catch(err => console.error(`SmartSubscriber fetch error for ${path}:`, err));
  };

  if (!subscribersRegistry.has(path)) {
    subscribersRegistry.set(path, new Set());
  }
  subscribersRegistry.get(path)!.add(runFetch);

  // Initial fetch immediate, but staggered slightly to prevent AI Studio 429 rate limit on burst
  const staggerMs = Math.floor(Math.random() * 500) + 100;
  setTimeout(() => {
    fetchApi(path).then(data => {
      if (active) {
        if (data !== undefined && data !== null) callback(data);
        else if (defaultValue !== undefined) callback(defaultValue);
      }
    }).catch(err => console.error(`SmartSubscriber initial fetch error for ${path}:`, err));
  }, staggerMs);

  const interval = setInterval(runFetch, intervalMs);

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      setTimeout(runFetch, Math.floor(Math.random() * 500)); // Stagger visibility fetches too
    }
  };
  document.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    active = false;
    clearInterval(interval);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    subscribersRegistry.get(path)?.delete(runFetch);
  };
}

export function subscribeToProducts(callback: (products: Product[]) => void) {
  return createSmartSubscriber<Product[]>('/api/products', callback, 60000);
}

export function subscribeToSales(callback: (sales: Sale[]) => void) {
  return createSmartSubscriber<Sale[]>('/api/sales', callback, 60000);
}

export async function upsertProduct(product: Omit<Product, 'createdAt' | 'updatedAt'>): Promise<string> {
  let id: string;
  if (product.id) {
    await fetchApi(`/api/products/${product.id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    });
    id = product.id;
  } else {
    const res = await fetchApi('/api/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
    id = res.id;
  }
  queryClient.invalidateQueries({ queryKey: ["products"] });
  triggerFetch('/api/products');
  return id;
}

export async function processSale(product: Product, qty: number, additionalFields: Partial<Sale> = {}) {
  const hpp = product.hargaBeli || 0;
  const totalHpp = hpp * qty;
  const totalHarga = additionalFields.totalHarga || (product.hargaJual * qty);
  const laba = totalHarga - totalHpp;

  await fetchApi('/api/sales', {
    method: 'POST',
    body: JSON.stringify({
      productId: product.id,
      kodeBarang: product.kodeBarang,
      namaBarang: product.namaBarang,
      qty,
      totalHarga,
      hpp,
      totalHpp,
      laba,
      ...additionalFields,
    }),
  });
  queryClient.invalidateQueries({ queryKey: ["sales"] });
  triggerFetch('/api/sales');
  triggerFetch('/api/products');
}

export function subscribeToIncomingGoods(callback: (goods: IncomingGood[]) => void) {
  return createSmartSubscriber<IncomingGood[]>('/api/incoming-goods', callback, 60000);
}

export async function addIncomingGood(good: Omit<IncomingGood, 'id'>) {
  await fetchApi('/api/incoming-goods', {
    method: 'POST',
    body: JSON.stringify(good),
  });
  queryClient.invalidateQueries({ queryKey: ["incomingGoods"] });
  triggerFetch('/api/incoming-goods');
  triggerFetch('/api/products');
}

export function subscribeToSalesDS(callback: (salesDS: SaleDS[]) => void) {
  return createSmartSubscriber<SaleDS[]>('/api/sales-ds', callback, 60000);
}

export async function addSaleDSRecord(sale: Omit<SaleDS, 'id' | 'tanggal'>) {
  await fetchApi('/api/sales-ds', {
    method: 'POST',
    body: JSON.stringify(sale),
  });
  queryClient.invalidateQueries({ queryKey: ["salesDS"] });
  triggerFetch('/api/sales-ds');
}

export async function processSalesBulk(salesToSave: any[]) {
  await fetchApi('/api/sales/bulk', {
    method: 'POST',
    body: JSON.stringify(salesToSave),
  });
  queryClient.invalidateQueries({ queryKey: ["sales"] });
  triggerFetch('/api/sales');
  triggerFetch('/api/products');
}

export async function processSalesDSBulk(salesDSToSave: any[]) {
  await fetchApi('/api/sales-ds/bulk', {
    method: 'POST',
    body: JSON.stringify(salesDSToSave),
  });
  queryClient.invalidateQueries({ queryKey: ["salesDS"] });
  triggerFetch('/api/sales-ds');
}

export function subscribeToIklan(callback: (iklanList: Iklan[]) => void) {
  return createSmartSubscriber<Iklan[]>('/api/iklan', callback, 60000);
}

export async function addIklanRecord(iklan: Omit<Iklan, 'id' | 'createdAt'>) {
  await fetchApi('/api/iklan', {
    method: 'POST',
    body: JSON.stringify(iklan),
  });
  triggerFetch('/api/iklan');
}

export function subscribeToWeeklySales(callback: (weeklySales: WeeklySale[]) => void) {
  return createSmartSubscriber<WeeklySale[]>('/api/weekly-sales', callback, 60000);
}

export async function addWeeklySaleRecord(weeklySale: Omit<WeeklySale, 'id' | 'createdAt'>) {
  await fetchApi('/api/weekly-sales', {
    method: 'POST',
    body: JSON.stringify(weeklySale),
  });
  triggerFetch('/api/weekly-sales');
}

export function subscribeToBanners(callback: (banners: StorefrontBanner[]) => void) {
  return createSmartSubscriber<StorefrontBanner[]>('/api/banners', callback, 60000);
}

export function subscribeToBranding(callback: (settings: BrandingSettings) => void) {
  const defaultBranding: BrandingSettings = {
    announcementTexts: [
      "✨ BELI 1 GRATIS 1 - Tingkatkan pesonamu dengan Zendiix!",
      "🚚 GRATIS ONGKIR dengan belanja minimal Rp 400.000!",
      "🎁 BONUS Case Cermin Premium setiap pembelian 2+ box!"
    ],
    logoText: "ZENDIIX",
    logoUrl: "",
    footerAboutText: "Zendiix hadir memberikan solusi produk softlens premium untuk menunjang keindahan dan kesehatan mata dengan standarisasi kualitas tinggi bagi para pecinta fashion optik."
  };
  return createSmartSubscriber<BrandingSettings>('/api/settings/branding', callback, 60000, defaultBranding);
}

export async function updateBranding(settings: BrandingSettings) {
  await fetchApi('/api/settings/branding', {
    method: 'POST',
    body: JSON.stringify(settings),
  });
  triggerFetch('/api/settings/branding');
}

export async function deleteAllProducts() {
  await fetchApi('/api/products', { method: 'DELETE' });
  queryClient.invalidateQueries({ queryKey: ["products"] });
  triggerFetch('/api/products');
}

export async function deleteProduct(product: Product) {
  if (product.id) {
    await fetchApi(`/api/products/${product.id}`, { method: 'DELETE' });
    queryClient.invalidateQueries({ queryKey: ["products"] });
    triggerFetch('/api/products');
  }
}

export async function deleteProductsBatch(ids: string[]) {
  if (ids.length > 0) {
    await fetchApi('/api/products/batch-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids })
    });
    queryClient.invalidateQueries({ queryKey: ["products"] });
    triggerFetch('/api/products');
  }
}

export async function deleteAllSales() {
  await fetchApi('/api/sales', { method: 'DELETE' });
  queryClient.invalidateQueries({ queryKey: ["sales"] });
  triggerFetch('/api/sales');
  triggerFetch('/api/products');
}

export async function deleteAllIncomingGoods() {
  await fetchApi('/api/incoming-goods', { method: 'DELETE' });
  queryClient.invalidateQueries({ queryKey: ["incomingGoods"] });
  triggerFetch('/api/incoming-goods');
  triggerFetch('/api/products');
}

export async function deleteSale(sale: Sale) {
  if (sale.id) {
    await fetchApi(`/api/sales/${sale.id}`, { method: 'DELETE' });
    queryClient.invalidateQueries({ queryKey: ["sales"] });
    triggerFetch('/api/sales');
    triggerFetch('/api/products');
  }
}

export async function updateSale(sale: Sale) {
  if (sale.id) {
    await fetchApi(`/api/sales/${sale.id}`, {
      method: 'PUT',
      body: JSON.stringify(sale),
    });
    queryClient.invalidateQueries({ queryKey: ["sales"] });
    triggerFetch('/api/sales');
    triggerFetch('/api/products');
  }
}

export async function addSaleRecord(kodeBarang: string, namaBarang: string, qty: number, totalHarga: number, additionalFields: any) {
  const hpp = additionalFields.hpp || 0;
  const totalHpp = additionalFields.totalHpp || (hpp * qty);
  const laba = totalHarga - totalHpp;

  await fetchApi('/api/sales', {
    method: 'POST',
    body: JSON.stringify({ 
      kodeBarang, 
      namaBarang, 
      qty, 
      totalHarga, 
      hpp,
      totalHpp,
      laba,
      ...additionalFields 
    }),
  });
  queryClient.invalidateQueries({ queryKey: ["sales"] });
  triggerFetch('/api/sales');
  triggerFetch('/api/products');
}

export async function deleteIncomingGood(good: IncomingGood) {
  if (good.id) {
    await fetchApi(`/api/incoming-goods/${good.id}`, { method: 'DELETE' });
    queryClient.invalidateQueries({ queryKey: ["incomingGoods"] });
    triggerFetch('/api/incoming-goods');
    triggerFetch('/api/products');
  }
}

export async function deleteSaleDS(sale: SaleDS) {
  if (sale.id) {
    await fetchApi(`/api/sales-ds/${sale.id}`, { method: 'DELETE' });
    queryClient.invalidateQueries({ queryKey: ["salesDS"] });
    triggerFetch('/api/sales-ds');
  }
}

export async function updateSaleDS(sale: SaleDS) {
  if (sale.id) {
    await fetchApi(`/api/sales-ds/${sale.id}`, {
      method: 'PUT',
      body: JSON.stringify(sale),
    });
    queryClient.invalidateQueries({ queryKey: ["salesDS"] });
    triggerFetch('/api/sales-ds');
  }
}

export async function deleteAllSalesDS() {
  await fetchApi('/api/sales-ds', { method: 'DELETE' });
  queryClient.invalidateQueries({ queryKey: ["salesDS"] });
  triggerFetch('/api/sales-ds');
}

export async function updateIklan(iklan: Iklan) {
  if (iklan.id) {
    await fetchApi(`/api/iklan/${iklan.id}`, {
      method: 'PUT',
      body: JSON.stringify(iklan),
    });
    triggerFetch('/api/iklan');
  }
}

export async function deleteIklan(iklan: Iklan) {
  if (iklan.id) {
    await fetchApi(`/api/iklan/${iklan.id}`, { method: 'DELETE' });
    triggerFetch('/api/iklan');
  }
}

export async function deleteAllIklan() {
  await fetchApi('/api/iklan', { method: 'DELETE' });
  triggerFetch('/api/iklan');
}

export async function updateWeeklySale(weeklySale: WeeklySale) {
  if (weeklySale.id) {
    await fetchApi(`/api/weekly-sales/${weeklySale.id}`, {
      method: 'PUT',
      body: JSON.stringify(weeklySale),
    });
    triggerFetch('/api/weekly-sales');
  }
}

export async function deleteWeeklySale(weeklySale: WeeklySale) {
  if (weeklySale.id) {
    await fetchApi(`/api/weekly-sales/${weeklySale.id}`, { method: 'DELETE' });
    triggerFetch('/api/weekly-sales');
  }
}

export async function deleteAllWeeklySales() {
  await fetchApi('/api/weekly-sales', { method: 'DELETE' });
  triggerFetch('/api/weekly-sales');
}

export async function addBanner(banner: any) {
  await fetchApi('/api/banners', {
    method: 'POST',
    body: JSON.stringify(banner),
  });
  triggerFetch('/api/banners');
}

export async function deleteBanner(id: string) {
  await fetchApi(`/api/banners/${id}`, { method: 'DELETE' });
  triggerFetch('/api/banners');
}

export function subscribeToReviews(callback: (reviews: Review[]) => void) {
  return createSmartSubscriber<Review[]>('/api/reviews', callback, 60000);
}

export async function addReview(review: Omit<Review, 'id' | 'createdAt'>) {
  await fetchApi('/api/reviews', {
    method: 'POST',
    body: JSON.stringify(review),
  });
  triggerFetch('/api/reviews');
}

export async function deleteReview(id: string) {
  await fetchApi(`/api/reviews/${id}`, { method: 'DELETE' });
  triggerFetch('/api/reviews');
}

export async function updateReview(review: Review) {
  await fetchApi(`/api/reviews/${review.id}`, {
    method: 'PUT',
    body: JSON.stringify(review),
  });
  triggerFetch('/api/reviews');
}
