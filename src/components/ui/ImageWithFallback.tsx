import React, { useState, useEffect } from 'react';
import { Dumbbell, ImageOff } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackIcon?: React.ReactNode;
}

export const ImageWithFallback: React.FC<Props> = ({ 
  src, 
  alt, 
  className, 
  fallbackIcon,
  ...props 
}) => {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  // Reset status if src changes (e.g. recycling components in lists)
  useEffect(() => {
    setStatus('loading');
  }, [src]);

  return (
    <div className={cn("relative overflow-hidden bg-zinc-800 w-full h-full", className)}>
      
      {/* 1. The Image */}
      {status !== 'error' && (
        <img
          src={src}
          alt={alt}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-500",
            status === 'loaded' ? "opacity-100" : "opacity-0"
          )}
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
          {...props}
        />
      )}

      {/* 2. Loading Skeleton */}
      {status === 'loading' && (
        <div className="absolute inset-0 bg-zinc-800 animate-pulse flex items-center justify-center">
            <Dumbbell className="text-zinc-700 opacity-20" size={24} />
        </div>
      )}

      {/* 3. Error Fallback */}
      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 p-4">
          <div className="text-zinc-700 mb-2">
            {fallbackIcon || <ImageOff size={24} />}
          </div>
          <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest text-center">
            {alt || 'Image'} Unavailable
          </span>
        </div>
      )}
    </div>
  );
};