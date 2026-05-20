import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogPostContent, CategoryTag } from "@/components/blog/BlogPostContent";
import {
  estimateReadTime,
  formatBlogDate,
  getAllSlugs,
  getPostBySlug,
} from "@/lib/blog/utils";
import {
  m,
  marketingBtnPrimary,
  marketingCard,
  marketingPageMain,
} from "@/lib/marketing-theme";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Post not found | ruled.ca" };
  return {
    title: `${post.title} | ruled.ca`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const readTime = estimateReadTime(post.content);

  return (
    <main
      className="flex flex-col flex-1 min-h-screen px-4 sm:px-6 py-12 md:py-16"
      style={marketingPageMain}
    >
      <article className="max-w-2xl mx-auto w-full flex flex-col gap-10">
        <header className="flex flex-col gap-5">
          <Link href="/blog" className="text-sm w-fit" style={{ color: m.muted }}>
            &larr; All posts
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <CategoryTag category={post.category} />
            <time className="text-sm" style={{ color: m.muted }} dateTime={post.date}>
              {formatBlogDate(post.date)}
            </time>
            <span className="text-sm" style={{ color: m.muted }}>
              · {readTime} min read
            </span>
          </div>
          <h1
            className="text-2xl md:text-3xl font-semibold tracking-tight leading-snug break-words"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: m.text }}
          >
            {post.title}
          </h1>
        </header>

        <BlogPostContent blocks={post.content} />

        <section
          className="rounded-xl p-6 md:p-8 flex flex-col gap-4"
          style={marketingCard}
        >
          <Link
            href="/onboarding"
            className="inline-flex items-center justify-center min-h-12 rounded-full px-6 py-4 text-sm font-semibold w-full sm:w-fit text-center"
            style={marketingBtnPrimary}
          >
            Ready to fight back? Start your free case assessment &rarr;
          </Link>
        </section>
      </article>
    </main>
  );
}
