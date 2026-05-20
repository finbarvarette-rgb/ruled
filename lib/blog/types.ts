export type BlogBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] };

export type BlogPost = {
  slug: string;
  title: string;
  date: string;
  category: string;
  excerpt: string;
  content: BlogBlock[];
};
