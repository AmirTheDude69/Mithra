import { useEffect, useRef, useCallback } from 'react';

/* ── Equation & Symbol pools ── */
const EQUATIONS = [
  'e^{iπ} + 1 = 0', '∫₀^∞ e^{-x²} dx = √π/2', 'ζ(s) = Σ 1/nˢ',
  '∇ × E = -∂B/∂t', 'a² + b² = c²', 'F = ma',
  'Σ(1/n²) = π²/6', 'P(A|B) = P(B|A)·P(A)/P(B)', 'det(A-λI) = 0',
  'lim x→∞ (1+1/x)ˣ = e', '∂²u/∂t² = c²∇²u',
  'x = (-b ± √(b²-4ac))/2a', 'φ = (1+√5)/2', 'i² = -1',
  '∮ B·dl = μ₀I', 'H = -Σ pᵢ log pᵢ', 'Γ(n) = (n-1)!',
  '∇·E = ρ/ε₀', 'e^x = Σ xⁿ/n!', '∇²φ = 0',
  'sin²θ + cos²θ = 1', 'd/dx[e^x] = e^x', 'E = mc²', 'pV = nRT',
  'dx/dt = σ(y-x)', 'ΔS ≥ 0', 'curl(grad f) = 0', 'div(curl F) = 0',
  'Rμν - ½gμνR = 8πGTμν', '∂ρ/∂t + ∇·(ρv) = 0',
  'λ = h/p', '⟨ψ|φ⟩ = ∫ ψ*φ dx', '[A,B] = AB - BA',
  'n! ≈ √(2πn)(n/e)^n', '∫∫∫ ∇·F dV = ∮ F·dA',
];

const SYMBOLS = [
  '∑', '∏', '∫', '∂', '∇', '∞', 'π', 'θ', 'λ', 'Ω',
  'α', 'β', 'δ', 'ε', 'φ', 'ψ', '√', '≈', '≡', '∀',
  '∃', '⊂', '∈', '⊕', '⊗', 'γ', 'η', 'μ', 'σ', 'ω',
  'ξ', 'ζ', 'ℵ', '℘', 'ℂ', 'ℝ', 'ℤ', '∅', '∩', '∪',
  '⊥', '∥', '∠', '△', '□',
];

/* ── Physics constants ── */
const BLOCK_COUNT = 80;
const GRAVITY = 180;               // px/s² — gentle settling
const MOUSE_RADIUS = 180;          // hover detection
const MOUSE_FORCE = 6000;          // explosive repulsion
const RESTITUTION = 0.45;          // wall/floor bounce factor
const AIR_FRICTION = 0.992;        // velocity damping per frame
const ANGULAR_DAMPING = 0.985;     // rotation damping per frame
const FLOOR_FRICTION = 0.94;       // extra friction when touching floor
const COLLISION_RESTITUTION = 0.3; // block-block bounce
const MAX_SPEED = 1200;            // clamp to prevent explosion
const MAX_ANGULAR = 720;           // deg/s cap
const SETTLE_VEL = 0.4;            // velocity below which we start sleeping
const SETTLE_ANG = 0.3;            // angular vel below which we start sleeping

interface Block {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;        // degrees
  angularVel: number;      // deg/s
  text: string;
  fontSize: number;
  width: number;           // measured text width
  height: number;          // measured text height
  radius: number;          // bounding circle for collision
  opacity: number;
  baseOpacity: number;
  isSymbol: boolean;
  sleeping: boolean;       // not moving — skip expensive physics
  sleepTimer: number;      // frames of near-zero velocity
}

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function clamp(v: number, min: number, max: number) {
  return v < min ? min : v > max ? max : v;
}

