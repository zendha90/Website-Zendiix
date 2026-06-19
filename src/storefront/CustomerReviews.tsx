import React, { useState, useEffect } from "react";
import { Review, subscribeToReviews } from "../services";
import { Star, ChevronLeft, Search } from "lucide-react";

export function CustomerReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    return subscribeToReviews(setReviews);
  }, []);

  const filteredReviews = reviews.filter(r => 
    r.reviewerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.comment?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-white font-sans p-6">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center mb-8 gap-4">
          <button onClick={() => window.history.back()} className="p-2 border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a]">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-black uppercase tracking-widest text-slate-900">Kumpulan Review</h1>
        </header>

        <div className="relative mb-6">
            <Search className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
            <input 
              type="text"
              placeholder="Cari review..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-slate-900 text-sm font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredReviews.map((review) => (
            <div key={review.id} className="border-2 border-neutral-100 p-4 rounded-lg shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-neutral-300"}`} />
                    ))}
                    <span className="font-bold text-xs ml-auto">{new Date(review.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="font-bold mb-1 text-sm">{review.reviewerName}</p>
                <p className="text-sm text-neutral-600 line-clamp-4">{review.comment}</p>
                {review.photoUrl && <img src={review.photoUrl} alt="Review" className="mt-3 w-full h-48 object-cover rounded" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
