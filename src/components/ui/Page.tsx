import React from 'react';
import { cn } from '../../lib/utils';

interface PageProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export const Page: React.FC<PageProps> = ({ children, className, noPadding = false }) => {
  return (
    <div className={cn("flex flex-col h-full overflow-y-auto pt-safe pb-32 no-scrollbar scroll-smooth", !noPadding && "px-page", className)}>
      {children}
    </div>
  );
};
