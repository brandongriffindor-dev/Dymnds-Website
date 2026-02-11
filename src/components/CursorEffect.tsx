'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export default function CursorEffect() {
  const [hasPointer, setHasPointer] = useState(false);
  const cursorRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const posRef = useRef({ x: 0, y: 0 });
  const hoveringRef = useRef(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasPointer(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => setHasPointer(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const updateCursor = useCallback(() => {
    const { x, y } = posRef.current;
    const cursor = cursorRef.current;
    const trail = trailRef.current;

    if (cursor) {
      cursor.style.transform = `translate3d(${x - 16}px, ${y - 16}px, 0) scale(${hoveringRef.current ? 1.5 : 1})`;
      cursor.style.opacity = hoveringRef.current ? '0.6' : '0.3';
    }
    if (trail) {
      trail.style.transform = `translate3d(${x - 4}px, ${y - 4}px, 0)`;
    }
  }, []);

  useEffect(() => {
    if (!hasPointer) return;

    const handleMouseMove = (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY };
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateCursor);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'A' || target.tagName === 'BUTTON' || target.closest('a') || target.closest('button')) {
        hoveringRef.current = true;
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'A' || target.tagName === 'BUTTON' || target.closest('a') || target.closest('button')) {
        hoveringRef.current = false;
      }
    };

    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseover', handleMouseOver, { passive: true });
    document.addEventListener('mouseout', handleMouseOut, { passive: true });

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      cancelAnimationFrame(rafRef.current);
    };
  }, [hasPointer, updateCursor]);

  if (!hasPointer) return null;

  return (
    <>
      <div
        ref={cursorRef}
        className="fixed top-0 left-0 w-8 h-8 pointer-events-none z-50"
        style={{
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(1px)',
          willChange: 'transform',
          transition: 'opacity 200ms ease-out',
        }}
      />
      <div
        ref={trailRef}
        className="fixed top-0 left-0 w-2 h-2 bg-white/20 rounded-full pointer-events-none z-50"
        style={{
          willChange: 'transform',
          transition: 'transform 500ms ease-out',
        }}
      />
    </>
  );
}
