import { siteConfig, testimonials } from "@/lib/site-data";

export function ReviewAttribution({
  name,
  source,
  rating,
}: {
  name: string;
  source: string;
  rating: number;
}) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");
  return (
    <div className="review-attribution">
      <span className="review-avatar" aria-hidden="true">
        {initials}
      </span>
      <div>
        <div className="review-author-line">
          <span className="review-author-name">{name}</span>
          <span className="review-author-dot" aria-hidden="true">
            •
          </span>
          <span
            className="review-stars"
            role="img"
            aria-label={`${rating} out of 5 stars`}
          >
            {Array.from({ length: 5 }, (_, i) => (
              <svg
                key={i}
                viewBox="0 0 24 24"
                aria-hidden="true"
                fill={i < rating ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="1.25"
              >
                <path d="m12 3 2.78 5.63L21 9.54l-4.5 4.39 1.06 6.2L12 17.2l-5.56 2.93 1.06-6.2L3 9.54l6.22-.91Z" />
              </svg>
            ))}
          </span>
        </div>
        <a
          className="review-source"
          href={source}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Google review · excerpt — Read this review on Google"
        >
          Google review · excerpt <span aria-hidden="true">↗</span>
        </a>
      </div>
    </div>
  );
}

export function ReviewGrid() {
  return (
    <section aria-label="Selected Google reviews">
      <div className="reviews-intro">
        <p>
          A few words from our patients. Selected excerpts from reviews shared
          on Google, in their own words.
        </p>
        <a
          className="text-link"
          href={siteConfig.googleReviews}
          target="_blank"
          rel="noopener noreferrer"
        >
          See all reviews on Google ↗
        </a>
      </div>
      <div className="reviews-grid">
        {testimonials.map((review) => (
          <article
            className="review-card"
            data-reveal="card"
            key={review.source}
          >
            <span className="quote-mark" aria-hidden="true">
              “
            </span>
            <blockquote>{review.quote}</blockquote>
            <ReviewAttribution
              name={review.name}
              source={review.source}
              rating={review.rating}
            />
          </article>
        ))}
      </div>
    </section>
  );
}
