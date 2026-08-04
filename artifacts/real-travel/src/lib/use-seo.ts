import { useEffect } from "react";

const SITE = "https://real-travel.uz";

function setMeta(name: string, content: string, attr: "name" | "property" = "name") {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

/**
 * Per-route SEO. The SPA shares one index.html, so without this every page
 * would report the home title/description to crawlers and link previews. This
 * updates the title, description, canonical and Open Graph tags on navigation.
 */
export function useSeo({
  title,
  description,
  path,
}: {
  title: string;
  description?: string;
  path?: string;
}) {
  useEffect(() => {
    document.title = title;
    setMeta("og:title", title, "property");
    setMeta("twitter:title", title);
    if (description) {
      setMeta("description", description);
      setMeta("og:description", description, "property");
      setMeta("twitter:description", description);
    }
    if (path !== undefined) {
      const url = `${SITE}${path}`;
      setCanonical(url);
      setMeta("og:url", url, "property");
    }
  }, [title, description, path]);
}
