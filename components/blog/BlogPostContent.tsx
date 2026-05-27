import type { BlogBlock } from "@/lib/blog/types";
import { m } from "@/lib/marketing-theme";

export function BlogPostContent({ blocks }: { blocks: BlogBlock[] }) {
  return (
    <div className="flex flex-col gap-5">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "h2":
            return (
              <h2
                key={i}
                className="text-xl font-semibold tracking-tight pt-2 break-words"
                style={{ color: m.text }}
              >
                {block.text}
              </h2>
            );
          case "h3":
            return (
              <h3
                key={i}
                className="text-base font-semibold tracking-tight break-words"
                style={{ color: m.text }}
              >
                {block.text}
              </h3>
            );
          case "p":
            return (
              <p
                key={i}
                className="text-base leading-relaxed break-words"
                style={{ color: m.subtext }}
              >
                {block.text}
              </p>
            );
          case "ul":
            return (
              <ul
                key={i}
                className="list-disc pl-5 flex flex-col gap-2 text-base leading-relaxed"
                style={{ color: m.subtext }}
              >
                {block.items.map((item, j) => (
                  <li key={j} className="break-words marker:text-[#C8392B]">
                    {item}
                  </li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol
                key={i}
                className="list-decimal pl-5 flex flex-col gap-2 text-base leading-relaxed"
                style={{ color: m.subtext }}
              >
                {block.items.map((item, j) => (
                  <li key={j} className="break-words marker:text-[#C8392B]">
                    {item}
                  </li>
                ))}
              </ol>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}

export function CategoryTag({ category }: { category: string }) {
  return (
    <span
      className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
      style={{
        background: "rgba(245, 158, 11, 0.12)",
        color: m.amber,
        border: "1px solid rgba(245, 158, 11, 0.35)",
      }}
    >
      {category}
    </span>
  );
}
