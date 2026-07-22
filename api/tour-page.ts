import { sbSelect } from "./_lib";

type TourRow = {
  slug: string;
  name: string;
  location: string;
  description: string;
  image: string;
  price_uzs: number;
  duration: number;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Replaces a meta tag's content, or appends the tag when it is missing. */
function setMeta(html: string, attr: "property" | "name", key: string, value: string): string {
  const pattern = new RegExp(`<meta\\s+${attr}="${key}"[^>]*>`, "i");
  const tag = `<meta ${attr}="${key}" content="${escapeHtml(value)}" />`;
  return pattern.test(html) ? html.replace(pattern, tag) : html.replace("</head>", `    ${tag}\n  </head>`);
}

/**
 * Serves the SPA shell with per-tour metadata baked in.
 *
 * Telegram, Instagram and Facebook crawlers do not execute JavaScript, so the
 * meta tags React sets at runtime never reach them: every shared tour link
 * previewed as the same generic site card. This injects the real title,
 * description and image before the HTML leaves the server, which matters
 * because sharing links is how this agency actually markets.
 */
export default async function handler(req: any, res: any) {
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const origin = (process.env.SITE_URL || `https://${host}`).replace(/\/$/, "");
  const slug = String(req.query?.slug ?? "").trim();
  const lang = String(req.query?.lang ?? "").trim();

  // The shell is a static asset of this same deployment.
  let html: string;
  try {
    const shell = await fetch(`${origin}/index.html`);
    html = await shell.text();
  } catch {
    return res.status(302).setHeader("Location", "/").end();
  }

  try {
    const tours = slug
      ? await sbSelect<TourRow>(
          "tours",
          `slug=eq.${encodeURIComponent(slug)}&select=slug,name,location,description,image,price_uzs,duration&limit=1`,
        )
      : [];

    const tour = tours[0];

    if (tour) {
      const prefix = lang ? `/${lang}` : "";
      const url = `${origin}${prefix}/tours/${tour.slug}`;
      const title = `${tour.name} — ${tour.location} | Real Travel`;
      const description = (tour.description || tour.location).slice(0, 200);
      const image = tour.image?.startsWith("http") ? tour.image : `${origin}${tour.image || "/opengraph.jpg"}`;

      html = html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(title)}</title>`);
      html = setMeta(html, "name", "description", description);
      html = setMeta(html, "property", "og:title", title);
      html = setMeta(html, "property", "og:description", description);
      html = setMeta(html, "property", "og:image", image);
      html = setMeta(html, "property", "og:url", url);
      html = setMeta(html, "property", "og:type", "website");
      html = setMeta(html, "name", "twitter:card", "summary_large_image");
      html = setMeta(html, "name", "twitter:title", title);
      html = setMeta(html, "name", "twitter:description", description);
      html = setMeta(html, "name", "twitter:image", image);

      // Structured data, so search results can show price and duration.
      const jsonLd = {
        "@context": "https://schema.org",
        "@type": "TouristTrip",
        name: tour.name,
        description,
        image,
        url,
        touristType: "Leisure",
        itinerary: { "@type": "Place", name: tour.location },
        ...(tour.price_uzs > 0
          ? { offers: { "@type": "Offer", price: tour.price_uzs, priceCurrency: "UZS", url } }
          : {}),
      };

      html = html.replace(
        "</head>",
        `    <link rel="canonical" href="${url}" />\n` +
          `    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>\n  </head>`,
      );
    }
  } catch {
    // Fall through and serve the unmodified shell — a missing preview is much
    // better than a broken page.
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=300, stale-while-revalidate=86400");
  return res.status(200).send(html);
}
