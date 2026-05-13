import React from 'react';
import { cn } from '../../lib/utils';

interface Props {
    className?: string;
}

const SkeletonBlock: React.FC<Props> = ({ className }) => (
    <div className={cn('bg-zinc-900 animate-pulse rounded', className)} />
);

export default SkeletonBlock;
