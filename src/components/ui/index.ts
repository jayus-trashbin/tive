/**
 * UI Component Library — barrel export.
 *
 * Import from here, not from individual files:
 *   import { Button, EmptyState, IconButton } from '../ui';
 */
export { default as Button } from './Button';
export { default as ConfirmModal } from './ConfirmModal';
export { default as EmptyState } from './EmptyState';
export { default as IconButton } from './IconButton';
export { default as Modal } from './Modal';
export { Notifications } from './Notifications';
export { default as SkeletonBlock } from './SkeletonBlock';
export * from './SectionBoundaries';
export { ImageWithFallback } from './ImageWithFallback';
export { SmartExerciseMedia } from './SmartExerciseMedia';
export { default as GlobalSearch } from './GlobalSearch';
export { SplashScreen } from './SplashScreen';
export { default as SyncStatus } from './SyncStatus';

// Types
export type { ButtonVariant, ButtonSize } from './Button';
export type { IconButtonVariant, IconButtonSize } from './IconButton';
