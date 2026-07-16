import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BRAND, FONT_FAMILY } from "../theme";
import { Background } from "../components/Background";
import { GoldText, GoldDivider } from "../components/Glass";
import { VestaraLogo } from "../components/Logo";

/**
 * Scene 1 — Hook (frames 0–90, ~3s)
 * Bold statement over the brand logo: "One platform. Every transaction."
 */
export const SceneHook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoIn = spring({ frame: frame - 6, fps, config: { damping: 160 } });
  const lineIn = spring({ frame: frame - 22, fps, config: { damping: 170 } });
  const subIn = spring({ frame: frame - 40, fps, config: { damping: 170 } });

  const pulse = interpolate(frame, [0, 90], [1, 1.04], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <Background />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 26,
          transform: `scale(${pulse})`,
        }}
      >
        <div style={{ opacity: logoIn, transform: `scale(${logoIn})` }}>
          <VestaraLogo size={1.1} showTagline />
        </div>

        <div style={{ opacity: lineIn, transform: `translateY(${interpolate(lineIn, [0, 1], [20, 0])}px)` }}>
          <GoldText fontSize={72} weight={800}>
            One platform.
          </GoldText>
        </div>
        <div
          style={{
            opacity: subIn,
            transform: `translateY(${interpolate(subIn, [0, 1], [20, 0])}px)`,
            color: BRAND.ivory,
            fontFamily: FONT_FAMILY,
            fontSize: 30,
            fontWeight: 500,
            letterSpacing: 0.5,
          }}
        >
          Every transaction. One unified economy.
        </div>
        <div style={{ marginTop: 8, width: 200 }}>
          <GoldDivider delay={46} width={200} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
