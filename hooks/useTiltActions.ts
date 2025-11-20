import { useEffect, useRef } from 'react';
import { DeviceMotion } from 'expo-sensors';
import * as Haptics from 'expo-haptics';

interface UseTiltActionsParams {
  onCorrect: () => void;
  onPass: () => void;
}

export function useTiltActions({ onCorrect, onPass }: UseTiltActionsParams) {
  const neutralRef = useRef(true);
  const hasTriggeredRef = useRef(false);
  const onCorrectRef = useRef(onCorrect);
  const onPassRef = useRef(onPass);

  // Keep refs up to date
  useEffect(() => {
    onCorrectRef.current = onCorrect;
    onPassRef.current = onPass;
  }, [onCorrect, onPass]);

  useEffect(() => {
    DeviceMotion.setUpdateInterval(100);

    const subscription = DeviceMotion.addListener((data) => {
      if (!data.rotation) return;

      // Use gamma for forward/backward tilt (pitch)
      // gamma is rotation around the y-axis
      const pitchRadians = data.rotation.gamma;
      const pitchDegrees = pitchRadians * (180 / Math.PI);

      console.log('Pitch Degrees:', pitchDegrees);

      // Check if in neutral zone (around 90 degrees)
      if (pitchDegrees > 75 && pitchDegrees < 105) {
        neutralRef.current = true;
        hasTriggeredRef.current = false;
      } else {
        neutralRef.current = false;
      }

      // Trigger actions only if coming from neutral zone and haven't triggered yet
      if (neutralRef.current === false && !hasTriggeredRef.current) {
        if (pitchDegrees < 50) {
          // Tilt up = Pass
          hasTriggeredRef.current = true;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => { });
          onPassRef.current();
        } else if (pitchDegrees > 130) {
          // Tilt down = Correct
          hasTriggeredRef.current = true;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => { });
          onCorrectRef.current();
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);
}
