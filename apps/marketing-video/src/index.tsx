import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { VestaraEcosystemAd } from './VestaraEcosystemAd';

/**
 * Remotion entry point. Registers the 30-second Vestara ecosystem overview ad.
 * Resolution: 1920×1080 (16:9), 30fps, 900 frames = 30s.
 */
const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="VestaraEcosystemAd"
      component={VestaraEcosystemAd}
      durationInFrames={900}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};

registerRoot(RemotionRoot);
