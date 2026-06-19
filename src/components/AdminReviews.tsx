import React, { useState, useEffect } from "react";
import { Review, subscribeToReviews, addReview, updateReview, deleteReview } from "../services";
import { Plus, Trash2, Edit3, X, Save, Image as ImageIcon } from "lucide-react";

export function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Partial<Review>>({});

  useEffect(() => {
    return subscribeToReviews(setReviews);
  }, []);

  const handleOpenModal = (review: Partial<Review> = {}) => {
    setEditingReview(review);
    setIsModalOpen(true);
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

  return (
    <div className="p-6 bg-slate-50 min-h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-black uppercase tracking-widest text-slate-900">Kelola Review</h2>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-indigo-600 text-white font-bold text-sm flex items-center gap-2 rounded shadow-md"
        >
          <Plus className="w-4 h-4" /> Tambah Review
        </button>
      </div>

      <div className="bg-white border-2 border-slate-900 shadow-[6px_6px_0px_0px_#0f172a]">
        <table className="w-full text-left">
          <thead className="bg-slate-900 text-white text-xs uppercase tracking-widest">
            <tr>
              <th className="p-4">Produk ID</th>
              <th className="p-4">Nama</th>
              <th className="p-4">Rating</th>
              <th className="p-4">Komentar</th>
              <th className="p-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((r) => (
              <tr key={r.id} className="border-b border-neutral-100">
                <td className="p-4 text-sm font-bold">{r.productId}</td>
                <td className="p-4 text-sm font-bold">{r.reviewerName}</td>
                <td className="p-4 text-sm font-bold">{r.rating} / 5</td>
                <td className="p-4 text-sm text-neutral-600 truncate max-w-xs">{r.comment}</td>
                <td className="p-4 flex gap-2 justify-center">
                  <button onClick={() => handleOpenModal(r)} className="p-1.5 text-blue-600 hover:bg-blue-50"><Edit3 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(r.id!)} className="p-1.5 text-rose-600 hover:bg-rose-50"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSave} className="bg-white p-6 rounded-lg w-full max-w-md border-2 border-slate-900 shadow-xl space-y-4">
            <h3 className="font-black uppercase tracking-widest text-lg">{editingReview.id ? "Edit Review" : "Tambah Review"}</h3>
            <input type="text" placeholder="Product ID" value={editingReview.productId || ""} onChange={e => setEditingReview({...editingReview, productId: e.target.value})} className="w-full p-2 border-2 border-slate-900" required />
            <input type="text" placeholder="Nama Reviewer" value={editingReview.reviewerName || ""} onChange={e => setEditingReview({...editingReview, reviewerName: e.target.value})} className="w-full p-2 border-2 border-slate-900" required />
            <input type="number" min="1" max="5" placeholder="Rating (1-5)" value={editingReview.rating || ""} onChange={e => setEditingReview({...editingReview, rating: Number(e.target.value)})} className="w-full p-2 border-2 border-slate-900" required />
            <textarea placeholder="Komentar" value={editingReview.comment || ""} onChange={e => setEditingReview({...editingReview, comment: e.target.value})} className="w-full p-2 border-2 border-slate-900" rows={3} />
            <input type="text" placeholder="Photo URL" value={editingReview.photoUrl || ""} onChange={e => setEditingReview({...editingReview, photoUrl: e.target.value})} className="w-full p-2 border-2 border-slate-900" />
            <div className="flex gap-2 justify-end mt-4">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-neutral-200 font-bold text-sm">Batal</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-bold text-sm flex items-center gap-2"><Save className="w-4 h-4" /> Simpan</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
