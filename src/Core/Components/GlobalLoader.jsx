import React, { useEffect, useState } from "react";

// 150ms anti-flicker delay — quick responses won't flash the overlay.
const SHOW_DELAY_MS = 150;

const styles = `
@keyframes plati-loader-spin { to { transform: rotate(360deg); } }
@keyframes plati-loader-fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes plati-loader-pulse {
  0%, 100% { opacity: 0.35; transform: scale(0.9); }
  50%      { opacity: 1;    transform: scale(1);   }
}
`;

const GlobalLoader = ({ visible, label = "Loading", sublabel = "Please wait" }) => {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!visible) { setShown(false); return; }
    const t = setTimeout(() => setShown(true), SHOW_DELAY_MS);
    return () => clearTimeout(t);
  }, [visible]);

  if (!shown) return null;

  return (
    <>
      <style>{styles}</style>
      <div
        aria-live="polite"
        aria-busy="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(255, 255, 255, 0.55)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          animation: "plati-loader-fade-in 160ms ease-out both",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            padding: "18px 26px",
            background: "white",
            border: "1px solid #e5e5e5",
            borderRadius: 20,
            boxShadow: "0 12px 36px rgba(26, 26, 26, 0.08), 0 2px 6px rgba(26, 26, 26, 0.04)",
            minWidth: 220,
          }}
        >
          {/* Spinner */}
          <div style={{ position: "relative", width: 36, height: 36, flexShrink: 0 }}>
            {/* Track */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                border: "3px solid #fbe7dc",
              }}
            />
            {/* Moving arc */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                border: "3px solid transparent",
                borderTopColor: "#f26c2d",
                borderRightColor: "#f26c2d",
                animation: "plati-loader-spin 0.85s cubic-bezier(0.4, 0, 0.2, 1) infinite",
              }}
            />
            {/* Center pulse */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: 6,
                height: 6,
                marginTop: -3,
                marginLeft: -3,
                borderRadius: "50%",
                background: "#f26c2d",
                animation: "plati-loader-pulse 1.4s ease-in-out infinite",
              }}
            />
          </div>

          {/* Label */}
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.25 }}>
            <span
              style={{
                fontSize: 15,
                fontWeight: 500,
                color: "#1a1a1a",
                letterSpacing: -0.1,
              }}
            >
              {label}
              <span style={{ display: "inline-block", width: 18, textAlign: "left" }}>
                <Dots />
              </span>
            </span>
            {sublabel && (
              <span style={{ fontSize: 12, color: "rgba(26, 26, 26, 0.55)", marginTop: 2 }}>
                {sublabel}
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

// Three animated dots that cycle  " " → "."  → ".."  → "..."
// Implemented as three stationary spans whose opacity cycles so layout doesn't jump.
const Dots = () => (
  <>
    <span style={{ animation: "plati-loader-pulse 1.2s ease-in-out infinite", animationDelay: "0ms" }}>.</span>
    <span style={{ animation: "plati-loader-pulse 1.2s ease-in-out infinite", animationDelay: "180ms" }}>.</span>
    <span style={{ animation: "plati-loader-pulse 1.2s ease-in-out infinite", animationDelay: "360ms" }}>.</span>
  </>
);

export default GlobalLoader;
