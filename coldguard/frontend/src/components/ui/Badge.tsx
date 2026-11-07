import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface BadgeProps {
  variant?: 'green' | 'amber' | 'rose' | 'slate' | 'teal' | 'blue';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'slate',
  children,
  className,
}) => {
  const styles = {
    green:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
    amber:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
    rose:
      'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800',
    slate:
      'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    teal:
      'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800',
    blue:
      'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border shadow-xs',
          styles[variant],
          className
        )
      )}
    >
      {children}
    </span>
  );
};

