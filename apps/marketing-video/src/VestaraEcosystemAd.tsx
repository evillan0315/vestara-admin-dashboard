import React from 'react';
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame, useVideoConfig } from 'remotion';
import { BRAND, FONT_FAMILY } from './theme';
import { SceneHook } from './scenes/SceneHook';
import { SceneModules } from './scenes/SceneModules';
import { FeatureSpotlight } from './scenes/FeatureSpotlight';
import { SceneCTA } from './scenes/SceneCTA';

// Scene timing (30fps, 900 frames = 30s)
const HOOK = 0; // 0–90
const MODULES = 90; // 90–270
const AI = 270; // 270–450
const ANALYTICS = 450; // 450–630
const TRANSITION = 630; // 630–720 brief transition beat
const CTA = 720; // 720–900

const FADE = 12; // crossfade length in frames

/** Global persistent lower-third brand bar. */
const BrandBar: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const opacity = interpolate(
    frame,
    [HOOK + 30, HOOK + 42, durationInFrames - 40, durationInFrames - 24],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: 'flex-start',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          marginLeft: 40,
          marginBottom: 36,
          opacity,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div
          style={{
            width: 12,
            height: 12,
            background: `linear-gradient(135deg, ${BRAND.goldBright}, ${BRAND.goldDeep})`,
            clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
            boxShadow: `0 0 10px rgba(212,175,55,0.6)`,
          }}
        />
        <span
          style={{
            fontFamily: FONT_FAMILY,
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: 2,
            color: BRAND.platinum,
          }}
        >
          VESTARA
        </span>
      </div>
    </AbsoluteFill>
  );
};

/** Crossfading wrapper so scenes blend rather than hard-cut. */
const Crossfade: React.FC<{ frameStart: number; children: React.ReactNode }> = ({
  frameStart,
  children,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [frameStart - FADE, frameStart + FADE], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

export const VestaraEcosystemAd: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.bgDeep }}>
      {/* Persistent subtle grain/vignette handled per-scene via Background */}
      <Sequence from={HOOK} durationInFrames={MODULES - HOOK + FADE}>
        <Crossfade frameStart={HOOK}>
          <SceneHook />
        </Crossfade>
      </Sequence>

      <Sequence from={MODULES - FADE} durationInFrames={AI - MODULES + FADE * 2}>
        <Crossfade frameStart={MODULES}>
          <SceneModules />
        </Crossfade>
      </Sequence>

      <Sequence from={AI - FADE} durationInFrames={ANALYTICS - AI + FADE * 2}>
        <Crossfade frameStart={AI}>
          <FeatureSpotlight
            startFrame={AI}
            glyph="🤖"
            color={BRAND.ai}
            eyebrow="AI Assistant"
            title="Answers about your org"
            bullets={[
              'Data-aware RAG across users & activity',
              'Floating assistant on every screen',
              'Connect any REST API, auto-visualize',
            ]}
          />
        </Crossfade>
      </Sequence>

      <Sequence from={ANALYTICS - FADE} durationInFrames={TRANSITION - ANALYTICS + FADE * 2}>
        <Crossfade frameStart={ANALYTICS}>
          <FeatureSpotlight
            startFrame={ANALYTICS}
            glyph="📊"
            color={BRAND.analytics}
            eyebrow="Admin Analytics"
            title="Real-time clarity"
            bullets={[
              'Live KPI & audit dashboards',
              'Multi-tenant by organization',
              'CSV · Excel · PDF reporting',
            ]}
          />
        </Crossfade>
      </Sequence>

      <Sequence from={TRANSITION - FADE} durationInFrames={CTA - TRANSITION + FADE * 2}>
        <Crossfade frameStart={TRANSITION}>
          <SceneModules />
        </Crossfade>
      </Sequence>

      <Sequence from={CTA - FADE} durationInFrames={900 - CTA + FADE}>
        <Crossfade frameStart={CTA}>
          <SceneCTA />
        </Crossfade>
      </Sequence>

      <BrandBar />
    </AbsoluteFill>
  );
};
