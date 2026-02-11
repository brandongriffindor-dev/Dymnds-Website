'use client';

import { Star } from 'lucide-react';

interface Review {
  id: string;
  rating: number;
  title: string;
  body: string;
  authorName: string;
  verified: boolean;
  createdAt: { seconds: number };
}

export function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'w-5 h-5' : 'w-3.5 h-3.5';
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClass} ${star <= rating ? 'fill-white text-white' : 'text-white/20'}`}
        />
      ))}
    </div>
  );
}

export default function ReviewCard({ review }: { review: Review }) {
  const date = review.createdAt?.seconds
    ? new Date(review.createdAt.seconds * 1000).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  return (
    <div className="p-6 border border-white/10 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <StarRating rating={review.rating} />
        {review.verified && (
          <span className="text-[10px] tracking-widest uppercase text-green-400/80 border border-green-400/20 px-2 py-0.5 rounded-full">
            Verified Purchase
          </span>
        )}
      </div>
      <h4 className="text-sm font-medium mb-2">{review.title}</h4>
      <p className="text-sm text-white/50 leading-relaxed mb-3">{review.body}</p>
      <div className="flex items-center gap-2 text-xs text-white/30">
        <span>{review.authorName}</span>
        {date && <><span>·</span><span>{date}</span></>}
      </div>
    </div>
  );
}
