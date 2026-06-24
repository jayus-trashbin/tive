import React from 'react';
import { cn } from '../../lib/utils';

interface AppHeaderProps {
  title?: string;
  actions?: React.ReactNode;
  className?: string;
  children?: React.ReactNode; // For completely custom content if needed
}

export const AppHeader: React.FC<AppHeaderProps> = ({ title, actions, className, children }) => {
  return (
    <header className={cn("sticky top-0 shrink-0 px-page pt-safe pb-4 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md z-sticky", className, !children && "flex items-center justify-between gap-4")}>
      {children || (
        <>
          {title && <h1 className="text-h1 font-bold text-white truncate">{title}</h1>}
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </>
      )}
    </header>
  );
};
