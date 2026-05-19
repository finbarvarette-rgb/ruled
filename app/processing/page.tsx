"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/Spinner";
import { supabase } from "@/lib/supabase";
import {
  ONBOARDING_INTAKE_KEY,
  ONBOARDING_PROVINCE_KEY,
  ONBOARDING_EMAIL_KEY,
} from "@/lib/constants";

export default function ProcessingPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    async function run() {
      const intake = sessionStorage.getItem(ONBOARDING_INTAKE_KEY);
      const province = sessionStorage.getItem(ONBOARDING_PROVINCE_KEY);

      if (!intake?.trim() || !province) {
        router.replace("/onboarding");
        return;
      }

      try {
        const res = await fetch("/api/assess", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ intake, province }),
        });

        if (!res.ok) throw new Error("Assessment failed");

        const data = await res.json();
        const onboardingEmail = sessionStorage.getItem(ONBOARDING_EMAIL_KEY);
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const email = user?.email ?? onboardingEmail ?? null;

        sessionStorage.setItem(
          "ruled_assessment",
          JSON.stringify({
            assessment: data.assessment,
            province,
            intake,
            caseId: data.caseId ?? null,
            email,
          })
        );

        if (data.caseId && email) {
          await supabase
            .from("cases")
            .update({ email })
            .eq("id", data.caseId);
        }

        sessionStorage.removeItem(ONBOARDING_INTAKE_KEY);
        sessionStorage.removeItem(ONBOARDING_PROVINCE_KEY);
        sessionStorage.removeItem(ONBOARDING_EMAIL_KEY);

        router.replace("/results");
      } catch {
        setError("We could not analyze your case. Please try again.");
      }
    }

    run();
  }, [router]);

  return (
    <main
      className="flex flex-col flex-1 min-h-screen items-center justify-center px-6 gap-6"
      style={{ background: "#0f0e0c" }}
    >
      <span
        className="text-4xl font-bold tracking-tight"
        style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
      >
        ruled<span style={{ color: "#c8392b" }}>.ca</span>
      </span>
      {!error ? (
        <>
          <Spinner className="w-12 h-12" />
          <p className="text-lg" style={{ color: "#9a9590" }}>
            Analyzing your case...
          </p>
        </>
      ) : (
        <>
          <p className="text-sm text-center max-w-md" style={{ color: "#c8392b" }}>
            {error}
          </p>
          <button
            type="button"
            onClick={() => router.push("/onboarding")}
            className="rounded-lg px-6 py-3 text-sm font-semibold cursor-pointer"
            style={{ background: "#c8392b", color: "#f5f1eb" }}
          >
            Try again
          </button>
        </>
      )}
    </main>
  );
}
