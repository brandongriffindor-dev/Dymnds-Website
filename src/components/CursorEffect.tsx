'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export default function CursorEffect() {
  const [hasPointer, setHasPointer] = useState(false);
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const posRef = useRef({ x: -100, y: -100 });
  const ringPosRef = useRef({ x: -100, y: -100 });
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
    const ring = ringRef.current;
    const dot = dotRef.current;

    // Smooth trailing for outer ring (lerp)
    ringPosRef.current.x += (x - ringPosRef.current.x) * 0.15;
    ringPosRef.current.y += (y - ringPosRef.current.y) * 0.15;

    const isHovering = hoveringRef.current;
    const ringSize = isHovering ? 56 : 36;
    const ringOffset = ringSize / 2;

    if (ring) {
      ring.style.transform = `translate3d(${ringPosRef.current.x - ringOffset}px, ${ringPosRef.current.y - ringOffset}px, 0)`;
      ring.style.width = `${ringSize}px`;
      ring.style.height = `${ringSize}px`;
      ring.style.borderColor = isHovering
        ? 'rgba(200, 169, 126, 0.6)'
        : 'rgba(255, 255, 255, 0.35)';
    }
    if (dot) {
      dot.style.transform = `translate3d(${x - 3}px, ${y - 3}px, 0)`;
      dot.style.opacity = isHovering ? '0' : '1';
    }

    rafRef.current = requestAnimationFrame(updateCursor);
  }, []);

  useEffect(() => {
    if (!hasPointer) return;

    const handleMouseMove = (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY };
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

    // Start the animation loop
    rafRef.current = requestAnimationFrame(updateCursor);

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
      {/* Outer ring — mix-blend-mode: difference for inversion effect */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 pointer-events-none z-50"
        style={{
          width: '36px',
          height: '36px',
          border: '1.5px solid rgba(255, 255, 255, 0.35)',
          borderRadius: '50%',
          mixBlendMode: 'difference',
          willChange: 'transform, width, height, border-color',
          transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1), height 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s ease',
        }}
      />
      {/* Inner dot — precise position indicator */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 pointer-events-none z-50"
        style={{
          width: '6px',
          height: '6px',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          borderRadius: '50%',
          mixBlendMode: 'difference',
          willChange: 'transform, opacity',
          transition: 'opacity 0.2s ease',
        }}
      />
    </>
  );
}
