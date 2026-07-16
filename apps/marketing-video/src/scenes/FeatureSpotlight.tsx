import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BRAND, FONT_FAMILY } from "../theme";
import { Background } from "../components/Background";
import { GlassCard, GoldText } from "../components/Glass";
import { ModuleBadge } from "../components/Logo";

interface SpotlightProps {
  startFrame: number;
  glyph: string;
  color: string;
  eyebrow: string;
  title: string;
  bullets: string[];
}

/**
 * Reusable "feature spotlight" layout: a glass card on the right with the
 * headline + bullets, and a large module badge on the left. Used for the AI
 * Assistant and Admin Analytics scenes.
 */
export const FeatureSpotlight: React.FC<SpotlightProps> = ({
  startFrame,
  glyph,
  color,
  eyebrow,
  title,
  bullets,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const local = Math.max(0, frame - startFrame);
  const cardIn = spring({ frame: local - 4, fps, config: { damping: 180 } });
  const badgeIn = spring({ frame: local - 2, fps, config: { damping: 160 } });
  const titleIn = spring({ frame: local - 10, fps, config: { damping: 170 } });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <Background />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 56,
          paddingLeft: 80,
          paddingRight: 80,
        }}
      >
        {/* Left: big module badge */}
        <div style={{ opacity: badgeIn, transform: `scale(${badgeIn})` }}>
          <div
            style={{
              width: 200,
              height: 200,
              borderRadius: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 88,
              background: `radial-gradient(circle at 30% 30%, ${color}2e, rgba(255,255,255,0.03))`,
              border: `1.5px solid ${color}77`,
              boxShadow: `0 0 60px ${color}55`,
            }}
          >
            {glyph}
          </div>
        </div>

        {/* Right: glass card with copy */}
        <GlassCard delay={8} style={{ width: 560, opacity: cardIn, transform: `scale(${cardIn})` }}>
          <div
            style={{
              color,
              fontFamily: FONT_FAMILY,
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            {eyebrow}
          </div>
          <div style={{ marginTop: 10, opacity: titleIn }}>
            <GoldText fontSize={46} weight={800}>
              {title}
            </GoldText>
          </div>
          <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 14 }}>
            {bullets.map((b, i) => {
              const bi = spring({
                frame: local - 18 - i * 8,
                fps,
                config: { damping: 200 },
              });
              return (
                <div
                  key={b}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    opacity: bi,
                    transform: `translateX(${interpolate(bi, [0, 1], [18, 0])}px)`,
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: color,
                      boxShadow: `0 0 10px ${color}`,
                      flexShrink: 0,
                    }}
                  />
                  <div
                    style={{
                      color: BRAND.ivory,
                      fontFamily: FONT_FAMILY,
                      fontSize: 19,
                      fontWeight: 500,
                    }}
                  >
                    {b}
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </div>
    </AbsoluteFill>
  );
};
