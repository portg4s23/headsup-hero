import { useState, useEffect, useRef, useCallback } from 'react';

export function useRoundTimer(totalTime: number, onEnd: () => void) {
  const [roundRemaining, setRoundRemaining] = useState(totalTime);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onEndRef = useRef(onEnd);

  // Keep onEnd ref up to date
  useEffect(() => {
    onEndRef.current = onEnd;
  }, [onEnd]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    clearTimer();
    setIsRunning(true);
    setRoundRemaining(totalTime);

    intervalRef.current = setInterval(() => {
      setRoundRemaining((prev) => {
        if (prev <= 1) {
          clearTimer();
          setIsRunning(false);
          onEndRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [totalTime, clearTimer]);

  const pause = useCallback(() => {
    clearTimer();
    setIsRunning(false);
  }, [clearTimer]);

  const resume = useCallback(() => {
    if (roundRemaining > 0) {
      clearTimer();
      setIsRunning(true);

      intervalRef.current = setInterval(() => {
        setRoundRemaining((prev) => {
          if (prev <= 1) {
            clearTimer();
            setIsRunning(false);
            onEndRef.current();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  }, [roundRemaining, clearTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  return {
    roundRemaining,
    isRunning,
    start,
    pause,
    resume,
  };
}
