import { sbSelect } from "./_lib";

type TourRow = { slug: string };

/**
 * GET /sitemap.xml
 *
 * Built from the database so newly published tours are discoverable without a
 * redeploy. Lists only the real, single-language routes the redesigned site
 * serves — the old /order page and the /ru,/en language variants were removed,
 * and listing dead URLs only wastes crawl budget.
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

  const entries: { path: string; priority: string; changefreq: string }[] = [
    { path: "/", priority: "1.0", changefreq: "daily" },
    { path: "/tours", priority: "0.9", changefreq: "daily" },
    { path: "/about", priority: "0.6", changefreq: "monthly" },
    { path: "/contact", priority: "0.6", changefreq: "monthly" },
    ...slugs.map((slug) => ({ path: `/tour/${slug}`, priority: "0.8", changefreq: "weekly" })),
  ];

  const urls = entries
    .map(
      ({ path, priority, changefreq }) =>
        `    <url>\n` +
        `      <loc>${origin}${path}</loc>\n` +
        `      <changefreq>${changefreq}</changefreq>\n` +
        `      <priority>${priority}</priority>\n` +
        `    </url>`,
    )
    .join("\n");

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `${urls}\n` +
    `</urlset>`;

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400");
  return res.status(200).send(xml);
}
