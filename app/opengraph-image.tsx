import { ImageResponse } from "next/og";

export const alt = "Ruled — Fight Back. Get What You're Owed.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f0e0c",
          borderBottom: "8px solid #c8392b",
        }}
      >
        <div
          style={{
            fontSize: 96,
            fontWeight: 700,
            color: "#f5f1eb",
            fontFamily: "Georgia, serif",
            letterSpacing: "-2px",
          }}
        >
          Ruled.
        </div>
        <div
          style={{
            fontSize: 32,
            color: "#9a9590",
            marginTop: 24,
          }}
        >
          Fight back. Get what you're owed.
        </div>
        <div
          style={{
            fontSize: 24,
            color: "#6b6560",
            marginTop: 16,
          }}
        >
          AI-powered small claims court preparation for Canadians
        </div>
      </div>
    ),
    { ...size }
  );
}
