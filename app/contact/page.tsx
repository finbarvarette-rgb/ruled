"use client";

import { useState } from "react";
import Link from "next/link";
import { Spinner } from "@/components/Spinner";
import {
  m,
  marketingBtnPrimary,
  marketingCard,
  marketingInput,
  marketingPageMain,
  ruledLogoSuffixStyle,
} from "@/lib/marketing-theme";

const CONTACT_CARDS = [
  {
    title: "General Questions",
    email: "hello@ruled.ca",
    description: "Product help, billing, or anything else.",
  },
  {
    title: "Legal Partnerships",
    email: "partners@ruled.ca",
    description: "Law firms, clinics, and referral partners.",
  },
  {
    title: "Press",
    email: "press@ruled.ca",
    description: "Media inquiries and interview requests.",
  },
];

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      if (!res.ok) throw new Error("Failed");
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="flex flex-col flex-1 min-h-screen px-4 sm:px-6 py-12 md:py-16"
      style={marketingPageMain}
    >
      <div className="max-w-2xl mx-auto w-full flex flex-col gap-10">
        <div className="flex flex-col gap-4">
          <Link href="/" className="text-sm w-fit" style={{ color: m.muted }}>
            &larr; Home
          </Link>
          <span
            className="text-3xl font-bold tracking-tight"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: m.text }}
          >
            ruled<span style={ruledLogoSuffixStyle()}>.ca</span>
          </span>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight" style={{ color: m.text }}>
            Get in Touch
          </h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {CONTACT_CARDS.map((card) => (
            <a
              key={card.email}
              href={`mailto:${card.email}`}
              className="rounded-xl p-5 flex flex-col gap-2 transition-opacity hover:opacity-90"
              style={marketingCard}
            >
              <h2 className="text-sm font-semibold" style={{ color: m.blue }}>
                {card.title}
              </h2>
              <p className="text-sm font-medium break-all" style={{ color: m.text }}>
                {card.email}
              </p>
              <p className="text-xs" style={{ color: m.subtext }}>
                {card.description}
              </p>
            </a>
          ))}
        </div>

        <div className="rounded-xl p-6 flex flex-col gap-4" style={marketingCard}>
          <h2 className="text-base font-semibold" style={{ color: m.text }}>
            Send us a message
          </h2>
          {sent ? (
            <p className="text-sm" style={{ color: m.green }}>
              Message sent. We&apos;ll get back to you soon.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input
                type="text"
                required
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg px-4 py-3 text-sm outline-none"
                style={marketingInput}
              />
              <input
                type="email"
                required
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg px-4 py-3 text-sm outline-none"
                style={marketingInput}
              />
              <textarea
                required
                rows={5}
                placeholder="Your message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-lg px-4 py-3 text-sm leading-relaxed resize-none outline-none"
                style={marketingInput}
              />
              {error && (
                <p className="text-sm" style={{ color: m.blue }}>
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="rounded-full px-6 py-3 text-sm font-semibold disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
                style={marketingBtnPrimary}
              >
                {loading && <Spinner />}
                {loading ? "Sending…" : "Send Message"}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
