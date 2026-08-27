import React, { useEffect, useRef } from 'react';

/**
 * A quiet, fixed full-viewport canvas: a field of drifting nodes that link up
 * when close together. Reads its color straight from the --primary CSS
 * variable so it always matches the current theme/accent with no extra prop.
 *
 * variant="hero"   — auth screens: a bit more visible, more headroom to move.
 * variant="subtle" — behind the app shell: barely-there, never fights the UI.
 */
export default function AnimatedBackground({ variant = 'subtle' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isHero = variant === 'hero';
    const density = isHero ? 14000 : 26000; // px^2 per node — lower = more nodes
    const linkDistance = isHero ? 140 : 110;
    const speed = isHero ? 0.18 : 0.08;
    const lineAlpha = isHero ? 0.16 : 0.07;
    const dotAlpha = isHero ? 0.35 : 0.16;

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let nodes = [];
    let rafId = null;

    const readColor = () => {
      const style = getComputedStyle(document.documentElement);
      return (style.getPropertyValue('--primary') || '#6366f1').trim();
    };
    let color = readColor();

    const makeNodes = () => {
      const count = Math.max(18, Math.round((width * height) / density));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() - 0.5) * speed
      }));
    };

    const resize = () => {
      width = canvas.parentElement ? canvas.parentElement.clientWidth : window.innerWidth;
      height = canvas.parentElement ? canvas.parentElement.clientHeight : window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      makeNodes();
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x <= 0 || n.x >= width) n.vx *= -1;
        if (n.y <= 0 || n.y >= height) n.vy *= -1;
      }

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < linkDistance) {
            ctx.strokeStyle = color;
            ctx.globalAlpha = lineAlpha * (1 - dist / linkDistance);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      ctx.globalAlpha = dotAlpha;
      ctx.fillStyle = color;
      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const loop = () => {
      draw();
      rafId = requestAnimationFrame(loop);
    };

    resize();
    if (prefersReducedMotion) {
      draw();
    } else {
      loop();
    }

    const onResize = () => resize();
    window.addEventListener('resize', onResize);

    // Re-read the accent color if the user flips light/dark mode.
    const themeObserver = new MutationObserver(() => { color = readColor(); });
    themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      themeObserver.disconnect();
    };
  }, [variant]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0
      }}
    />
  );
}
