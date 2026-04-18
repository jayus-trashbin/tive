import React from 'react';
import { cn } from '../../lib/utils';

interface Props {
    className?: string;
}

const SkeletonBlock: React.FC<Props> = ({ className }) => (
    <div className={cn('bg-zinc-800 animate-pulse rounded-sm', className)} />
);

export default SkeletonBlock;
