"use client";

import { useEffect, useRef } from "react";

export function CursorParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current; const context = canvas?.getContext("2d"); if (!canvas || !context) return;
    type Particle = { x: number; y: number; vx: number; vy: number; life: number; size: number; hue: number };
    const particles: Particle[] = []; const pointer = { x: innerWidth * 0.5, y: innerHeight * 0.5 }; const target = { ...pointer }; const reduced = matchMedia("(prefers-reduced-motion: reduce)"); let animation = 0; let previous = 0;
    const resize = () => { const dpr = Math.min(devicePixelRatio, 1.75); canvas.width = Math.round(innerWidth * dpr); canvas.height = Math.round(innerHeight * dpr); canvas.style.width = `${innerWidth}px`; canvas.style.height = `${innerHeight}px`; context.setTransform(dpr, 0, 0, dpr, 0, 0); };
    const move = (event: PointerEvent) => { target.x = event.clientX; target.y = event.clientY; };
    const render = (now: number) => { animation = requestAnimationFrame(render); if (document.hidden || reduced.matches || now - previous < 24) return; const delta = Math.min((now - previous) / 16.67, 2); previous = now; pointer.x += (target.x - pointer.x) * 0.12; pointer.y += (target.y - pointer.y) * 0.12; if (Math.random() < 0.56) particles.push({ x: pointer.x, y: pointer.y, vx: (Math.random() - 0.5) * 0.55, vy: (Math.random() - 0.5) * 0.55, life: 1, size: 1.2 + Math.random() * 2.2, hue: Math.random() > 0.5 ? 155 : 328 }); context.clearRect(0, 0, innerWidth, innerHeight); for (let index = particles.length - 1; index >= 0; index -= 1) { const particle = particles[index]; particle.x += particle.vx * delta; particle.y += particle.vy * delta; particle.life -= 0.017 * delta; if (particle.life <= 0) { particles.splice(index, 1); continue; } const glow = context.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, particle.size * 5); glow.addColorStop(0, `hsla(${particle.hue}, 72%, 88%, ${particle.life * 0.7})`); glow.addColorStop(1, `hsla(${particle.hue}, 72%, 82%, 0)`); context.fillStyle = glow; context.beginPath(); context.arc(particle.x, particle.y, particle.size * 5, 0, Math.PI * 2); context.fill(); } };
    resize(); animation = requestAnimationFrame(render); addEventListener("resize", resize); addEventListener("pointermove", move, { passive: true });
    return () => { cancelAnimationFrame(animation); removeEventListener("resize", resize); removeEventListener("pointermove", move); };
  }, []);
  return <canvas ref={canvasRef} className="cursor-particles" aria-hidden="true" />;
}
