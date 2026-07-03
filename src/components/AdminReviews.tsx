import React, { useState, useEffect } from "react";
import { Review, subscribeToReviews, addReview, updateReview, deleteReview } from "../services";
import { Plus, Trash2, Edit3, X, Save, Image as ImageIcon, Pin, AlertCircle } from "lucide-react";

export function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Partial<Review>>({});
  const [alertMessage, setAlertMessage] = useState("");

  useEffect(() => {
    return subscribeToReviews(setReviews);
  }, []);

  const handleOpenModal = (review: Partial<Review> = {}) => {
    setEditingReview(review);
    setIsModalOpen(true);
  };

  const handleTogglePin = async (review: Review) => {
    if (!review.id) return;
    const isCurrentlyPinned = !!review.isPinned;
    if (!isCurrentlyPinned) {
      const pinnedCount = reviews.filter(r => r.isPinned).length;
      if (pinnedCount >= 4) {
        setAlertMessage("Maksimal 4 ulasan yang bisa di-pin! Silakan unpin ulasan lain terlebih dahulu.");
        window.scrollTo({ top: 0, behavior: "smooth" });
        setTimeout(() => setAlertMessage(""), 5000);
        return;
      }
    }

    try {
      await updateReview({
        ...review,
        isPinned: !isCurrentlyPinned
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReview.productId || !editingReview.reviewerName || !editingReview.rating) return;
    
    const data = {
      productId: editingReview.productId,
      reviewerName: editingReview.reviewerName,
      rating: Number(editingReview.rating),
      comment: editingReview.comment || "",
      photoUrl: editingReview.photoUrl || "",
      isPinned: !!editingReview.isPinned,
    };

    if (editingReview.id) {
      await updateReview({ id: editingReview.id, ...data });
    } else {
      await addReview(data);
    }
    setIsModalOpen(false);
    setEditingReview({});
  };

  const handleDelete = async (id: string) => {
    if (confirm("Yakin ingin menghapus review ini?")) {
      await deleteReview(id);
    }
  };

  const pinnedReviewsCount = reviews.filter(r => r.isPinned).length;

  return (
    <div className="p-6 bg-slate-50 min-h-full font-sans">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-black uppercase tracking-widest text-slate-900">Kelola Review</h2>
          <p className="text-xs font-bold text-neutral-500 mt-1 uppercase tracking-wider">
            Review yang di-pin di halaman depan: <span className="text-indigo-600 font-extrabold">{pinnedReviewsCount} / 4</span>
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-indigo-600 text-white font-bold text-sm flex items-center gap-2 rounded shadow-md hover:bg-indigo-700 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Tambah Review
        </button>
      </div>

      {alertMessage && (
        <div className="mb-4 p-4 bg-amber-50 border-2 border-amber-500 rounded text-amber-800 text-xs font-bold flex items-center gap-2.5 shadow-sm animate-pulse">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{alertMessage}</span>
        </div>
      )}

      <div className="bg-white border-2 border-slate-900 shadow-[6px_6px_0px_0px_#0f172a] overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead className="bg-slate-900 text-white text-xs uppercase tracking-widest">
            <tr>
              <th className="p-4 w-12 text-center">Pin</th>
              <th className="p-4">Produk ID</th>
              <th className="p-4">Nama</th>
              <th className="p-4 w-20">Rating</th>
              <th className="p-4">Komentar</th>
              <th className="p-4 w-28 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((r) => (
              <tr key={r.id} className={`border-b border-neutral-100 hover:bg-neutral-50/50 transition-colors ${r.isPinned ? "bg-indigo-50/25" : ""}`}>
                <td className="p-4 text-center">
                  <button
                    type="button"
                    onClick={() => handleTogglePin(r)}
                    title={r.isPinned ? "Lepas Pin" : "Sematkan di Halaman Depan"}
                    className={`p-2 rounded-full transition-all duration-200 active:scale-95 cursor-pointer ${
                      r.isPinned 
                        ? "bg-indigo-600 text-white shadow-sm hover:bg-indigo-700" 
                        : "text-neutral-300 hover:text-slate-800 hover:bg-neutral-100"
                    }`}
                  >
                    <Pin className={`w-4 h-4 ${r.isPinned ? "fill-white" : ""}`} />
                  </button>
                </td>
                <td className="p-4 text-sm font-bold uppercase tracking-wider text-slate-800">{r.productId}</td>
                <td className="p-4 text-sm font-bold text-slate-900">{r.reviewerName}</td>
                <td className="p-4 text-sm font-black text-amber-500">{r.rating} / 5</td>
                <td className="p-4 text-sm text-neutral-600">
                  <div className="flex items-start gap-2.5 max-w-sm">
                    {r.photoUrl && (
                      <div className="w-8 h-8 rounded border border-neutral-200 overflow-hidden bg-neutral-100 shrink-0">
                        <img src={r.photoUrl} className="w-full h-full object-cover" alt="Review" />
                      </div>
                    )}
                    <span className="truncate flex-1" title={r.comment}>{r.comment}</span>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex gap-1.5 justify-center">
                    <button 
                      onClick={() => handleOpenModal(r)} 
                      className="p-1.5 text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded transition-colors"
                      title="Edit Ulasan"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(r.id!)} 
                      className="p-1.5 text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded transition-colors"
                      title="Hapus Ulasan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {reviews.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-neutral-400 font-bold text-xs uppercase tracking-wider">
                  Belum ada ulasan terdaftar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <form onSubmit={handleSave} className="bg-white p-6 rounded-lg w-full max-w-md border-2 border-slate-900 shadow-xl space-y-4">
            <h3 className="font-black uppercase tracking-widest text-lg border-b border-neutral-100 pb-2">
              {editingReview.id ? "Edit Review" : "Tambah Review"}
            </h3>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Produk ID / Seri Lensa</label>
              <input type="text" placeholder="Contoh: Zendiix Pearl" value={editingReview.productId || ""} onChange={e => setEditingReview({...editingReview, productId: e.target.value})} className="w-full p-2 border-2 border-slate-900 text-sm font-bold uppercase" required />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Nama Reviewer</label>
              <input type="text" placeholder="Nama reviewer" value={editingReview.reviewerName || ""} onChange={e => setEditingReview({...editingReview, reviewerName: e.target.value})} className="w-full p-2 border-2 border-slate-900 text-sm font-medium" required />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Rating (1-5)</label>
              <input type="number" min="1" max="5" placeholder="Rating (1-5)" value={editingReview.rating || ""} onChange={e => setEditingReview({...editingReview, rating: Number(e.target.value)})} className="w-full p-2 border-2 border-slate-900 text-sm font-bold" required />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Komentar / Ulasan</label>
              <textarea placeholder="Tulis ulasan Anda" value={editingReview.comment || ""} onChange={e => setEditingReview({...editingReview, comment: e.target.value})} className="w-full p-2 border-2 border-slate-900 text-sm font-normal" rows={3} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Photo URL</label>
              <input type="text" placeholder="https://..." value={editingReview.photoUrl || ""} onChange={e => setEditingReview({...editingReview, photoUrl: e.target.value})} className="w-full p-2 border-2 border-slate-900 text-sm font-normal" />
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2.5 font-bold text-sm text-slate-800 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!editingReview.isPinned}
                  onChange={e => {
                    if (e.target.checked) {
                      const pinnedCount = reviews.filter(r => r.isPinned && r.id !== editingReview.id).length;
                      if (pinnedCount >= 4) {
                        alert("Maksimal 4 ulasan yang bisa di-pin!");
                        return;
                      }
                    }
                    setEditingReview({...editingReview, isPinned: e.target.checked});
                  }}
                  className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                />
                <span>Sematkan / Pin di Halaman Depan</span>
              </label>
            </div>

            <div className="flex gap-2 justify-end mt-4 pt-2 border-t border-neutral-100">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-neutral-200 font-bold text-sm text-neutral-700 hover:bg-neutral-300 transition-colors">Batal</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-bold text-sm flex items-center gap-2 hover:bg-indigo-700 transition-colors"><Save className="w-4 h-4" /> Simpan</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
