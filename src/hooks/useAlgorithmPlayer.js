import { useCallback, useEffect, useMemo, useState } from 'react';

export default function useAlgorithmPlayer(steps = [], speed = 300, options = {}) {
  const { onStep, onFinish } = options;
  const [cursor, setCursor] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    setCursor(0);
    setIsPlaying(false);
    setFinished(false);
  }, [steps]);

  const visibleSteps = useMemo(() => steps.slice(0, cursor), [steps, cursor]);
  const currentStep = cursor > 0 ? steps[cursor - 1] : null;

  const advance = useCallback(() => {
    setCursor((current) => {
      if (current >= steps.length) {
        setIsPlaying(false);
        setFinished(true);
        return current;
      }
      const nextStep = steps[current];
      onStep?.(nextStep, current);
      const next = current + 1;
      if (next >= steps.length) {
        setIsPlaying(false);
        setFinished(true);
        onFinish?.();
      }
      return next;
    });
  }, [onFinish, onStep, steps]);

  useEffect(() => {
    if (!isPlaying || finished) return undefined;
    const timer = window.setTimeout(advance, speed);
    return () => window.clearTimeout(timer);
  }, [advance, finished, isPlaying, speed]);

  const play = useCallback(() => {
    if (steps.length) {
      setFinished(false);
      setIsPlaying(true);
    }
  }, [steps.length]);

  const pause = useCallback(() => setIsPlaying(false), []);

  const step = useCallback(() => {
    setIsPlaying(false);
    setFinished(false);
    advance();
  }, [advance]);

  const reset = useCallback(() => {
    setCursor(0);
    setIsPlaying(false);
    setFinished(false);
  }, []);

  return {
    cursor,
    visibleSteps,
    currentStep,
    isPlaying,
    finished,
    progress: steps.length ? cursor / steps.length : 0,
    play,
    pause,
    step,
    reset,
  };
}
