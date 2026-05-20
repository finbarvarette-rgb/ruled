import type { BlogBlock, BlogPost } from "./types";
import { blogPosts } from "./posts";

export function getAllPosts(): BlogPost[] {
  return [...blogPosts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}

export function getAllSlugs(): string[] {
  return blogPosts.map((p) => p.slug);
}

function blockWordCount(block: BlogBlock): number {
  if (block.type === "ul" || block.type === "ol") {
    return block.items.join(" ").split(/\s+/).filter(Boolean).length;
  }
  return block.text.split(/\s+/).filter(Boolean).length;
}

export function estimateReadTime(content: BlogBlock[]): number {
  const words = content.reduce((sum, block) => sum + blockWordCount(block), 0);
  return Math.max(1, Math.ceil(words / 200));
}

export function formatBlogDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
