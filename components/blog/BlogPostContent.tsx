import type { BlogBlock } from "@/lib/blog/types";

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
                style={{ color: "#f5f1eb" }}
              >
                {block.text}
              </h2>
            );
          case "h3":
            return (
              <h3
                key={i}
                className="text-base font-semibold tracking-tight break-words"
                style={{ color: "#f5f1eb" }}
              >
                {block.text}
              </h3>
            );
          case "p":
            return (
              <p
                key={i}
                className="text-base leading-relaxed break-words"
                style={{ color: "#d4cfc9" }}
              >
                {block.text}
              </p>
            );
          case "ul":
            return (
              <ul
                key={i}
                className="list-disc pl-5 flex flex-col gap-2 text-base leading-relaxed marker:text-[#c8392b]"
                style={{ color: "#d4cfc9" }}
              >
                {block.items.map((item, j) => (
                  <li key={j} className="break-words">
                    {item}
                  </li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol
                key={i}
                className="list-decimal pl-5 flex flex-col gap-2 text-base leading-relaxed marker:text-[#c8392b]"
                style={{ color: "#d4cfc9" }}
              >
                {block.items.map((item, j) => (
                  <li key={j} className="break-words">
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
        background: "rgba(200, 57, 43, 0.12)",
        color: "#c8392b",
        border: "1px solid rgba(200, 57, 43, 0.30)",
      }}
    >
      {category}
    </span>
  );
}
