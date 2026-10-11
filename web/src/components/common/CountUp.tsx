import React, { useEffect, useRef, useState } from 'react';

export interface CountUpProps {
  to: number;
  from?: number;
  direction?: 'up' | 'down';
  delay?: number; // Delay in seconds before counting starts
  duration?: number; // Duration in seconds
  className?: string;
  startWhen?: boolean;
  separator?: string;
  decimals?: number;
  onEnd?: () => void;
}

/**
 * ReactBits inspired 60fps CountUp component.
 * Uses requestAnimationFrame with cubic easeOutExpo curve for buttery smooth micro-animations.
 */
export const CountUp: React.FC<CountUpProps> = ({
  to,
  from = 0,
  delay = 0,
  duration = 1.2,
  className = '',
  startWhen = true,
  separator = ',',
  decimals = 0,
  onEnd,
}) => {
  const safeTo = typeof to === 'number' && !isNaN(to) ? to : (Number(to) || 0);
  const safeFrom = typeof from === 'number' && !isNaN(from) ? from : (Number(from) || 0);

  const [value, setValue] = useState<number>(safeFrom);
  const prevToRef = useRef<number>(safeFrom);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!startWhen) return;

    let startTimestamp: number | null = null;
    const startVal = prevToRef.current;
    const endVal = safeTo;
    const totalDuration = duration * 1000;
    const delayMs = delay * 1000;

    const easeOutExpo = (t: number): number => {
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    };

    let timeoutId: ReturnType<typeof setTimeout>;

    const animate = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / totalDuration, 1);
      const easedProgress = easeOutExpo(progress);

      const current = startVal + (endVal - startVal) * easedProgress;
      setValue(Number.isFinite(current) ? current : endVal);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setValue(endVal);
        prevToRef.current = endVal;
        onEnd?.();
      }
    };

    timeoutId = setTimeout(() => {
      frameRef.current = requestAnimationFrame(animate);
    }, delayMs);

    return () => {
      clearTimeout(timeoutId);
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [safeTo, startWhen, duration, delay]);

  const formattedValue = () => {
    const num = Number.isFinite(value) ? value : 0;
    const fixed = num.toFixed(decimals);
    const [intPart, decPart] = fixed.split('.');
    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
    return decPart ? `${formattedInt}.${decPart}` : formattedInt;
  };

  return <span className={`inline-block tabular-nums ${className}`}>{formattedValue()}</span>;
};

export default CountUp;
