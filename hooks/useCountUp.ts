"use client";

import { useEffect, useRef, useState } from 'react';

interface UseCountUpOptions {
  end: number;
  duration?: number;
  decimals?: number;
  suffix?: string;
  separator?: string;
}

export function useCountUp({
  end,
  duration = 2000,
  decimals = 0,
  suffix = '',
  separator = ',',
}: UseCountUpOptions) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true);
            animateCount();
          }
        });
      },
      {
        threshold: 0.3,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [hasAnimated]);

  const animateCount = () => {
    const startTime = Date.now();
    const endTime = startTime + duration;

    const updateCount = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);

      // Easing function (ease out cubic)
      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
      const easedProgress = easeOutCubic(progress);

      const currentCount = easedProgress * end;
      setCount(currentCount);

      if (now < endTime) {
        requestAnimationFrame(updateCount);
      } else {
        setCount(end);
      }
    };

    requestAnimationFrame(updateCount);
  };

  const formatNumber = (num: number): string => {
    // Handle decimals
    const fixed = num.toFixed(decimals);
    const parts = fixed.split('.');

    // Add thousand separators
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator);

    return parts.join('.') + suffix;
  };

  return {
    ref: elementRef,
    value: formatNumber(count),
  };
}
