import { FilterXSS } from "xss";

// Allow-list matching the admin rich text editor (font size, bold, italic,
// colour, alignment, lists, headings, links). Everything else is stripped.
const filter = new FilterXSS({
  whiteList: {
    p: ["style"],
    br: [],
    span: ["style"],
    strong: [],
    b: [],
    em: [],
    i: [],
    u: [],
    s: [],
    h2: ["style"],
    h3: ["style"],
    ul: ["style"],
    ol: ["style"],
    li: ["style"],
    blockquote: ["style"],
    a: ["href", "target", "rel"],
    mark: ["style"],
  },
  stripIgnoreTag: true,
  stripIgnoreTagBody: ["script", "style"],
  css: {
    whiteList: {
      color: true,
      "background-color": true,
      "font-size": true,
      "font-weight": true,
      "font-style": true,
      "text-align": true,
      "text-decoration": true,
    },
  },
  onTagAttr(tag, name, value) {
    if (tag === "a" && name === "href") {
      return /^(https?:|mailto:|\/)/i.test(value) ? `href="${value}"` : "";
    }
    return undefined;
  },
});

export function sanitizeRichText(html: string | null | undefined): string {
  return filter.process(html ?? "");
}

export function richTextToPlain(html: string | null | undefined): string {
  return (html ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
