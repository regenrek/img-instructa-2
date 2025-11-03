import type { HTMLAttributes } from 'react';
import { cn } from '~/lib/utils';

interface GradientOrbProps extends HTMLAttributes<HTMLDivElement> {}

export default function GradientOrb({ className, ...props }: GradientOrbProps) {
  return (
    <div
      className={cn(
        'pointer-events-none z-0 h-64 w-64 rounded-full bg-gradient-to-b from-yellow-200 via-yellow-300 to-amber-300 opacity-70 blur-3xl dark:from-yellow-900/70 dark:via-yellow-800/70 dark:to-amber-900/70',
        className
      )}
      {...props}
    />
  );
}
