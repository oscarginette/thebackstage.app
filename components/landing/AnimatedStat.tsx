"use client";

import { useCountUp } from '@/hooks/useCountUp';
import { ReactNode } from 'react';

interface AnimatedStatProps {
  label: string;
  value: string;
  icon: ReactNode;
}

export function AnimatedStat({ label, value, icon }: AnimatedStatProps) {
  // Parse the value to extract number, decimals, and suffix
  const parseValue = (val: string) => {
    // Handle percentage
    if (val.includes('%')) {
      const num = parseFloat(val.replace('%', ''));
      return { end: num, decimals: 1, suffix: '%' };
    }

    // Handle "k" suffix (thousands)
    if (val.includes('k')) {
      const num = parseFloat(val.replace('k', ''));
      return { end: num, decimals: 1, suffix: 'k' };
    }

    // Handle regular numbers with commas
    const num = parseFloat(val.replace(/,/g, ''));
    return { end: num, decimals: 0, suffix: '' };
  };

  const { end, decimals, suffix } = parseValue(value);
  const { ref, value: animatedValue } = useCountUp({
    end,
    duration: 2000,
    decimals,
    suffix,
    separator: ',',
  });

  return (
    <div
      ref={ref}
      className="bg-white px-4 py-3 rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow flex items-center gap-3"
    >
      <span className="p-2 bg-muted/30 rounded-lg flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-bold text-foreground/40 tracking-widest mb-0.5">
          {label}
        </div>
        <div className="text-xl font-serif font-medium text-foreground tabular-nums">
          {animatedValue}
        </div>
      </div>
    </div>
  );
}
