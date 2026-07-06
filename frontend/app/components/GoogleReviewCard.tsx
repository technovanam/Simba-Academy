import type { PublicReview } from "../lib/api";

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex text-[#FF9F1C] gap-0.5 text-sm" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: Math.min(5, Math.max(0, rating)) }).map((_, i) => (
        <span key={i}>★</span>
      ))}
    </div>
  );
}

export function GoogleReviewCard({ review }: { review: PublicReview }) {
  const hasText = review.content && review.content !== "—";

  return (
    <article className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm text-left h-full flex flex-col min-w-0">
      <div className="flex items-start gap-3">
        {review.profilePhotoUrl ? (
          <img
            src={review.profilePhotoUrl}
            alt=""
            className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-[#8AC926]/15 border border-[#8AC926]/30 shrink-0 flex items-center justify-center text-[#6B9E1A] font-bold text-sm">
            {review.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h5 className="font-bold text-sm text-slate-900 truncate">{review.name}</h5>
          <Stars rating={review.rating} />
          <p className="text-2xs text-slate-500 font-medium mt-0.5 break-words">
            {[review.relativeTime, review.placeName].filter(Boolean).join(" · ") ||
              (review.source === "google" ? "Google Review" : "Simba Preschool Parent")}
          </p>
        </div>
        {review.source === "google" && (
          <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase bg-blue-50 text-blue-700 border border-blue-100 shrink-0">
            Google
          </span>
        )}
      </div>
      <p
        className={`text-sm leading-relaxed mt-3 flex-1 whitespace-pre-line ${
          hasText ? "text-slate-700" : "text-slate-500 italic"
        }`}
      >
        {hasText ? review.content : "Star rating only — no written feedback on Google."}
      </p>
    </article>
  );
}
