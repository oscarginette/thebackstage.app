
'use client';

import { motion } from 'framer-motion';

export interface Step {
  id: string;
  label: string;
  completed: boolean;
  current: boolean;
}

interface DownloadProgressTrackerProps {
  steps: Step[];
}

export function DownloadProgressTracker({ steps }: DownloadProgressTrackerProps) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {steps.map((step) => (
        <motion.div
          key={step.id}
          initial={false}
          animate={{
            backgroundColor: step.completed || step.current ? 'var(--foreground)' : 'var(--color-muted)',
            width: step.current ? 20 : 8,
            opacity: step.current ? 1 : step.completed ? 0.6 : 0.3
          }}
          className="h-2 rounded-full transition-all duration-300"
          title={step.label}
        />
      ))}
    </div>
  );
}
