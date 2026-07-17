import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { BRAND, FONT_FAMILY } from '../theme';
import { Background } from '../components/Background';
import { GoldText, GoldDivider } from '../components/Glass';
import { VestaraLogo } from '../components/Logo';

/**
 * Scene 5 — Call to action (frames 720–900, ~6s)
 * Logo lockup + tagline + "Build. Trade. Earn. Grow." and a CTA button.
 */
export const SceneCTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const local = Math.max(0, frame - 720);
  const logoIn = spring({ frame: local, fps, config: { damping: 150 } });
  const lineIn = spring({ frame: local - 12, fps, config: { damping: 170 } });
  const btnIn = spring({ frame: local - 26, fps, config: { damping: 180 } });

  const cta = 'Get early access';
  const btnOpacity = interpolate(btnIn, [0, 1], [0, 1]);

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <Background />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 28,
        }}
      >
        <div style={{ opacity: logoIn, transform: `scale(${logoIn})` }}>
          <VestaraLogo size={1.2} />
        </div>

        <div
          style={{
            opacity: lineIn,
            transform: `translateY(${interpolate(lineIn, [0, 1], [20, 0])}px)`,
          }}
        >
          <GoldText fontSize={60} weight={800}>
            Build. Trade. Earn. Grow.
          </GoldText>
        </div>

        <div style={{ width: 260, opacity: lineIn }}>
          <GoldDivider delay={18} width={260} />
        </div>

        <div
          style={{
            opacity: btnOpacity,
            transform: `scale(${btnIn}) translateY(${interpolate(btnIn, [0, 1], [16, 0])}px)`,
            marginTop: 10,
            padding: '16px 40px',
            borderRadius: 999,
            background: `linear-gradient(135deg, ${BRAND.goldBright}, ${BRAND.goldDeep})`,
            color: BRAND.bgDeep,
            fontFamily: FONT_FAMILY,
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: 0.5,
            boxShadow: `0 12px 40px rgba(212,175,55,0.45)`,
          }}
        >
          {cta}
        </div>

        <div
          style={{
            color: BRAND.muted,
            fontFamily: FONT_FAMILY,
            fontSize: 15,
            letterSpacing: 1,
            marginTop: 6,
            opacity: interpolate(local, [40, 70], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
          }}
        >
          vestara.io
        </div>
      </div>
    </AbsoluteFill>
  );
};
