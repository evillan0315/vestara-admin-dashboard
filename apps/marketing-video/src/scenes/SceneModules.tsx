import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { BRAND, FONT_FAMILY } from '../theme';
import { Background } from '../components/Background';
import { GoldText } from '../components/Glass';
import { ModuleBadge } from '../components/Logo';

const MODULES = [
  { glyph: '💳', color: BRAND.wallet, label: 'Digital Wallet' },
  { glyph: '🛍️', color: BRAND.marketplace, label: 'Marketplace' },
  { glyph: '🎁', color: BRAND.rewards, label: 'Rewards' },
  { glyph: '✈️', color: BRAND.bookings, label: 'Bookings' },
];

/**
 * Scene 2 — Module grid (frames 90–270, ~6s)
 * Four ecosystem pillars animate in as a row of glass badges.
 */
export const SceneModules: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleIn = spring({ frame: frame - 96, fps, config: { damping: 170 } });

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <Background />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 48,
        }}
      >
        <div
          style={{
            opacity: titleIn,
            transform: `translateY(${interpolate(titleIn, [0, 1], [18, 0])}px)`,
          }}
        >
          <GoldText fontSize={52} weight={700}>
            The Financial Super Platform
          </GoldText>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 32,
            paddingLeft: 24,
            paddingRight: 24,
          }}
        >
          {MODULES.map((m, i) => (
            <ModuleBadge
              key={m.label}
              glyph={m.glyph}
              color={m.color}
              label={m.label}
              delay={108 + i * 12}
            />
          ))}
        </div>

        <div
          style={{
            color: BRAND.muted,
            fontFamily: FONT_FAMILY,
            fontSize: 18,
            letterSpacing: 0.5,
            opacity: interpolate(frame, [180, 220], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
          }}
        >
          Wallets · Commerce · Loyalty · Travel — all in one ecosystem
        </div>
      </div>
    </AbsoluteFill>
  );
};
