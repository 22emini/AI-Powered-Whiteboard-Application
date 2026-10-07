import { ImageResponse } from "next/og";

export const alt = "Blank Canvas — AI-Powered Infinite Collaborative Whiteboard";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fafaf8",
          backgroundImage:
            "radial-gradient(circle at 25px 25px, #e4e4df 2%, transparent 0%), radial-gradient(circle at 75px 75px, #e4e4df 2%, transparent 0%)",
          backgroundSize: "100px 100px",
          fontFamily: "sans-serif",
          padding: 60,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              backgroundColor: "#166534",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontSize: 32,
              fontWeight: 800,
            }}
          >
            ✦
          </div>
          <span
            style={{
              fontSize: 42,
              fontWeight: 800,
              color: "#18181b",
              letterSpacing: -1,
            }}
          >
            Blank Canvas
          </span>
        </div>

        <h1
          style={{
            fontSize: 56,
            fontWeight: 800,
            color: "#18181b",
            textAlign: "center",
            maxWidth: 950,
            lineHeight: 1.2,
            margin: "0 0 20px 0",
          }}
        >
          Where scribbles bloom into ideas that think with you.
        </h1>

        <p
          style={{
            fontSize: 24,
            color: "#52525b",
            textAlign: "center",
            maxWidth: 800,
            lineHeight: 1.4,
            margin: "0 0 40px 0",
          }}
        >
          Infinite whiteboard with real-time multiplayer collaboration, AI sticky notes, flowcharts, charts, images & video calls.
        </p>

        <div
          style={{
            display: "flex",
            gap: 16,
            alignItems: "center",
          }}
        >
          <div
            style={{
              backgroundColor: "#166534",
              color: "#ffffff",
              padding: "12px 28px",
              borderRadius: 999,
              fontSize: 20,
              fontWeight: 600,
            }}
          >
            Start Whiteboarding Free
          </div>
          <div
            style={{
              backgroundColor: "#ffffff",
              color: "#18181b",
              border: "1px solid #e4e4e7",
              padding: "12px 24px",
              borderRadius: 999,
              fontSize: 20,
              fontWeight: 600,
            }}
          >
            ✦ AI-Powered
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
