import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: 'none' | 'rose' | 'amber' | 'emerald';
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  glow = 'none',
  ...props
}) => {
  const glowStyles = {
    none: '',
    rose: 'ring-2 ring-rose-500/80 shadow-rose-500/20 shadow-lg animate-pulse-fast',
    amber: 'ring-2 ring-amber-500/80 shadow-amber-500/20 shadow-lg',
    emerald: 'ring-1 ring-emerald-500/30',
  };

  return (
    <div
      className={twMerge(
        clsx(
          'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-xs transition-all overflow-hidden',
          glowStyles[glow],
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};

