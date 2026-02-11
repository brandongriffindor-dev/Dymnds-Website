/**
 * Animation utility functions for consistent animation styles.
 */

type EasingFunction =
  | 'cubic-bezier(0.16, 1, 0.3, 1)'
  | 'ease-out'
  | 'ease-in-out';

interface AnimationOptions {
  delay?: number;
  duration?: number;
  easing?: EasingFunction;
  fillMode?: 'forwards' | 'both' | 'none';
}

const DEFAULT_EASING: EasingFunction = 'cubic-bezier(0.16, 1, 0.3, 1)';

export function fadeInUpStyle(
  index: number = 0,
  options: AnimationOptions = {}
): React.CSSProperties {
  const { delay = 0, duration = 700, easing = DEFAULT_EASING } = options;
  const totalDelay = delay + index * 100;

  return {
    transitionProperty: 'opacity, transform',
    transitionDuration: `${duration}ms`,
    transitionTimingFunction: easing,
    transitionDelay: `${totalDelay}ms`,
  };
}

export function staggerDelay(
  index: number,
  baseDelay: number = 0,
  stagger: number = 100
): number {
  return baseDelay + index * stagger;
}

export const EASING = {
  smooth: 'cubic-bezier(0.16, 1, 0.3, 1)' as const,
  easeOut: 'ease-out' as const,
  easeInOut: 'ease-in-out' as const,
};
