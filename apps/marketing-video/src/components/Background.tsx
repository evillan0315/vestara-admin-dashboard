import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { BRAND } from '../theme';

/**
 * Animated dark-luxury background: deep navy base with two slow-drifting
 * gold/purple orb glows and a subtle vignette. Purely decorative.
 */
export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const orbX = interpolate(frame, [0, 900], [120, 220], {
    extrapolateRight: 'clamp',
  });
  const orbY = interpolate(frame, [0, 900], [160, 90], {
    extrapolateRight: 'clamp',
  });
  const orb2X = interpolate(frame, [0, 900], [900, 800], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BRAND.bgDeep,
        backgroundImage: `radial-gradient(120% 120% at 50% 0%, ${BRAND.bgPanel} 0%, ${BRAND.bgDeep} 60%)`,
      }}
    >
      {/* Soft gold orb */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(380px 380px at ${orbX}px ${orbY}px, rgba(212,175,55,0.18), transparent 70%)`,
        }}
      />
      {/* Soft violet/purple orb for depth */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(460px 460px at ${orb2X}px 540px, rgba(123,97,255,0.14), transparent 72%)`,
        }}
      />
      {/* Vignette */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(120% 100% at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)',
        }}
      />
    </AbsoluteFill>
  );
};
