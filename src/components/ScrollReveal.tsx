'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { observe } from '@/lib/shared-observer';

interface ScrollRevealProps {
  animation?: 'fade-up' | 'fade-in' | 'scale' | 'slide-left' | 'slide-right' | 'blur-up';
  delay?: number;
  duration?: number;
  threshold?: number;
  className?: string;
  children: ReactNode;
}

export default function ScrollReveal({
  animation = 'fade-up',
  delay = 0,
  duration = 600,
  threshold = 0.15,
  className = '',
  children,
}: ScrollRevealProps) {
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

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const initialStyles: Record<string, Record<string, string>> = {
    'fade-up': { opacity: '0', transform: 'translateY(24px)' },
    'fade-in': { opacity: '0', transform: 'none' },
    scale: { opacity: '0', transform: 'scale(0.96)' },
    'slide-left': { opacity: '0', transform: 'translateX(-30px)' },
    'slide-right': { opacity: '0', transform: 'translateX(30px)' },
    'blur-up': { opacity: '0', transform: 'translateY(20px)', filter: 'blur(8px)' },
  };

  const visibleStyles: Record<string, string> = {
    opacity: '1',
    transform: 'translateY(0) translateX(0) scale(1)',
    filter: 'blur(0px)',
  };

  const currentInitial = initialStyles[animation] || initialStyles['fade-up'];

  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...(isVisible ? visibleStyles : currentInitial),
        willChange: isVisible ? 'auto' : 'transform, opacity, filter',
        transitionProperty: 'opacity, transform, filter',
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
