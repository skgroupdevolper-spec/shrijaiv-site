/**
 * Floating leaves — pure CSS motion (transform + opacity only, paused off screen by the
 * reduced-motion rule). Used behind the home hero and on the app welcome screen.
 */
const LEAVES = [
  { x: 6, s: 26, d: 0, t: 14, r: -20 },
  { x: 18, s: 18, d: 3.5, t: 17, r: 30 },
  { x: 31, s: 22, d: 7, t: 15, r: -40 },
  { x: 47, s: 16, d: 1.8, t: 19, r: 10 },
  { x: 62, s: 24, d: 5.2, t: 16, r: 45 },
  { x: 76, s: 18, d: 9, t: 18, r: -15 },
  { x: 88, s: 28, d: 2.6, t: 13, r: 25 },
  { x: 95, s: 14, d: 6.4, t: 20, r: -35 },
];

export default function LeafField({ tone = 'green', count = 8, className = '' }: { tone?: 'green' | 'light'; count?: number; className?: string }) {
  const fill = tone === 'light' ? 'rgba(255,255,255,.55)' : 'rgba(0,154,53,.28)';
  const vein = tone === 'light' ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.7)';
  return (
    <div aria-hidden className={`leaf-field pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {LEAVES.slice(0, count).map((l, i) => (
        <span key={i} className="leaf" style={{ left: `${l.x}%`, width: l.s, height: l.s, animationDuration: `${l.t}s`, animationDelay: `-${l.d}s`, ['--r' as any]: `${l.r}deg` }}>
          <svg viewBox="0 0 32 32" width="100%" height="100%">
            <path d="M4 28C4 12 14 4 28 4c0 16-10 24-24 24z" fill={fill} />
            <path d="M5 27C12 20 18 13 26 6" stroke={vein} strokeWidth="1.4" fill="none" />
          </svg>
        </span>
      ))}
    </div>
  );
}
