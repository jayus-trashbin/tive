import React from 'react';
import { cn } from '../../lib/utils';

interface SectionProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  headerRight?: React.ReactNode;
}

export const Section: React.FC<SectionProps> = ({ title, children, className, headerRight }) => {
  return (
    <section className={cn("space-y-6", className)}>
      {(title || headerRight) && (
        <div className="flex items-center justify-between">
          {title && <h2 className="text-h2 text-white">{title}</h2>}
          {headerRight && <div>{headerRight}</div>}
        </div>
      )}
      {children}
    </section>
  );
};
