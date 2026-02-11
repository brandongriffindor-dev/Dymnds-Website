'use client';

/**
 * Fix #3: Firebase client SDK removed from this component.
 * Reviews now arrive as props from the server component.
 * This eliminates the client-side Firestore waterfall.
 */

import ReviewCard, { StarRating } from '@/components/ReviewCard';
import type { Review } from '@/lib/fetch-products';

interface ProductReviewsProps {
  initialReviews?: Review[];
}

export default function ProductReviews({ initialReviews = [] }: ProductReviewsProps) {
  const reviews = initialReviews;

  const avgRating = reviews.length > 0
    ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
    : 0;

  return (
    <section className="py-16 px-6 border-t border-white/10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-2xl font-bebas italic tracking-wider mb-2">Customer Reviews</h2>
            {reviews.length > 0 && (
              <div className="flex items-center gap-3">
                <StarRating rating={Math.round(avgRating)} size="lg" />
                <span className="text-sm text-white/50">{avgRating} out of 5 ({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
              </div>
            )}
          </div>
        </div>

        {reviews.length === 0 ? (
          <div className="text-center py-12 border border-white/5 rounded-lg">
            <p className="text-white/30 mb-2">No reviews yet</p>
            <p className="text-sm text-white/20">Be the first to review this product</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {reviews.map(review => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
