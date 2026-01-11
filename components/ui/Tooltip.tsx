/**
 * Tooltip Component
 *
 * Accessible tooltip component with proper ARIA attributes.
 * Follows Open/Closed Principle - extensible through props.
 *
 * Features:
 * - Shows on hover
 * - Supports multiline content
 * - Accessible (ARIA)
 * - Dark mode compatible
 */

'use client';

import { ReactNode, useState } from 'react';

export interface TooltipProps {
  content: string | ReactNode;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  disabled?: boolean;
  className?: string;
}

export function Tooltip({
  content,
  children,
  position = 'top',
  disabled = false,
  className = ''
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  if (disabled) {
    return <>{children}</>;
  }

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent'
  };

  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}

      {isVisible && (
        <div
          className={`absolute z-50 ${positionClasses[position]} pointer-events-none`}
          role="tooltip"
          aria-hidden={!isVisible}
        >
          <div className="relative bg-gray-900 dark:bg-gray-700 text-white text-sm px-3 py-2 rounded-lg shadow-lg max-w-xs whitespace-pre-line">
            {content}
            <div
              className={`absolute w-2 h-2 bg-gray-900 dark:bg-gray-700 transform rotate-45 ${arrowClasses[position]}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
