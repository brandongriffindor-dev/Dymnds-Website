'use client';

import { useEffect, useRef, useState, Children, type ReactNode } from 'react';
import { observe } from '@/lib/shared-observer';

interface StaggerRevealProps {
  staggerDelay?: number;
  animation?: 'fade-up' | 'fade-in' | 'scale';
  duration?: number;
  threshold?: number;
  className?: string;
  children: ReactNode;
}

export default function StaggerReveal({
  staggerDelay = 60,
  animation = 'fade-up',
  duration = 600,
  threshold = 0.15,
  className = '',
  children,
}: StaggerRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPrefersReducedMotion(mq.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsVisible(true);
      return;
    }

    const el = ref.current;
    if (!el) return;

    return observe(el, (isIntersecting) => {
      if (isIntersecting) setIsVisible(true);
    }, threshold);
  }, [threshold, prefersReducedMotion]);

  const initialStyles: Record<string, Record<string, string>> = {
    'fade-up': {
      opacity: '0',
      transform: 'translateY(24px)',
    },
    'fade-in': {
      opacity: '0',
      transform: 'none',
    },
    scale: {
      opacity: '0',
      transform: 'scale(0.96)',
    },
  };

  const visibleStyles: Record<string, string> = {
    opacity: '1',
    transform: 'translateY(0) scale(1)',
  };

  const currentInitial = initialStyles[animation] || initialStyles['fade-up'];
  const items = Children.toArray(children);

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div ref={ref} className={className}>
      {items.map((child, i) => (
        <div
          key={i}
          style={{
            ...(isVisible ? visibleStyles : currentInitial),
            willChange: isVisible ? 'auto' : 'transform, opacity',
            transitionProperty: 'opacity, transform',
            transitionDuration: `${duration}ms`,
            transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
            transitionDelay: `${isVisible ? i * staggerDelay : 0}ms`,
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
