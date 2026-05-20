import Link from "next/link";
import type { BlogPost } from "@/lib/blog/types";
import { formatBlogDate } from "@/lib/blog/utils";
import { CategoryTag } from "./BlogPostContent";

export function BlogPostCard({ post }: { post: BlogPost }) {
  return (
    <article
      className="rounded-xl p-6 md:p-8 flex flex-col gap-4"
      style={{ background: "#1a1916", border: "1px solid #2a2825" }}
    >
      <div className="flex flex-wrap items-center gap-3">
        <CategoryTag category={post.category} />
        <time className="text-xs" style={{ color: "#9a9590" }} dateTime={post.date}>
          {formatBlogDate(post.date)}
        </time>
      </div>
      <h2 className="text-lg md:text-xl font-semibold tracking-tight leading-snug">
        <Link
          href={`/blog/${post.slug}`}
          className="hover:opacity-90 transition-opacity"
        >
          {post.title}
        </Link>
      </h2>
      <p className="text-sm leading-relaxed" style={{ color: "#9a9590" }}>
        {post.excerpt}
      </p>
      <Link
        href={`/blog/${post.slug}`}
        className="text-sm font-semibold w-fit mt-1"
        style={{ color: "#c8392b" }}
      >
        Read more &rarr;
      </Link>
    </article>
  );
}
