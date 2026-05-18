import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f0e0c",
          borderBottom: "3px solid #c8392b",
          fontSize: 14,
          fontWeight: 700,
          color: "#f5f1eb",
          fontFamily: "Georgia, serif",
        }}
      >
        R.
      </div>
    ),
    { ...size }
  );
}
