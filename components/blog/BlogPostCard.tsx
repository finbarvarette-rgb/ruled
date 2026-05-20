import Link from "next/link";
import type { BlogPost } from "@/lib/blog/types";
import { formatBlogDate } from "@/lib/blog/utils";
import { m, marketingCard } from "@/lib/marketing-theme";
import { CategoryTag } from "./BlogPostContent";

export function BlogPostCard({ post }: { post: BlogPost }) {
  return (
    <article
      className="rounded-xl p-6 md:p-8 flex flex-col gap-4"
      style={marketingCard}
    >
      <div className="flex flex-wrap items-center gap-3">
        <CategoryTag category={post.category} />
        <time className="text-xs" style={{ color: m.muted }} dateTime={post.date}>
          {formatBlogDate(post.date)}
        </time>
      </div>
      <h2 className="text-lg md:text-xl font-semibold tracking-tight leading-snug" style={{ color: m.text }}>
        <Link
          href={`/blog/${post.slug}`}
          className="hover:opacity-90 transition-opacity"
        >
          {post.title}
        </Link>
      </h2>
      <p className="text-sm leading-relaxed" style={{ color: m.subtext }}>
        {post.excerpt}
      </p>
      <Link
        href={`/blog/${post.slug}`}
        className="text-sm font-semibold w-fit mt-1"
        style={{ color: m.blue }}
      >
        Read more &rarr;
      </Link>
    </article>
  );
}