function createBlocks(w: number, h: number, ctx: CanvasRenderingContext2D): Block[] {
  const rand = seededRandom(42);
  const blocks: Block[] = [];

  for (let i = 0; i < BLOCK_COUNT; i++) {
    const isSymbol = rand() > 0.5;
    const text = isSymbol
      ? SYMBOLS[Math.floor(rand() * SYMBOLS.length)]
      : EQUATIONS[Math.floor(rand() * EQUATIONS.length)];
    const fontSize = isSymbol ? 16 + rand() * 20 : 10 + rand() * 6;
    const baseOpacity = 0.04 + rand() * 0.07;

    // Measure text dimensions
    ctx.font = `italic ${fontSize}px "EB Garamond", "Georgia", serif`;
    const metrics = ctx.measureText(text);
    const textWidth = metrics.width;
    const textHeight = fontSize * 1.2;

    // Scatter across screen with some margin
    const margin = 60;
    const x = margin + rand() * (w - margin * 2);
    const y = margin + rand() * (h - margin * 2);
    const rotation = -20 + rand() * 40;

    const halfDiag = Math.sqrt(textWidth * textWidth + textHeight * textHeight) / 2;

    blocks.push({
      x, y,
      vx: 0, vy: 0,
      rotation,
      angularVel: 0,
      text,
      fontSize,
      width: textWidth,
      height: textHeight,
      radius: halfDiag * 0.6, // slightly smaller for visual overlap tolerance
      opacity: baseOpacity,
      baseOpacity,
      isSymbol,
      sleeping: true,
      sleepTimer: 100,
    });
  }
  return blocks;
}

