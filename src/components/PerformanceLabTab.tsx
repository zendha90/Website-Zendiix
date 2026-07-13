import React, { useState, useEffect, useMemo } from "react";
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Virtuoso } from "react-virtuoso";
import { 
  Zap, 
  Database, 
  Terminal, 
  RefreshCw, 
  Clock, 
  ArrowRight, 
  Flame, 
  FileText, 
  Check, 
  Search, 
  Plus, 
  Trash2, 
  Layers, 
  Sparkles,
  Play,
  Share2,
  Lock,
  ChevronDown
} from "lucide-react";

// Types
interface Product {
  id: string;
  namaBarang: string;
  stokBarang: number;
  hargaJual: number;
  color?: string;
  groupName?: string;
}

interface RedisLog {
  id: string;
  timestamp: string;
  action: 'CONNECT' | 'GET' | 'SETEX' | 'DEL' | 'FLUSHALL' | 'INVALIDATE' | 'ERROR';
  key: string;
  details: string;
  ttlLeft?: number;
}

interface RedisKeyState {
  key: string;
  ttl: number;
}

interface SqlGuides {
  indexing: string;
  cursorPagination: string;
  databaseView: string;
}

export function PerformanceLabTab() {
  const queryClient = useQueryClient();
  const [activeSqlTab, setActiveSqlTab] = useState<'indexing' | 'cursor' | 'view'>('indexing');
  const [selectedProductForStock, setSelectedProductForStock] = useState<string>('');
  const [stockAddAmount, setStockAddAmount] = useState<number>(10);
  const [isSuccessToast, setIsSuccessToast] = useState<string | null>(null);

  // 1. Fetch SQL Guides & Best Practices
  const { data: sqlGuides } = useQuery<SqlGuides>({
    queryKey: ["sqlGuides"],
    queryFn: async () => {
      const res = await fetch("/api/optimized/sql-guide");
      return res.json();
    }
  });

  // 2. Fetch Live Redis Logs and Keys every 1.5 seconds for real-time visualization
  const { data: redisState, refetch: refetchRedis } = useQuery<{ logs: RedisLog[]; keys: RedisKeyState[] }>({
    queryKey: ["redisState"],
    queryFn: async () => {
      const res = await fetch("/api/optimized/redis-logs");
      return res.json();
    },
    refetchInterval: 1500
  });

  // 3. Infinite Scroll with TanStack Query & Cursor-Based Pagination
  const fetchProductsPage = async (cursor: string) => {
    const res = await fetch(`/api/optimized/products?limit=6&cursor=${encodeURIComponent(cursor)}`);
    if (!res.ok) throw new Error("Gagal mengambil data produk");
    return res.json();
  };

  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isProductsLoading,
    refetch: refetchProducts,
    isRefetching: isProductsRefetching
  } = useInfiniteQuery({
    queryKey: ["optimizedProductsList"],
    queryFn: ({ pageParam }) => fetchProductsPage(pageParam as string),
    initialPageParam: "",
    getNextPageParam: (lastPage: any) => lastPage.nextCursor ?? undefined,
  });

  // Flattened product list for Virtuoso virtual scrolling
  const flatProducts = useMemo(() => {
    if (!infiniteData) return [];
    return infiniteData.pages.reduce((acc: any[], page: any) => {
      return [...acc, ...page.products];
    }, []);
  }, [infiniteData]);

  // Track the source and speed of the last loaded pages
  const lastPageMeta = useMemo(() => {
    if (!infiniteData || infiniteData.pages.length === 0) return null;
    const lastPage = infiniteData.pages[infiniteData.pages.length - 1];
    return {
      source: lastPage.source || "Database",
      executionTimeMs: lastPage.executionTimeMs || 0
    };
  }, [infiniteData]);

  // Mutation to add stock and trigger auto Redis invalidation
  const addStockMutation = useMutation({
    mutationFn: async ({ productId, qty }: { productId: string; qty: number }) => {
      const res = await fetch("/api/optimized/add-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, qty })
      });
      return res.json();
    },
    onSuccess: (data) => {
      setIsSuccessToast(data.message);
      setTimeout(() => setIsSuccessToast(null), 5000);
      
      // Instantly refresh Redis state logs and local TanStack infinite queries
      refetchRedis();
      queryClient.invalidateQueries({ queryKey: ["optimizedProductsList"] });
    }
  });

  // Flush Redis Cache completely
  const flushCache = async () => {
    await fetch("/api/optimized/invalidate", { method: "POST" });
    refetchRedis();
    queryClient.invalidateQueries({ queryKey: ["optimizedProductsList"] });
    setIsSuccessToast("Redis cache berhasil dihapus/FLUSHALL! Semua request berikutnya akan langsung query ke MySQL.");
    setTimeout(() => setIsSuccessToast(null), 4000);
  };

  // Pre-fill selected product
  useEffect(() => {
    if (flatProducts.length > 0 && !selectedProductForStock) {
      setSelectedProductForStock(flatProducts[0].id);
    }
  }, [flatProducts, selectedProductForStock]);

  const handleAddStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForStock) return;
    addStockMutation.mutate({
      productId: selectedProductForStock,
      qty: stockAddAmount
    });
  };

  return (
    <div className="grid grid-cols-12 gap-6 p-1 bg-slate-50 min-h-screen">
      
      {/* Toast Notification */}
      {isSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-emerald-600 text-white p-4 rounded-xl shadow-2xl border border-emerald-500 flex items-start gap-3 animate-bounce">
          <Check className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-black uppercase tracking-wider">Berhasil Di-Invalidasi!</p>
            <p className="text-[11px] font-medium opacity-90 mt-0.5">{isSuccessToast}</p>
          </div>
        </div>
      )}

      {/* HEADER BAR */}
      <div className="col-span-12 bg-white border-2 border-slate-900 p-6 shadow-[4px_4px_0px_0px_#0f172a] rounded-none flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="bg-indigo-100 text-indigo-700 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider border border-indigo-200">
            PRO LAB & OPTIMIZATION ENGINE
          </span>
          <h1 className="text-2xl font-black text-slate-900 mt-2 uppercase tracking-tight">
            ⚡ Laboratorium Optimasi Kinerja Database
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl font-sans leading-relaxed">
            Pusat optimasi performa backend & database untuk menangani load transaksi jutaan baris. Dilengkapi dengan 
            <strong> Redis Cache 10m TTL</strong>, <strong>Automatic Cache Invalidation</strong>, 
            <strong> Cursor-Based Pagination</strong>, serta <strong>Virtual Scrolling (React Virtuoso)</strong>.
          </p>
        </div>
        <div className="flex gap-2.5 shrink-0">
          <button 
            onClick={flushCache}
            className="px-4 py-2 bg-rose-600 text-white font-bold uppercase text-xs tracking-wider border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#0f172a] transition-all"
          >
            🧹 Flush Redis Cache
          </button>
          <button 
            onClick={() => {
              refetchProducts();
              refetchRedis();
            }}
            className="p-2.5 bg-white border-2 border-slate-900 hover:bg-slate-50 shadow-[2px_2px_0px_0px_#0f172a] flex items-center justify-center transition-all"
            title="Refresh All"
          >
            <RefreshCw className={`w-4 h-4 ${isProductsRefetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* COLUMN 1: INTERACTIVE PRODUCTS CATALOG WITH VIRTUAL SCROLLING */}
      <div className="col-span-12 lg:col-span-7 flex flex-col gap-6">
        <div className="bg-white border-2 border-slate-900 shadow-[6px_6px_0px_0px_#0f172a] flex flex-col h-[580px] overflow-hidden">
          {/* Catalog Header with current stats */}
          <div className="p-4 bg-slate-900 text-white border-b-2 border-slate-900 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-400" />
              <h2 className="text-sm font-black uppercase tracking-wider">
                Catalog Virtualized (react-virtuoso)
              </h2>
            </div>
            {lastPageMeta && (
              <div className="flex items-center gap-2">
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                  lastPageMeta.source.includes('Redis') 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-indigo-500 text-white'
                }`}>
                  Sumber: {lastPageMeta.source}
                </span>
                <span className="text-[10px] font-mono text-neutral-300">
                  ⚡ {lastPageMeta.executionTimeMs} ms
                </span>
              </div>
            )}
          </div>

          {/* Virtuoso Scroll Area */}
          <div className="flex-1 bg-neutral-50 relative flex flex-col">
            {isProductsLoading ? (
              // Aesthetic Skeleton Grid
              <div className="p-4 grid grid-cols-2 gap-4">
                {[1, 2, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white rounded-xl p-4 border border-neutral-200 space-y-3 animate-pulse">
                    <div className="h-4 bg-neutral-200 rounded w-1/3"></div>
                    <div className="h-6 bg-neutral-200 rounded w-3/4"></div>
                    <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
                    <div className="flex justify-between items-center pt-3 border-t border-neutral-100">
                      <div className="h-4 bg-neutral-200 rounded w-1/4"></div>
                      <div className="h-6 bg-neutral-200 rounded w-1/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : flatProducts.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <Database className="w-12 h-12 text-neutral-300 mb-2" />
                <p className="text-xs font-bold text-slate-800 uppercase">Tidak ada produk dalam database</p>
                <p className="text-[10px] text-neutral-400 max-w-xs mt-1">Gunakan tab stok barang untuk memasukkan produk terlebih dahulu.</p>
              </div>
            ) : (
              <div className="flex-1 h-full font-sans">
                {/* react-virtuoso for flawless infinite lists */}
                <Virtuoso
                  style={{ height: '100%' }}
                  data={flatProducts}
                  endReached={() => {
                    if (hasNextPage && !isFetchingNextPage) {
                      // Trigger TanStack Prefetching
                      fetchNextPage();
                    }
                  }}
                  itemContent={(index, product) => {
                    const isOutOfStock = product.stokBarang <= 0;
                    return (
                      <div className="px-4 py-2">
                        <div className="bg-white rounded-xl p-4 border border-neutral-200/80 shadow-sm hover:border-indigo-200 transition-all flex items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-black bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono uppercase">
                                ID: {product.id}
                              </span>
                              {product.color && (
                                <span className="text-[9px] font-black bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded uppercase">
                                  {product.color}
                                </span>
                              )}
                            </div>
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                              {product.namaBarang}
                            </h3>
                            <p className="text-[10px] text-neutral-400 font-medium">
                              Series: <span className="text-slate-700 font-bold">{product.groupName || 'Zendiix'}</span>
                            </p>
                          </div>
                          
                          <div className="text-right shrink-0">
                            <div className="text-xs font-black text-slate-950 font-mono">
                              Rp {product.hargaJual.toLocaleString('id-ID')}
                            </div>
                            <div className="mt-1 flex items-center justify-end gap-1.5">
                              <span className={`inline-block text-[9px] font-black px-2 py-0.5 rounded ${
                                isOutOfStock 
                                  ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              }`}>
                                {isOutOfStock ? 'Stok Kosong' : `Stok: ${product.stokBarang} Box`}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                  components={{
                    Footer: () => {
                      if (isFetchingNextPage) {
                        return (
                          <div className="p-4 flex items-center justify-center gap-2">
                            <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              Mengambil Halaman Berikutnya (Prefetching)...
                            </span>
                          </div>
                        );
                      }
                      if (!hasNextPage) {
                        return (
                          <div className="p-6 text-center border-t border-neutral-100 bg-neutral-50">
                            <span className="text-[9.5px] font-black text-neutral-400 uppercase tracking-wider">
                              🏁 Semua data berhasil dimuat (Cursor reached end of records)
                            </span>
                          </div>
                        );
                      }
                      return null;
                    }
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* DATABASE VIEW & INDEXING SQL CODES DISPLAY */}
        <div className="bg-white border-2 border-slate-900 shadow-[6px_6px_0px_0px_#0f172a] p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-neutral-200 pb-3">
            <Database className="w-5 h-5 text-indigo-600" />
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
              MySQL Optimization & SQL Architecture
            </h2>
          </div>

          <div className="flex gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setActiveSqlTab('indexing')}
              className={`flex-1 py-1.5 text-center text-[10px] font-extrabold uppercase tracking-wider rounded transition-colors ${
                activeSqlTab === 'indexing' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              1. Indexing
            </button>
            <button
              onClick={() => setActiveSqlTab('cursor')}
              className={`flex-1 py-1.5 text-center text-[10px] font-extrabold uppercase tracking-wider rounded transition-colors ${
                activeSqlTab === 'cursor' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              2. Cursor Query
            </button>
            <button
              onClick={() => setActiveSqlTab('view')}
              className={`flex-1 py-1.5 text-center text-[10px] font-extrabold uppercase tracking-wider rounded transition-colors ${
                activeSqlTab === 'view' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              3. Database VIEW
            </button>
          </div>

          <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto border border-slate-800 max-h-[220px] overflow-y-auto">
            <pre className="text-[10px] font-mono text-slate-300 leading-relaxed whitespace-pre">
              <code>
                {activeSqlTab === 'indexing' && (sqlGuides?.indexing || "-- Loading indexing schema...")}
                {activeSqlTab === 'cursor' && (sqlGuides?.cursorPagination || "-- Loading cursor template...")}
                {activeSqlTab === 'view' && (sqlGuides?.databaseView || "-- Loading view structure...")}
              </code>
            </pre>
          </div>
          
          <div className="text-[10.5px] text-slate-500 font-medium italic">
            💡 <strong>Rekomendasi Utama:</strong> Composite index seperti <code>(custom_category, color)</code> 
            mempercepat performa filter, sedangkan Database <code>VIEW</code> mempermudah code backend agar terhindar 
            dari penulisan query JOIN yang rumit berulang kali.
          </div>
        </div>
      </div>

      {/* COLUMN 2: REDIS SIMULATOR ENGINE & LIVE CACHE INSPECTOR */}
      <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
        
        {/* REDIS LOGS TERMINAL */}
        <div className="bg-white border-2 border-slate-900 shadow-[6px_6px_0px_0px_#0f172a] flex flex-col h-[340px] overflow-hidden">
          <div className="p-4 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xs font-black uppercase tracking-wider text-emerald-400 font-mono">
                Redis Real-Time Logs Console
              </h2>
            </div>
            <span className="animate-ping w-2 h-2 rounded-full bg-emerald-400"></span>
          </div>

          <div className="flex-1 bg-slate-950 p-4 font-mono text-[9.5px] leading-relaxed overflow-y-auto flex flex-col-reverse gap-2">
            {redisState?.logs && redisState.logs.length > 0 ? (
              redisState.logs.map((log) => (
                <div key={log.id} className="border-b border-slate-900/40 pb-1.5 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-bold">[{log.timestamp}]</span>
                    <span className={`font-black px-1 py-0.2 rounded text-[8px] uppercase ${
                      log.action === 'GET' ? 'bg-blue-950 text-blue-400 border border-blue-900' :
                      log.action === 'SETEX' ? 'bg-amber-950 text-amber-400 border border-amber-900' :
                      log.action === 'DEL' ? 'bg-rose-950 text-rose-400 border border-rose-900' :
                      log.action === 'CONNECT' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' :
                      'bg-neutral-800 text-neutral-400'
                    }`}>
                      {log.action}
                    </span>
                    <span className="text-slate-300 font-semibold truncate max-w-[180px]" title={log.key}>
                      {log.key}
                    </span>
                  </div>
                  <p className="text-slate-400 mt-0.5 ml-1 leading-normal">
                    {log.details}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-slate-600 italic text-center py-12">
                Menunggu aktivitas caching di Redis...
              </div>
            )}
          </div>
        </div>

        {/* ACTIVE REDIS KEYS AND EXPIRY */}
        <div className="bg-white border-2 border-slate-900 shadow-[6px_6px_0px_0px_#0f172a] p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                Active Redis Keys ({redisState?.keys.length || 0})
              </h2>
            </div>
            <span className="text-[10px] font-black text-indigo-600 uppercase">
              TTL: 10 Menit (600s)
            </span>
          </div>

          {redisState?.keys && redisState.keys.length > 0 ? (
            <div className="space-y-2 max-h-[150px] overflow-y-auto">
              {redisState.keys.map((k) => (
                <div key={k.key} className="bg-neutral-50 rounded-lg p-2.5 border border-neutral-200/60 flex items-center justify-between text-[10px] font-mono">
                  <span className="text-slate-700 font-bold truncate max-w-[200px]" title={k.key}>
                    {k.key}
                  </span>
                  <span className="bg-indigo-50 text-indigo-700 font-extrabold px-2 py-0.5 rounded shrink-0">
                    {Math.floor(k.ttl / 60)}m {k.ttl % 60}s left
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 bg-neutral-50 rounded-xl border border-dashed border-neutral-200 text-neutral-400 text-[10px] italic">
              Tidak ada key aktif di memory Redis. Mulai scroll katalog produk untuk memicu caching!
            </div>
          )}
        </div>

        {/* AUTOMATIC CACHE INVALIDATION SIMULATOR FORM */}
        <div className="bg-white border-2 border-slate-900 shadow-[6px_6px_0px_0px_#0f172a] p-5 flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-500" />
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
                Auto Invalidation Simulator
              </h2>
            </div>
            <p className="text-[10px] text-neutral-400 mt-1">
              Simulasikan penambahan stok barang baru masuk. Penambahan ini akan secara otomatis memicu invalidasi (menghapus cache) di Redis secara instan agar katalog produk di frontend tidak menampilkan data usang (stale data).
            </p>
          </div>

          <form onSubmit={handleAddStockSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase text-neutral-400 block">Pilih Barang</label>
                <select
                  value={selectedProductForStock}
                  onChange={(e) => setSelectedProductForStock(e.target.value)}
                  className="w-full bg-white border border-neutral-200 rounded px-2.5 py-1.5 text-[11px] font-bold focus:outline-none focus:ring-1 focus:ring-slate-950"
                  required
                >
                  {flatProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.id}] {p.namaBarang}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase text-neutral-400 block">Jumlah Masuk</label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={stockAddAmount}
                  onChange={(e) => setStockAddAmount(Number(e.target.value))}
                  className="w-full bg-white border border-neutral-200 rounded px-2.5 py-1.5 text-[11px] font-bold focus:outline-none focus:ring-1 focus:ring-slate-950"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={addStockMutation.isPending || !selectedProductForStock}
              className="w-full py-2 bg-slate-950 text-white text-[10px] font-black uppercase tracking-wider rounded-lg shadow-md hover:bg-slate-900 active:scale-[0.98] transition-transform disabled:opacity-50"
            >
              {addStockMutation.isPending ? 'Memproses...' : '📥 Masukkan Stok Baru & Hapus Cache'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
