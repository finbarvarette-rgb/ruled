import type { Metadata } from "next";
import Link from "next/link";
import { BlogPostCard } from "@/components/blog/BlogPostCard";
import { getAllPosts } from "@/lib/blog/utils";
import { m, marketingPageMain, ruledLogoSuffixStyle } from "@/lib/marketing-theme";

export const metadata: Metadata = {
  title: "The Ruled Blog | ruled.ca",
  description:
    "Guides, tips, and real talk about small claims court in Canada.",
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <main
      className="flex flex-col flex-1 min-h-screen px-4 sm:px-6 py-12 md:py-16"
      style={marketingPageMain}
    >
      <div className="max-w-2xl mx-auto w-full flex flex-col gap-10">
        <header className="flex flex-col gap-4">
          <Link href="/" className="text-sm w-fit" style={{ color: m.muted }}>
            &larr; Home
          </Link>
          <span
            className="text-3xl font-bold tracking-tight"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: m.text }}
          >
            ruled<span style={ruledLogoSuffixStyle()}>.ca</span>
          </span>
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight" style={{ color: m.text }}>
              The Ruled Blog
            </h1>
            <p className="text-sm md:text-base leading-relaxed" style={{ color: m.subtext }}>
              Guides, tips, and real talk about small claims court in Canada.
            </p>
          </div>
        </header>

        <div className="flex flex-col gap-5">
          {posts.map((post) => (
            <BlogPostCard key={post.slug} post={post} />
          ))}
        </div>
      </div>
    </main>
  );
}