export function FloatingEquations() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const blocksRef = useRef<Block[]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const prevMouseRef = useRef({ x: -9999, y: -9999 });
  const rafRef = useRef<number>(0);
  const sizeRef = useRef({ w: 0, h: 0 });
  const initializedRef = useRef(false);

  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const prevSize = sizeRef.current;
    sizeRef.current = { w, h };

    // On first init, create blocks. On resize, rescale positions.
    if (!initializedRef.current) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        blocksRef.current = createBlocks(w, h, ctx);
        initializedRef.current = true;
      }
    } else if (prevSize.w > 0 && prevSize.h > 0) {
      const sx = w / prevSize.w;
      const sy = h / prevSize.h;
      for (const b of blocksRef.current) {
        b.x *= sx;
        b.y *= sy;
      }
    }
  }, []);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);

    const handleMouse = (e: MouseEvent) => {
      prevMouseRef.current = { ...mouseRef.current };
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const handleMouseLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };
    // Touch support
    const handleTouch = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        prevMouseRef.current = { ...mouseRef.current };
        mouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };
    const handleTouchEnd = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };

    window.addEventListener('mousemove', handleMouse);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('touchmove', handleTouch, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouse);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('touchmove', handleTouch);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleResize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const loop = (now: number) => {
      const rawDt = (now - lastTime) / 1000;
      const dt = Math.min(rawDt, 0.033); // cap at ~30fps minimum step
      lastTime = now;

      const dpr = window.devicePixelRatio || 1;
      const { w, h } = sizeRef.current;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const blocks = blocksRef.current;

      ctx.clearRect(0, 0, w * dpr, h * dpr);
      ctx.save();
      ctx.scale(dpr, dpr);

      const mouseActive = mx > -999 && my > -999;

      // ── MOUSE INTERACTION ──
      if (mouseActive) {
        for (let i = 0; i < blocks.length; i++) {
          const b = blocks[i];
          const dx = b.x - mx;
          const dy = b.y - my;
          const distSq = dx * dx + dy * dy;

          if (distSq < MOUSE_RADIUS * MOUSE_RADIUS && distSq > 1) {
            const dist = Math.sqrt(distSq);
            const falloff = 1 - dist / MOUSE_RADIUS; // 1 at center, 0 at edge
            const force = MOUSE_FORCE * falloff * falloff; // quadratic falloff

            const nx = dx / dist;
            const ny = dy / dist;

            b.vx += nx * force * dt;
            b.vy += ny * force * dt;

            // Torque: cross product of offset from center × force direction
            // This creates realistic spin based on WHERE the force hits
            const offsetX = (mx - b.x);
            const offsetY = (my - b.y);
            const torque = (offsetX * ny - offsetY * nx) * force * 0.08;
            b.angularVel += torque * dt;

            b.sleeping = false;
            b.sleepTimer = 0;
          }
        }
      }

      // ── PHYSICS UPDATE ──
      for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i];

        if (b.sleeping) {
          // Still render sleeping blocks, just skip physics
          renderBlock(ctx, b);
          continue;
        }

        // Gravity
        b.vy += GRAVITY * dt;

        // Air friction
        b.vx *= AIR_FRICTION;
        b.vy *= AIR_FRICTION;
        b.angularVel *= ANGULAR_DAMPING;

        // Clamp velocities
        b.vx = clamp(b.vx, -MAX_SPEED, MAX_SPEED);
        b.vy = clamp(b.vy, -MAX_SPEED, MAX_SPEED);
        b.angularVel = clamp(b.angularVel, -MAX_ANGULAR, MAX_ANGULAR);

        // Integrate position
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.rotation += b.angularVel * dt;

        // ── WALL COLLISIONS (bounce off screen edges) ──
        const pad = 10;
        const halfW = b.width / 2;
        const halfH = b.height / 2;

        // Floor
        if (b.y + halfH > h - pad) {
          b.y = h - pad - halfH;
          b.vy = -Math.abs(b.vy) * RESTITUTION;
          b.vx *= FLOOR_FRICTION;
          // Floor friction also dampens angular velocity
          b.angularVel *= 0.92;
        }
        // Ceiling
        if (b.y - halfH < pad) {
          b.y = pad + halfH;
          b.vy = Math.abs(b.vy) * RESTITUTION;
        }
        // Right wall
        if (b.x + halfW > w - pad) {
          b.x = w - pad - halfW;
          b.vx = -Math.abs(b.vx) * RESTITUTION;
          // Wall impact adds spin
          b.angularVel += b.vy * 0.05;
        }
        // Left wall
        if (b.x - halfW < pad) {
          b.x = pad + halfW;
          b.vx = Math.abs(b.vx) * RESTITUTION;
          b.angularVel -= b.vy * 0.05;
        }

        // ── OPACITY: brighter when moving fast ──
        const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
        b.opacity = clamp(b.baseOpacity + speed * 0.0008, b.baseOpacity, 0.45);

        // ── SLEEP CHECK ──
        if (speed < SETTLE_VEL && Math.abs(b.angularVel) < SETTLE_ANG) {
          b.sleepTimer++;
          if (b.sleepTimer > 60) { // ~1 second of stillness
            b.sleeping = true;
            b.vx = 0;
            b.vy = 0;
            b.angularVel = 0;
            b.opacity = b.baseOpacity;
          }
        } else {
          b.sleepTimer = 0;
        }

        renderBlock(ctx, b);
      }

      // ── BLOCK-BLOCK COLLISIONS (circle approximation) ──
      // Only check awake blocks against each other
      for (let i = 0; i < blocks.length; i++) {
        if (blocks[i].sleeping) continue;
        for (let j = i + 1; j < blocks.length; j++) {
          const a = blocks[i];
          const b = blocks[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const distSq = dx * dx + dy * dy;
          const minDist = a.radius + b.radius;

          if (distSq < minDist * minDist && distSq > 0.1) {
            const dist = Math.sqrt(distSq);
            const overlap = minDist - dist;
            const nx = dx / dist;
            const ny = dy / dist;

            // Separate blocks
            const sep = overlap * 0.5;
            a.x -= nx * sep;
            a.y -= ny * sep;
            b.x += nx * sep;
            b.y += ny * sep;

            // Relative velocity along collision normal
            const relVx = a.vx - b.vx;
            const relVy = a.vy - b.vy;
            const relVn = relVx * nx + relVy * ny;

            // Only resolve if moving toward each other
            if (relVn > 0) {
              const impulse = relVn * (1 + COLLISION_RESTITUTION) * 0.5;
              a.vx -= impulse * nx;
              a.vy -= impulse * ny;
              b.vx += impulse * nx;
              b.vy += impulse * ny;

              // Transfer some angular momentum
              a.angularVel += (nx * relVy - ny * relVx) * 2;
              b.angularVel -= (nx * relVy - ny * relVx) * 2;

              // Wake up the other block
              b.sleeping = false;
              b.sleepTimer = 0;
            }
          }
        }
      }

      ctx.restore();
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0"
      style={{ pointerEvents: 'none' }}
      aria-hidden="true"
    />
  );
}

function renderBlock(ctx: CanvasRenderingContext2D, b: Block) {
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate((b.rotation * Math.PI) / 180);
  ctx.globalAlpha = clamp(b.opacity, 0, 1);
  ctx.font = `italic ${b.fontSize}px "EB Garamond", "Georgia", serif`;
  ctx.fillStyle = b.isSymbol ? '#9b1b30' : '#1a3a5c';
  // Draw centered
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(b.text, 0, 0);
  ctx.restore();
}