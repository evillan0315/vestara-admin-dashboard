import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { BRAND, FONT_FAMILY } from '../theme';

interface GoldTextProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  fontSize?: number;
  weight?: number;
  /** Optional gradient (defaults to gold gradient). */
  gradient?: string;
}

/**
 * Headline text rendered with the metallic gold gradient via background-clip.
 */
export const GoldText: React.FC<GoldTextProps> = ({
  children,
  style,
  fontSize = 64,
  weight = 800,
  gradient = `linear-gradient(135deg, ${BRAND.goldBright} 0%, ${BRAND.gold} 50%, ${BRAND.goldDeep} 100%)`,
}) => {
  return (
    <span
      style={{
        fontFamily: FONT_FAMILY,
        fontSize,
        fontWeight: weight,
        lineHeight: 1.05,
        letterSpacing: -0.5,
        backgroundImage: gradient,
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
        WebkitTextFillColor: 'transparent',
        display: 'inline-block',
        ...style,
      }}
    >
      {children}
    </span>
  );
};

/**
 * Glassmorphism panel with a thin gold hairline border and soft inner glow.
 */
export const GlassCard: React.FC<{
  children?: React.ReactNode;
  style?: React.CSSProperties;
  delay?: number;
}> = ({ children, style, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - delay, fps, config: { damping: 200 } });
  const opacity = interpolate(enter, [0, 1], [0, 1]);

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 20,
        padding: 28,
        opacity,
        transform: `scale(${interpolate(enter, [0, 1], [0.92, 1])})`,
        background:
          'linear-gradient(160deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)',
        backdropFilter: 'blur(12px)',
        border: `1px solid rgba(212,175,55,0.28)`,
        boxShadow: '0 20px 60px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/**
 * Thin animated gold underline bar, often used under a heading.
 */
export const GoldDivider: React.FC<{ delay?: number; width?: number }> = ({
  delay = 0,
  width = 120,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const grow = spring({ frame: frame - delay, fps, config: { damping: 180 } });
  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          height: 3,
          width: width * grow,
          borderRadius: 2,
          background: `linear-gradient(90deg, ${BRAND.goldBright}, ${BRAND.goldDeep})`,
          boxShadow: `0 0 14px rgba(212,175,55,0.6)`,
        }}
      />
    </AbsoluteFill>
  );
};
