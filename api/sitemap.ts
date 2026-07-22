import { sbSelect } from "./_lib";

type TourRow = { slug: string };

const LANGUAGES = ["", "ru", "en"] as const;

/**
 * GET /sitemap.xml
 *
 * Built from the database so newly published tours are discoverable without a
 * redeploy. Every URL is listed in all three languages with hreflang, which is
 * how Google learns the pages are translations rather than duplicates.
 */
export default async function handler(req: any, res: any) {
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const origin = (process.env.SITE_URL || `https://${host}`).replace(/\/$/, "");

  let slugs: string[] = [];
  try {
    const tours = await sbSelect<TourRow>("tours", "select=slug&order=created_at.asc");
    slugs = tours.map((tour) => tour.slug).filter(Boolean);
  } catch {
    // An empty tour list still produces a valid sitemap of the static pages.
  }

  const paths = ["/", "/order", ...slugs.map((slug) => `/tours/${slug}`)];

  const urls = paths
    .map((path) => {
      const alternates = LANGUAGES.map((lang) => {
        const href = `${origin}${lang ? `/${lang}` : ""}${path === "/" && lang ? "" : path}`;
        return `      <xhtml:link rel="alternate" hreflang="${lang || "uz"}" href="${href}" />`;
      }).join("\n");

      return (
        `    <url>\n` +
        `      <loc>${origin}${path}</loc>\n` +
        `${alternates}\n` +
        `      <changefreq>weekly</changefreq>\n` +
        `    </url>`
      );
    })
    .join("\n");

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
    `${urls}\n` +
    `</urlset>`;

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400");
  return res.status(200).send(xml);
}
