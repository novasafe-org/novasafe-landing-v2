import type { ReactNode } from "react";

/** Render inline `**bold**` segments within a line of text. */
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={`${keyPrefix}-b-${i}`} className="font-semibold text-ink">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

type Block =
  | { type: "h1" | "h2" | "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "img"; alt: string; src: string }
  | { type: "p"; text: string };

function parseBlocks(md: string): Block[] {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length) {
      blocks.push({ type: "ul", items: listItems });
      listItems = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      continue;
    }

    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushList();
      const level = heading[1].length as 1 | 2 | 3;
      const tag = level === 1 ? "h1" : level === 2 ? "h2" : "h3";
      blocks.push({ type: tag, text: heading[2].trim() });
      continue;
    }

    const bullet = trimmed.match(/^[-*]\s+(.+)$/);
    if (bullet) {
      listItems.push(bullet[1].trim());
      continue;
    }

    const image = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (image) {
      flushList();
      blocks.push({ type: "img", alt: image[1], src: image[2] });
      continue;
    }

    flushList();
    blocks.push({ type: "p", text: trimmed });
  }

  flushList();
  return blocks;
}

/** Lightweight markdown → React (headings, lists, bold, paragraphs). */
export function renderMarkdown(md: string): ReactNode[] {
  return parseBlocks(md).map((block, i) => {
    switch (block.type) {
      case "h1":
        return (
          <h2 key={i} className="mt-8 mb-3 text-2xl font-semibold tracking-tight text-ink first:mt-0">
            {renderInline(block.text, `h1-${i}`)}
          </h2>
        );
      case "h2":
        return (
          <h3 key={i} className="mt-7 mb-2 text-xl font-semibold tracking-tight text-ink first:mt-0">
            {renderInline(block.text, `h2-${i}`)}
          </h3>
        );
      case "h3":
        return (
          <h4 key={i} className="mt-6 mb-2 text-lg font-semibold text-ink first:mt-0">
            {renderInline(block.text, `h3-${i}`)}
          </h4>
        );
      case "ul":
        return (
          <ul key={i} className="my-4 space-y-2.5 pl-0">
            {block.items.map((item, j) => (
              <li key={j} className="flex gap-3 text-[16px] leading-relaxed text-ink-soft">
                <span className="mt-[10px] size-1 shrink-0 rounded-full bg-ink/20" aria-hidden="true" />
                <span>{renderInline(item, `li-${i}-${j}`)}</span>
              </li>
            ))}
          </ul>
        );
      case "img":
        return (
          <img key={i} src={block.src} alt={block.alt} className="my-6 w-full rounded-xl" loading="lazy" />
        );
      case "p":
        return (
          <p key={i} className="mb-4 text-[16px] leading-relaxed text-ink-soft last:mb-0">
            {renderInline(block.text, `p-${i}`)}
          </p>
        );
      default:
        return null;
    }
  });
}
