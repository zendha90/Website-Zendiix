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
  if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
  return res.json();
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
      .catch(console.error);
  };

  // Initial fetch immediate
  fetchApi(path).then(data => {
    if (active) {
      if (data !== undefined && data !== null) callback(data);
      else if (defaultValue !== undefined) callback(defaultValue);
    }
  }).catch(console.error);

  const interval = setInterval(runFetch, intervalMs);

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      runFetch();
    }
  };
  document.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    active = false;
    clearInterval(interval);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}

export function subscribeToProducts(callback: (products: Product[]) => void) {
  return createSmartSubscriber<Product[]>('/api/products', callback, 60000);
}

export function subscribeToSales(callback: (sales: Sale[]) => void) {
  return createSmartSubscriber<Sale[]>('/api/sales', callback, 60000);
}

export async function upsertProduct(product: Omit<Product, 'createdAt' | 'updatedAt'>): Promise<string> {
  if (product.id) {
    await fetchApi(`/api/products/${product.id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    });
    return product.id;
  } else {
    const res = await fetchApi('/api/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
    return res.id;
  }
}

export async function processSale(product: Product, qty: number, additionalFields: Partial<Sale> = {}) {
  await fetchApi('/api/sales', {
    method: 'POST',
    body: JSON.stringify({
      productId: product.id,
      kodeBarang: product.kodeBarang,
      namaBarang: product.namaBarang,
      qty,
      totalHarga: additionalFields.totalHarga || (product.hargaJual * qty),
      ...additionalFields,
    }),
  });
}

export function subscribeToIncomingGoods(callback: (goods: IncomingGood[]) => void) {
  return createSmartSubscriber<IncomingGood[]>('/api/incoming-goods', callback, 60000);
}

export async function addIncomingGood(good: Omit<IncomingGood, 'id'>) {
  await fetchApi('/api/incoming-goods', {
    method: 'POST',
    body: JSON.stringify(good),
  });
}

export function subscribeToSalesDS(callback: (salesDS: SaleDS[]) => void) {
  return createSmartSubscriber<SaleDS[]>('/api/sales-ds', callback, 60000);
}

export async function addSaleDSRecord(sale: Omit<SaleDS, 'id' | 'tanggal'>) {
  await fetchApi('/api/sales-ds', {
    method: 'POST',
    body: JSON.stringify(sale),
  });
}

export function subscribeToIklan(callback: (iklanList: Iklan[]) => void) {
  return createSmartSubscriber<Iklan[]>('/api/iklan', callback, 60000);
}

export async function addIklanRecord(iklan: Omit<Iklan, 'id' | 'createdAt'>) {
  await fetchApi('/api/iklan', {
    method: 'POST',
    body: JSON.stringify(iklan),
  });
}

export function subscribeToWeeklySales(callback: (weeklySales: WeeklySale[]) => void) {
  return createSmartSubscriber<WeeklySale[]>('/api/weekly-sales', callback, 60000);
}

export async function addWeeklySaleRecord(weeklySale: Omit<WeeklySale, 'id' | 'createdAt'>) {
  await fetchApi('/api/weekly-sales', {
    method: 'POST',
    body: JSON.stringify(weeklySale),
  });
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
}

export async function deleteAllProducts() {
  await fetchApi('/api/products', { method: 'DELETE' });
}

export async function deleteAllSales() {
  await fetchApi('/api/sales', { method: 'DELETE' });
}

export async function deleteAllIncomingGoods() {
  await fetchApi('/api/incoming-goods', { method: 'DELETE' });
}

export async function deleteSale(sale: Sale) {
  if (sale.id) await fetchApi(`/api/sales/${sale.id}`, { method: 'DELETE' });
}

export async function updateSale(sale: Sale) {
  if (sale.id) await fetchApi(`/api/sales/${sale.id}`, {
    method: 'PUT',
    body: JSON.stringify(sale),
  });
}

export async function addSaleRecord(kodeBarang: string, namaBarang: string, qty: number, totalHarga: number, additionalFields: any) {
  await fetchApi('/api/sales', {
    method: 'POST',
    body: JSON.stringify({ kodeBarang, namaBarang, qty, totalHarga, ...additionalFields }),
  });
}

export async function deleteIncomingGood(good: IncomingGood) {
  if (good.id) await fetchApi(`/api/incoming-goods/${good.id}`, { method: 'DELETE' });
}

export async function deleteSaleDS(sale: SaleDS) {
  if (sale.id) await fetchApi(`/api/sales-ds/${sale.id}`, { method: 'DELETE' });
}

export async function updateSaleDS(sale: SaleDS) {
  if (sale.id) await fetchApi(`/api/sales-ds/${sale.id}`, {
    method: 'PUT',
    body: JSON.stringify(sale),
  });
}

export async function deleteAllSalesDS() {
  await fetchApi('/api/sales-ds', { method: 'DELETE' });
}

export async function updateIklan(iklan: Iklan) {
  if (iklan.id) await fetchApi(`/api/iklan/${iklan.id}`, {
    method: 'PUT',
    body: JSON.stringify(iklan),
  });
}

export async function deleteIklan(iklan: Iklan) {
  if (iklan.id) await fetchApi(`/api/iklan/${iklan.id}`, { method: 'DELETE' });
}

export async function deleteAllIklan() {
  await fetchApi('/api/iklan', { method: 'DELETE' });
}

export async function updateWeeklySale(weeklySale: WeeklySale) {
  if (weeklySale.id) await fetchApi(`/api/weekly-sales/${weeklySale.id}`, {
    method: 'PUT',
    body: JSON.stringify(weeklySale),
  });
}

export async function deleteWeeklySale(weeklySale: WeeklySale) {
  if (weeklySale.id) await fetchApi(`/api/weekly-sales/${weeklySale.id}`, { method: 'DELETE' });
}

export async function deleteAllWeeklySales() {
  await fetchApi('/api/weekly-sales', { method: 'DELETE' });
}

export async function addBanner(banner: any) {
  await fetchApi('/api/banners', {
    method: 'POST',
    body: JSON.stringify(banner),
  });
}

export async function deleteBanner(id: string) {
  await fetchApi(`/api/banners/${id}`, { method: 'DELETE' });
}
