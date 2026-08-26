import React from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { Product, Sale, SaleDS, IncomingGood, Iklan } from "../../services";

export interface DeleteModalsProps {
  isMultiDeleteModalOpen: boolean;
  setIsMultiDeleteModalOpen: (open: boolean) => void;
  selectedProductIds: string[];
  handleBatchDeleteProducts: () => void;
  productToDelete: Product | null;
  setProductToDelete: (p: Product | null) => void;
  handleDeleteProduct: (id: string) => void;
  saleToDelete: Sale | null;
  setSaleToDelete: (s: Sale | null) => void;
  handleDeleteSale: (id: string) => void;
  groupToDelete: any | null;
  setGroupToDelete: (g: any | null) => void;
  handleDeleteGroupSale: (group: any) => void;
  saleDSToDelete: SaleDS | null;
  setSaleDSToDelete: (s: SaleDS | null) => void;
  handleDeleteSaleDS: (id: string) => void;
  incomingToDelete: IncomingGood | null;
  setIncomingToDelete: (i: IncomingGood | null) => void;
  handleDeleteIncoming: (id: string) => void;
  iklanToDelete: Iklan | null;
  setIklanToDelete: (i: Iklan | null) => void;
  handleDeleteIklan: (id: string) => void;
  isConfirmDeleteModalOpen: boolean;
  setIsConfirmDeleteModalOpen: (open: boolean) => void;
  handleDeleteAllData: () => Promise<void>;
  isDeleting: boolean;
}

