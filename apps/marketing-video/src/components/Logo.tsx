import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { BRAND, FONT_FAMILY } from '../theme';

/**
 * The Vestara wordmark: a gold gem/diamond glyph followed by the name in
 * platinum, with a gold "V" accent. Used as a reusable brand lockup.
 */
export const VestaraLogo: React.FC<{
  size?: number;
  showTagline?: boolean;
}> = ({ size = 1, showTagline = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 160 } });
  const gemRotate = interpolate(frame, [0, 40], [-20, 0], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6 * size,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 * size }}>
        {/* Gold gem glyph */}
        <div
          style={{
            width: 34 * size,
            height: 34 * size,
            transform: `rotate(${gemRotate}deg) scale(${pop})`,
            background: `linear-gradient(135deg, ${BRAND.goldBright}, ${BRAND.goldDeep})`,
            clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
            boxShadow: `0 0 18px rgba(212,175,55,0.6)`,
          }}
        />
        <div
          style={{
            fontFamily: FONT_FAMILY,
            fontWeight: 800,
            fontSize: 40 * size,
            letterSpacing: 2 * size,
            color: BRAND.platinum,
            textShadow: '0 2px 18px rgba(0,0,0,0.5)',
          }}
        >
          VESTARA
        </div>
      </div>
      {showTagline && (
        <div
          style={{
            fontFamily: FONT_FAMILY,
            fontSize: 13 * size,
            letterSpacing: 3 * size,
            color: BRAND.goldSoft,
            textTransform: 'uppercase',
          }}
        >
          Build · Trade · Earn · Grow
        </div>
      )}
    </div>
  );
};

/**
 * Circular module badge with a glyph (emoji-as-icon) and a soft colored glow.
 */
export const ModuleBadge: React.FC<{
  glyph: string;
  color: string;
  label: string;
  delay?: number;
}> = ({ glyph, color, label, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - delay, fps, config: { damping: 200 } });
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        opacity: enter,
        transform: `translateY(${interpolate(enter, [0, 1], [16, 0])}px)`,
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 32,
          background: `radial-gradient(circle at 30% 30%, ${color}33, rgba(255,255,255,0.04))`,
          border: `1.5px solid ${color}77`,
          boxShadow: `0 0 26px ${color}55`,
        }}
      >
        {glyph}
      </div>
      <div
        style={{
          fontFamily: FONT_FAMILY,
          fontSize: 13,
          fontWeight: 600,
          color: BRAND.platinum,
          letterSpacing: 0.3,
        }}
      >
        {label}
      </div>
    </div>
  );
};
