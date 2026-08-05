import { sbSelect } from "./_lib";

type TourRow = { slug: string; name: string; image: string | null };
type SettingRow = { value: string };

/** XML-escapes text so tour names / URLs with & < > " can't break the document. */
function xml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Turns a stored image reference into an absolute, crawlable URL (or null). */
function absImage(origin: string, image: string | null | undefined): string | null {
  if (!image) return null;
  const src = image.trim();
  if (/^https?:\/\//i.test(src)) return src;
  if (src.startsWith("/")) return `${origin}${src}`;
  return null;
}

/**
 * GET /sitemap.xml
 *
 * Built from the database so newly published tours are discoverable without a
 * redeploy. Uses the Google image-sitemap extension: each tour URL carries its
 * photo and the home page carries the gallery, so the site's real images become
 * eligible for Google Images and the search-result thumbnail — not just the
 * static og:image. Lists only the real routes the redesigned site serves.
 */
export default async function handler(req: any, res: any) {
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const origin = (process.env.SITE_URL || `https://${host}`).replace(/\/$/, "");

  let tours: TourRow[] = [];
  let galleryImages: string[] = [];
  try {
    tours = await sbSelect<TourRow>("tours", "select=slug,name,image&order=created_at.asc");
  } catch {
    // An empty tour list still produces a valid sitemap of the static pages.
  }
  try {
    const rows = await sbSelect<SettingRow>("settings", "key=eq.home_gallery&select=value&limit=1");
    const parsed = rows[0]?.value ? JSON.parse(rows[0].value) : [];
    if (Array.isArray(parsed)) galleryImages = parsed.filter((v) => typeof v === "string");
  } catch {
    // No gallery setting — the home page simply lists no extra images.
  }

  // Home page shows the brand image plus every gallery photo the admin added.
  const homeImages = [`${origin}/opengraph.jpg`, ...galleryImages]
    .map((src) => absImage(origin, src))
    .filter((src): src is string => Boolean(src));

  type Entry = { path: string; priority: string; changefreq: string; images?: { loc: string; title?: string }[] };

  const entries: Entry[] = [
    { path: "/", priority: "1.0", changefreq: "daily", images: homeImages.map((loc) => ({ loc, title: "Real Travel" })) },
    { path: "/tours", priority: "0.9", changefreq: "daily" },
    { path: "/about", priority: "0.6", changefreq: "monthly" },
    { path: "/contact", priority: "0.6", changefreq: "monthly" },
    ...tours
      .filter((t) => t.slug)
      .map((t) => {
        const img = absImage(origin, t.image);
        return {
          path: `/tour/${t.slug}`,
          priority: "0.8",
          changefreq: "weekly",
          images: img ? [{ loc: img, title: t.name || "Real Travel" }] : undefined,
        } as Entry;
      }),
  ];

  const urls = entries
    .map(({ path, priority, changefreq, images }) => {
      const imageTags = (images ?? [])
        .map(
          (im) =>
            `      <image:image>\n` +
            `        <image:loc>${xml(im.loc)}</image:loc>\n` +
            (im.title ? `        <image:title>${xml(im.title)}</image:title>\n` : "") +
            `      </image:image>`,
        )
        .join("\n");

      return (
        `    <url>\n` +
        `      <loc>${origin}${path}</loc>\n` +
        `      <changefreq>${changefreq}</changefreq>\n` +
        `      <priority>${priority}</priority>\n` +
        (imageTags ? `${imageTags}\n` : "") +
        `    </url>`
      );
    })
    .join("\n");

  const xmlDoc =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n` +
    `${urls}\n` +
    `</urlset>`;

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400");
  return res.status(200).send(xmlDoc);
}