export function DeleteModals({
  isMultiDeleteModalOpen,
  setIsMultiDeleteModalOpen,
  selectedProductIds,
  handleBatchDeleteProducts,
  productToDelete,
  setProductToDelete,
  handleDeleteProduct,
  saleToDelete,
  setSaleToDelete,
  handleDeleteSale,
  groupToDelete,
  setGroupToDelete,
  handleDeleteGroupSale,
  saleDSToDelete,
  setSaleDSToDelete,
  handleDeleteSaleDS,
  incomingToDelete,
  setIncomingToDelete,
  handleDeleteIncoming,
  iklanToDelete,
  setIklanToDelete,
  handleDeleteIklan,
  isConfirmDeleteModalOpen,
  setIsConfirmDeleteModalOpen,
  handleDeleteAllData,
  isDeleting,
}: DeleteModalsProps) {
  return (
    <>
          {isMultiDeleteModalOpen && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
              <div className="bg-white border-4 border-slate-900 w-full max-w-md p-8 shadow-[16px_16px_0px_0px_#0f172a] flex flex-col gap-8">
                <div>
                  <h3 className="text-2xl font-black text-rose-600 mb-4 flex items-center gap-2 uppercase tracking-widest">
                    HAPUS BANYAK BARANG?
                  </h3>
                  <div className="p-4 bg-rose-50 border-2 border-rose-200 text-slate-900 font-bold text-sm space-y-4">
                    <p>Apakah Anda yakin ingin menghapus <strong className="font-black text-rose-600">{selectedProductIds.length}</strong> barang yang dipilih?</p>
                    <p className="text-xs italic text-rose-500 font-bold">
                      ⚠️ Peringatan: Tindakan ini akan menghapus semua produk terpilih secara permanen dan tidak dapat dibatalkan.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 pt-4 border-t-2 border-slate-900">
                  <button
                    onClick={() => setIsMultiDeleteModalOpen(false)}
                    className="flex-1 py-4 bg-white border-2 border-slate-900 text-slate-900 font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_#0f172a] active:shadow-none transition-all cursor-pointer"
                  >
                    BATAL
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await handleBatchDeleteProducts();
                        
                        setIsMultiDeleteModalOpen(false);
                      } catch (err) {
                        console.error("Gagal menghapus produk terpilih:", err);
                      }
                    }}
                    className="flex-1 py-4 bg-rose-600 border-2 border-slate-900 text-white font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_#0f172a] active:shadow-none transition-all cursor-pointer"
                  >
                    YA, HAPUS SEMUA
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PRODUCT DELETE CONFIRM MODAL */}
          {productToDelete && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
              <div className="bg-white border-4 border-slate-900 w-full max-w-md p-8 shadow-[16px_16px_0px_0px_#0f172a] flex flex-col gap-8">
                <div>
                  <h3 className="text-2xl font-black text-rose-600 mb-4 flex items-center gap-2 uppercase tracking-widest">
                    HAPUS BARANG?
                  </h3>
                  <div className="p-4 bg-rose-50 border-2 border-rose-200 text-slate-900 font-bold text-sm space-y-4">
                    <p>Apakah Anda yakin ingin menghapus barang ini?</p>
                    <p className="text-xs font-medium text-slate-600">
                      Nama Barang:{" "}
                      <span className="font-black text-slate-900">
                        {productToDelete.namaBarang}
                      </span>
                      <br />
                      Kode Barang:{" "}
                      <span className="font-black text-slate-900">
                        {productToDelete.kodeBarang}
                      </span>
                      <br />
                      Supplier:{" "}
                      <span className="font-black text-slate-900">
                        {productToDelete.supplier || "-"}
                      </span>
                    </p>
                    <p className="text-xs italic text-rose-500 font-bold">
                      ⚠️ Peringatan: Tindakan ini tidak dapat dibatalkan.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 pt-4 border-t-2 border-slate-900">
                  <button
                    onClick={() => setProductToDelete(null)}
                    className="flex-1 py-4 bg-white border-2 border-slate-900 text-slate-900 font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_#0f172a] active:shadow-none transition-all"
                  >
                    BATAL
                  </button>
                  <button
                    onClick={async () => {
                      if (productToDelete) {
                        try {
                          await handleDeleteProduct(productToDelete.id || "");
                          setProductToDelete(null);
                        } catch (err) {
                          console.error("Gagal menghapus produk:", err);
                        }
                      }
                    }}
                    className="flex-1 py-4 bg-rose-600 border-2 border-slate-900 text-white font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_#0f172a] active:shadow-none transition-all"
                  >
                    YA, HAPUS
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SALE DELETE CONFIRM MODAL */}
          {saleToDelete && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
              <div className="bg-white border-4 border-slate-900 w-full max-w-md p-8 shadow-[16px_16px_0px_0px_#0f172a] flex flex-col gap-8">
                <div>
                  <h3 className="text-2xl font-black text-rose-600 mb-4 flex items-center gap-2 uppercase tracking-widest">
                    HAPUS TRANSAKSI?
                  </h3>
                  <div className="p-4 bg-rose-50 border-2 border-rose-200 text-slate-900 font-bold text-sm space-y-4">
                    <p>Apakah Anda yakin ingin menghapus transaksi ini?</p>
                    <p className="text-xs font-medium text-slate-600">
                      Barang:{" "}
                      <span className="font-black">
                        {saleToDelete.namaBarang}
                      </span>
                      <br />
                      No Pesanan:{" "}
                      <span className="font-black">
                        {saleToDelete.noPesanan}
                      </span>
                      <br />
                      Qty:{" "}
                      <span className="font-black">{saleToDelete.qty}</span>
                    </p>
                    <p className="text-xs italic text-rose-500 font-bold">
                      Stok barang akan dikembalikan secara otomatis.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 pt-4 border-t-2 border-slate-900">
                  <button
                    onClick={() => setSaleToDelete(null)}
                    className="flex-1 py-4 bg-white border-2 border-slate-900 text-slate-900 font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_#0f172a] active:shadow-none transition-all"
                  >
                    BATAL
                  </button>
                  <button
                    onClick={() => { if (saleToDelete) handleDeleteSale(saleToDelete.id || ""); }}
                    className="flex-1 py-4 bg-rose-600 border-2 border-slate-900 text-white font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_#0f172a] active:shadow-none transition-all"
                  >
                    YA, HAPUS
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* GROUP / PAKET SALE DELETE CONFIRM MODAL */}
          {groupToDelete && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
              <div className="bg-white border-4 border-slate-900 w-full max-w-md p-8 shadow-[16px_16px_0px_0px_#0f172a] flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
                <div>
                  <h3 className="text-2xl font-black text-rose-600 mb-1 flex items-center gap-2 uppercase tracking-widest">
                    HAPUS SELURUH PAKET?
                  </h3>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-4">
                    Grup Pesanan / Paket Resi
                  </p>
                  <div className="p-4 bg-rose-50 border-2 border-rose-200 text-slate-900 font-bold text-sm space-y-3">
                    <p>Apakah Anda yakin ingin menghapus seluruh transaksi dalam paket pesanan ini?</p>
                    <div className="text-xs font-medium text-slate-600 space-y-1 bg-white p-3 border border-rose-200 shadow-sm">
                      <div><span className="font-bold text-slate-400">No. Resi:</span> <span className="font-mono font-black text-slate-900">{groupToDelete.noResi || "-"}</span></div>
                      <div><span className="font-bold text-slate-400">No. Pesanan:</span> <span className="font-mono font-black text-slate-900">{groupToDelete.noPesanan || "-"}</span></div>
                      <div><span className="font-bold text-slate-400">Channel:</span> <span className="font-black text-slate-900">{groupToDelete.channel || "-"}</span></div>
                      <div><span className="font-bold text-slate-400">Ekspedisi:</span> <span className="font-black text-slate-900">{groupToDelete.namaEkspedisi || "-"}</span></div>
                      <div><span className="font-bold text-slate-400">Total Qty:</span> <span className="font-black text-indigo-700">{groupToDelete.qty} pcs ({groupToDelete.items?.length || 0} barang)</span></div>
                      <div><span className="font-bold text-slate-400">Total Nilai:</span> <span className="font-black text-indigo-700">Rp {Number(groupToDelete.totalHarga || 0).toLocaleString("id-ID")}</span></div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Daftar Barang dalam Paket:</p>
                      <div className="max-h-32 overflow-y-auto space-y-1 divide-y divide-rose-100 pr-1">
                        {groupToDelete.items?.map((it: any, idx: number) => (
                          <div key={it.id || idx} className="pt-1 flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-800 truncate pr-2" title={it.namaBarang}>{it.namaBarang}</span>
                            <span className="shrink-0 font-black text-indigo-600 font-mono">{it.qty} pcs</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <p className="text-xs italic text-rose-600 font-bold border-t border-rose-200 pt-2">
                      Semua stok barang di atas akan dikembalikan secara otomatis.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 pt-2 border-t-2 border-slate-900">
                  <button
                    onClick={() => setGroupToDelete(null)}
                    className="flex-1 py-4 bg-white border-2 border-slate-900 text-slate-900 font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_#0f172a] active:shadow-none transition-all"
                  >
                    BATAL
                  </button>
                  <button
                    onClick={() => { if (groupToDelete) handleDeleteGroupSale(groupToDelete); }}
                    className="flex-1 py-4 bg-rose-600 border-2 border-slate-900 text-white font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_#0f172a] active:shadow-none transition-all"
                  >
                    YA, HAPUS PAKET
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SALES DS DELETE CONFIRM MODAL */}
          {saleDSToDelete && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
              <div className="bg-white border-4 border-slate-900 w-full max-w-md p-8 shadow-[16px_16px_0px_0px_#0f172a] flex flex-col gap-8">
                <div>
                  <h3 className="text-2xl font-black text-rose-600 mb-4 flex items-center gap-2 uppercase tracking-widest">
                    HAPUS TRANSAKSI DS?
                  </h3>
                  <div className="p-4 bg-rose-50 border-2 border-rose-200 text-slate-900 font-bold text-sm space-y-4">
                    <p>Apakah Anda yakin ingin menghapus transaksi dropship ini?</p>
                    <p className="text-xs font-medium text-slate-600">
                      Produk:{" "}
                      <span className="font-black">
                        {saleDSToDelete.namaProduk}
                      </span>
                      <br />
                      No Pesanan:{" "}
                      <span className="font-black">
                        {saleDSToDelete.noPesanan}
                      </span>
                      <br />
                      Pelanggan:{" "}
                      <span className="font-black">
                        {saleDSToDelete.namaPelanggan}
                      </span>
                      <br />
                      Qty:{" "}
                      <span className="font-black">{saleDSToDelete.qty}</span>
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 pt-4 border-t-2 border-slate-900">
                  <button
                    onClick={() => setSaleDSToDelete(null)}
                    className="flex-1 py-4 bg-white border-2 border-slate-900 text-slate-900 font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_#0f172a] active:shadow-none transition-all"
                  >
                    BATAL
                  </button>
                  <button
                    onClick={() => { if (saleDSToDelete) handleDeleteSaleDS(saleDSToDelete.id || ""); }}
                    className="flex-1 py-4 bg-rose-600 border-2 border-slate-900 text-white font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_#0f172a] active:shadow-none transition-all"
                  >
                    YA, HAPUS
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* INCOMING DELETE CONFIRM MODAL */}
          {incomingToDelete && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
              <div className="bg-white border-4 border-slate-900 w-full max-w-md p-8 shadow-[16px_16px_0px_0px_#0f172a] flex flex-col gap-8">
                <div>
                  <h3 className="text-2xl font-black text-rose-600 mb-4 flex items-center gap-2 uppercase tracking-widest">
                    HAPUS RECORD MASUK?
                  </h3>
                  <div className="p-4 bg-rose-50 border-2 border-rose-200 text-slate-900 font-bold text-sm space-y-4">
                    <p>
                      Apakah Anda yakin ingin menghapus data barang masuk ini?
                    </p>
                    <p className="text-xs font-medium text-slate-600">
                      Barang:{" "}
                      <span className="font-black">
                        {incomingToDelete.namaBarang}
                      </span>
                      <br />
                      Qty:{" "}
                      <span className="font-black">{incomingToDelete.qty}</span>
                    </p>
                    <p className="text-xs italic text-rose-500 font-bold">
                      Stok barang akan dikurangi secara otomatis.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 pt-4 border-t-2 border-slate-900">
                  <button
                    onClick={() => setIncomingToDelete(null)}
                    className="flex-1 py-4 bg-white border-2 border-slate-900 text-slate-900 font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_#0f172a] active:shadow-none transition-all"
                  >
                    BATAL
                  </button>
                  <button
                    onClick={() => { if (incomingToDelete) handleDeleteIncoming(incomingToDelete.id || ""); }}
                    className="flex-1 py-4 bg-rose-600 border-2 border-slate-900 text-white font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_#0f172a] active:shadow-none transition-all"
                  >
                    YA, HAPUS
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* IKLAN DELETE CONFIRM MODAL */}
          {iklanToDelete && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
              <div className="bg-white border-4 border-slate-900 w-full max-w-md p-8 shadow-[16px_16px_0px_0px_#0f172a] flex flex-col gap-8">
                <div>
                  <h3 className="text-2xl font-black text-rose-600 mb-4 flex items-center gap-2 uppercase tracking-widest">
                    HAPUS DATA IKLAN?
                  </h3>
                  <div className="p-4 bg-rose-50 border-2 border-rose-200 text-slate-900 font-bold text-sm space-y-4">
                    <p>Apakah Anda yakin ingin menghapus data pengeluaran iklan ini?</p>
                    <div className="text-xs font-medium text-slate-600 space-y-1">
                      <p>Tanggal: <span className="font-black text-slate-900">{iklanToDelete.tanggal}</span></p>
                      <p>Total: <span className="font-black text-slate-900">Rp {iklanToDelete.totalPembayaran.toLocaleString("id-ID")}</span></p>
                      {iklanToDelete.noPesanan && <p>No Pesanan: <span className="font-black text-slate-900">{iklanToDelete.noPesanan}</span></p>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 pt-4 border-t-2 border-slate-900">
                  <button
                    onClick={() => setIklanToDelete(null)}
                    className="flex-1 py-4 bg-white border-2 border-slate-900 text-slate-900 font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_#0f172a] active:shadow-none transition-all"
                  >
                    BATAL
                  </button>
                  <button
                    onClick={() => { if (iklanToDelete) handleDeleteIklan(iklanToDelete.id || ""); }}
                    className="flex-1 py-4 bg-rose-600 border-2 border-slate-900 text-white font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_#0f172a] active:shadow-none transition-all"
                  >
                    YA, HAPUS
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CONFIRM DELETE MODAL */}
          {isConfirmDeleteModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
              <div className="bg-white border-4 border-slate-900 w-full max-w-md p-8 shadow-[16px_16px_0px_0px_#0f172a] flex flex-col gap-8">
                <div>
                  <h3 className="text-2xl font-black text-rose-600 mb-4 flex items-center gap-2 uppercase tracking-widest">
                    <Trash2 className="w-8 h-8" /> PERINGATAN!
                  </h3>
                  <div className="p-4 bg-rose-50 border-2 border-rose-200 text-slate-900 font-bold text-sm space-y-4">
                    <p>
                      Apakah Anda yakin ingin{" "}
                      <span className="text-rose-600 font-black">
                        MENGHAPUS SELURUH DATABASE
                      </span>
                      ?
                    </p>
                    <p className="text-xs text-rose-500">
                      Tindakan ini akan mengosongkan database stok, barang
                      masuk, penjualan, penjualan dropship (DS), iklan, dan penjualan mingguan. Data tidak dapat dibatalkan.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 pt-4 border-t-2 border-slate-900">
                  <button
                    onClick={() => setIsConfirmDeleteModalOpen(false)}
                    disabled={isDeleting}
                    className="flex-1 py-4 bg-white border-2 border-slate-900 text-slate-900 font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_#0f172a] active:shadow-none transition-all"
                  >
                    BATAL
                  </button>
                  <button
                    onClick={handleDeleteAllData}
                    disabled={isDeleting}
                    className="flex-1 py-4 bg-rose-600 border-2 border-slate-900 text-white font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_#0f172a] active:shadow-none transition-all flex items-center justify-center gap-2"
                  >
                    {isDeleting ? "MENGHAPUS..." : "YA, HAPUS SEMUA"}
                  </button>
                </div>
              </div>
            </div>
          )}
    </>
  );
}