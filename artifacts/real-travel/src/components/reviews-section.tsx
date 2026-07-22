import { Quote, Star } from "lucide-react";
import { useLanguage } from "@/i18n";
import type { Review } from "@/lib/shared-travel-data";

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating}/5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < rating ? "fill-accent text-accent" : "text-border"}`}
        />
      ))}
    </div>
  );
}

/**
 * Social proof. Rendered only when there is something to show — an empty
 * "reviews" heading undermines trust more than having no section at all.
 */
export function ReviewsSection({ reviews }: { reviews: Review[] }) {
  const { t } = useLanguage();
  const published = reviews.filter((review) => review.published && review.text.trim());

  if (!published.length) return null;

  return (
    <section className="bg-primary py-24 text-primary-foreground md:py-28">
      <div className="container mx-auto max-w-6xl px-6 md:px-12">
        <div className="mb-12 max-w-2xl">
          <p className="mb-4 text-xs uppercase tracking-[0.35em] text-accent">{t.reviews.eyebrow}</p>
          <h2 className="mb-3 font-serif text-4xl md:text-5xl">{t.reviews.title}</h2>
          <p className="font-light leading-relaxed text-primary-foreground/70">{t.reviews.subtitle}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {published.map((review) => (
            <figure
              key={review.id}
              className="flex flex-col rounded-2xl bg-primary-foreground/5 p-7 ring-1 ring-primary-foreground/10"
            >
              <Quote className="mb-5 h-7 w-7 shrink-0 text-accent" />
              <blockquote className="mb-6 flex-1 font-light leading-relaxed text-primary-foreground/90">
                {review.text}
              </blockquote>

              <figcaption className="flex items-center gap-3 border-t border-primary-foreground/10 pt-5">
                {review.photo ? (
                  <img
                    src={review.photo}
                    alt=""
                    loading="lazy"
                    className="h-11 w-11 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
                    {review.author.trim().charAt(0).toUpperCase() || "?"}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{review.author}</div>
                  {review.location ? (
                    <div className="truncate text-sm text-primary-foreground/60">{review.location}</div>
                  ) : null}
                </div>
                <Stars rating={review.rating} />
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
