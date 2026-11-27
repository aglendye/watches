import { useId } from 'react';
import { deriveArt, edgeDistance, polarPoint, type ArtInput, type ArtSpec } from '../lib/watchArt';

const CX = 100;
const CY = 100;
const pt = (r: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return { x: CX + r * Math.sin(a), y: CY - r * Math.cos(a) };
};
const ROMAN = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];

/** Arc path for a ring segment between two radii and angles (degrees clockwise from 12). */
function ring(r1: number, r2: number, from: number, to: number) {
  const a = pt(r2, from), b = pt(r2, to), c = pt(r1, to), d = pt(r1, from);
  const large = to - from > 180 ? 1 : 0;
  return `M${a.x} ${a.y} A${r2} ${r2} 0 ${large} 1 ${b.x} ${b.y} L${c.x} ${c.y} A${r1} ${r1} 0 ${large} 0 ${d.x} ${d.y}Z`;
}

function Bezel({ s }: { s: ArtSpec }) {
  const b = s.bezel;
  const R1 = 74, R2 = 88;
  switch (b.kind) {
    case 'gmt':
      return (
        <g>
          <path d={ring(R1, R2, -90, 90)} fill={b.top} />
          <path d={ring(R1, R2, 90, 270)} fill={b.bottom} />
          {Array.from({ length: 24 }, (_, i) => {
            const p1 = pt(R2 - 2, i * 15), p2 = pt(R2 - (i % 2 ? 5 : 8), i * 15);
            return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#f3f2ee" strokeWidth={i === 0 ? 0 : 1.4} />;
          })}
          <path d={`M${CX} ${CY - R2 + 3} l-5 9 h10z`} fill="#f3f2ee" />
        </g>
      );
    case 'dive':
      return (
        <g>
          <path d={ring(R1, R2, 0, 359.99)} fill={b.color} />
          {Array.from({ length: 12 }, (_, i) => {
            if (i === 0) return null;
            const p1 = pt(R2 - 3, i * 30), p2 = pt(R2 - (i % 3 ? 7 : 10), i * 30);
            return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#f3f2ee" strokeWidth={2} strokeLinecap="round" />;
          })}
          <path d={`M${CX} ${CY - R1 - 2} l-6 -10 h12z`} fill="#f3f2ee" />
        </g>
      );
    case 'tachy':
      return (
        <g>
          <path d={ring(R1 + 2, R2, 0, 359.99)} fill={b.color} />
          {Array.from({ length: 30 }, (_, i) => {
            const p1 = pt(R2 - 2, i * 12), p2 = pt(R2 - 6, i * 12);
            return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={b.color === '#141517' ? '#f3f2ee' : '#1b1d20'} strokeWidth={1} opacity={0.8} />;
          })}
        </g>
      );
    case 'fluted':
      return (
        <g>
          <circle cx={CX} cy={CY} r={(R1 + R2) / 2} fill="none" stroke={s.bezelMetal} strokeWidth={R2 - R1} />
          {Array.from({ length: 48 }, (_, i) => {
            const p1 = pt(R1 + 1, i * 7.5), p2 = pt(R2 - 1, i * 7.5);
            return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#00000033" strokeWidth={1.6} />;
          })}
        </g>
      );
    case 'slide':
      return (
        <g>
          <circle cx={CX} cy={CY} r={(R1 + R2) / 2} fill="none" stroke={s.bezelMetal} strokeWidth={R2 - R1} />
          {Array.from({ length: 60 }, (_, i) => {
            const p = pt(R2 - 2, i * 6);
            return <circle key={i} cx={p.x} cy={p.y} r={1.5} fill="#00000040" />;
          })}
        </g>
      );
    case 'gems':
      return (
        <g>
          <circle cx={CX} cy={CY} r={(R1 + R2) / 2} fill="none" stroke={s.bezelMetal} strokeWidth={R2 - R1} />
          {Array.from({ length: 36 }, (_, i) => {
            const p = pt((R1 + R2) / 2, i * 10);
            const color = b.colors[b.colors.length > 2 ? Math.floor((i / 36) * b.colors.length) : i % b.colors.length];
            return <circle key={i} cx={p.x} cy={p.y} r={4.6} fill={color} stroke="#00000030" strokeWidth={0.6} />;
          })}
        </g>
      );
    default:
      return <circle cx={CX} cy={CY} r={(R1 + R2) / 2 - 3} fill="none" stroke={s.bezelMetal} strokeWidth={R2 - R1 - 6} />;
  }
}

function Case({ s }: { s: ArtSpec }) {
  const stroke = '#00000026';
  if (s.shape === 'rect') return <rect x={48} y={14} width={104} height={172} rx={14} fill={s.metal} stroke={stroke} />;
  if (s.shape === 'square')
    return (
      <g>
        <rect x={12} y={12} width={176} height={176} rx={30} fill={s.metal} stroke={stroke} />
        {[[30, 30], [170, 30], [30, 170], [170, 170]].map(([x, y]) => (
          <circle key={`${x}${y}`} cx={x} cy={y} r={4} fill="#00000033" />
        ))}
      </g>
    );
  if (s.shape === 'octagon') {
    const pts = Array.from({ length: 8 }, (_, i) => pt(92, i * 45 + 22.5)).map((p) => `${p.x},${p.y}`).join(' ');
    return (
      <g>
        <polygon points={pts} fill={s.bezelMetal} stroke={stroke} strokeLinejoin="round" />
        {Array.from({ length: 8 }, (_, i) => {
          const p = pt(80, i * 45 + 22.5);
          return <circle key={i} cx={p.x} cy={p.y} r={3.5} fill="#00000040" />;
        })}
      </g>
    );
  }
  return (
    <g>
      {/* lugs and crown */}
      <rect x={60} y={2} width={80} height={24} rx={6} fill={s.metal} />
      <rect x={60} y={174} width={80} height={24} rx={6} fill={s.metal} />
      <rect x={186} y={92} width={10} height={16} rx={3} fill={s.metal} stroke={stroke} />
      <circle cx={CX} cy={CY} r={92} fill={s.metal} stroke={stroke} />
    </g>
  );
}

/** The dial's surface (colour and texture), without markers. */
function DialPlate({ s, clip }: { s: ArtSpec; clip: string }) {
  const r = s.shape === 'round' ? 72 : s.shape === 'octagon' ? 70 : 74;
  return (
    <g>
      {s.shape === 'rect' ? (
        <rect x={58} y={26} width={84} height={148} rx={8} fill={s.dial} />
      ) : s.shape === 'square' ? (
        <rect x={26} y={26} width={148} height={148} rx={18} fill={s.dial} />
      ) : (
        <circle cx={CX} cy={CY} r={r} fill={s.dial} />
      )}
      <g clipPath={`url(#${clip})`}>
        {/* Royal Oak style grid */}
        {s.shape === 'octagon' &&
          Array.from({ length: 16 }, (_, i) => (
            <g key={i} stroke="#00000022" strokeWidth={0.8}>
              <line x1={30 + i * 9} y1={28} x2={30 + i * 9} y2={172} />
              <line x1={28} y1={30 + i * 9} x2={172} y2={30 + i * 9} />
            </g>
          ))}
      </g>
    </g>
  );
}

function Dial({ s, clip }: { s: ArtSpec; clip: string }) {
  const rect = s.shape === 'rect';
  const r = s.shape === 'round' ? 72 : s.shape === 'octagon' ? 70 : 74;
  return (
    <g>
      <DialPlate s={s} clip={clip} />
      {/* hour markers */}
      {s.roman
        ? ROMAN.map((t, i) => {
            const p = rect ? { x: CX + 30 * Math.sin((i * Math.PI) / 6), y: CY - 60 * Math.cos((i * Math.PI) / 6) } : pt(r - 14, i * 30);
            return (
              <text key={t} x={p.x} y={p.y} fontSize={i % 3 ? 8 : 10} fill={s.ink} textAnchor="middle" dominantBaseline="central" fontFamily="Georgia, serif">
                {t}
              </text>
            );
          })
        : Array.from({ length: 12 }, (_, i) => {
            if (s.date && i === 3) return null;
            const big = i % 3 === 0;
            const p1 = pt(r - 4, i * 30), p2 = pt(r - (big ? 16 : 12), i * 30);
            return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={s.ink} strokeWidth={big ? 4.5 : 3} strokeLinecap="round" />;
          })}
      {/* chronograph sub-dials */}
      {s.subdials === 3 &&
        [[CX - 30, CY], [CX + 30, CY], [CX, CY + 30]].map(([x, y]) => (
          <g key={`${x}${y}`}>
            <circle cx={x} cy={y} r={14} fill={s.subdialColor} stroke={s.ink} strokeOpacity={0.35} />
            <line x1={x} y1={y} x2={x} y2={y - 10} stroke={s.ink} strokeWidth={1.3} />
          </g>
        ))}
      {/* date window */}
      {s.date && <rect x={CX + r - 30} y={CY - 7} width={16} height={14} rx={2} fill="#f8f7f3" stroke="#00000030" />}
    </g>
  );
}

function Hands({ s }: { s: ArtSpec }) {
  const hour = pt(36, 305), minute = pt(56, 60);
  return (
    <g strokeLinecap="round">
      <line x1={CX} y1={CY} x2={hour.x} y2={hour.y} stroke={s.ink} strokeWidth={6} />
      <line x1={CX} y1={CY} x2={minute.x} y2={minute.y} stroke={s.ink} strokeWidth={4} />
      {s.gmtHand && (() => {
        const g = pt(60, 135);
        return (
          <g>
            <line x1={CX} y1={CY} x2={g.x} y2={g.y} stroke={s.gmtHand} strokeWidth={2} />
            <circle cx={g.x} cy={g.y} r={4} fill={s.gmtHand} />
          </g>
        );
      })()}
      {(() => {
        const sec = pt(64, 200), tail = pt(14, 20);
        return <line x1={tail.x} y1={tail.y} x2={sec.x} y2={sec.y} stroke={s.gmtHand ?? '#c23b2a'} strokeWidth={1.5} />;
      })()}
      <circle cx={CX} cy={CY} r={4} fill={s.ink} />
    </g>
  );
}

/** A drawn illustration of a watch from its data (used until a photo is uploaded). */
export function WatchArt({ watch, className = '' }: { watch: ArtInput; className?: string }) {
  const s = deriveArt(watch);
  const clip = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 200 200" className={`block ${className}`} role="img" aria-label={`Drawing of a ${watch.brand_name} ${watch.model_name}`}>
      <defs>
        <clipPath id={clip}>
          <circle cx={CX} cy={CY} r={70} />
        </clipPath>
      </defs>
      <Case s={s} />
      {s.shape === 'round' && <Bezel s={s} />}
      <Dial s={s} clip={clip} />
      <Hands s={s} />
    </svg>
  );
}

const ROMAN10 = ['X', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX'];

/** Highlight for the chosen score: dive-hand orange, darker on light dials so it reads. */
export function highlightFor(s: ArtSpec) {
  return s.ink === '#1b1d20' ? '#c2410c' : '#ff7a3d';
}

/** Where a score's tap target sits on this watch's dial (viewBox units). */
export function scoreTarget(s: ArtSpec, n: number) {
  const deg = (n % 10) * 36;
  return polarPoint(edgeDistance(s.shape, deg, s.shape === 'rect' ? 18 : 22), deg);
}

interface RatingFaceProps {
  spec: ArtSpec;
  /** Hand angle in degrees, or null for no hand. */
  angle: number | null;
  selected?: number | null;
  centerText: string;
  /** Turns the bezel to this angle (round watches with a bezel). */
  bezelDeg?: number;
  turning?: boolean;
  showNumbers?: boolean;
}

/**
 * The rating dial drawn as the watch itself: its case, bezel and dial colours,
 * with ten score markers in place of the hours and one hand pointing at the score.
 * Purely visual (aria-hidden); the interactive parts live in Dial.
 */
export function WatchRatingFace({ spec: s, angle, selected = null, centerText, bezelDeg = 0, turning = false, showNumbers = true }: RatingFaceProps) {
  const clip = useId().replace(/:/g, '');
  const hi = highlightFor(s);
  const rect = s.shape === 'rect';
  const cap = rect ? 13 : 22;
  const reach = rect ? 20 : s.roman ? 42 : 50;
  const ease = turning ? '' : 'dial-hand';
  return (
    <svg viewBox="0 0 200 200" className="block h-full w-full" aria-hidden="true" focusable="false">
      <defs>
        <clipPath id={clip}>
          <circle cx={CX} cy={CY} r={70} />
        </clipPath>
      </defs>
      <Case s={s} />
      {s.shape === 'round' && (
        <g className={ease} style={{ transform: `rotate(${bezelDeg}deg)`, transformOrigin: '100px 100px' }}>
          <Bezel s={s} />
        </g>
      )}
      <DialPlate s={s} clip={clip} />
      {Array.from({ length: 10 }, (_, i) => {
        const n = i + 1;
        const deg = (n % 10) * 36;
        const on = n === selected;
        const outer = edgeDistance(s.shape, deg, 4);
        const a = polarPoint(outer, deg);
        const b = polarPoint(outer - (n === 10 ? 14 : 10), deg);
        // Roman-numeral dials (Cartier, Wimbledon) show numerals only, near the edge, like the real thing.
        const t = polarPoint(outer - (s.roman ? (rect ? 12 : 10) : rect ? 17 : 23), deg);
        return (
          <g key={n}>
            {!s.roman && (
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={on ? hi : s.ink} strokeWidth={n === 10 ? 5 : 3.5} strokeLinecap="round" />
            )}
            {showNumbers && (
              <text
                x={t.x}
                y={t.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={s.roman ? (n === 10 ? 15 : on ? 14 : 12) : n === 10 ? 17 : 15}
                fontWeight={on ? 800 : 700}
                fontFamily={s.roman ? 'Georgia, serif' : 'var(--font-display)'}
                fill={on ? hi : s.ink}
              >
                {s.roman ? ROMAN10[n % 10] : n}
              </text>
            )}
          </g>
        );
      })}
      {angle !== null && (
        <g className={ease} style={{ transform: `rotate(${angle}deg)`, transformOrigin: '100px 100px' }}>
          <path d={`M ${CX - 3.5} ${CY - cap + 1} L ${CX} ${CY - reach} L ${CX + 3.5} ${CY - cap + 1} Z`} fill={hi} stroke="#00000055" strokeWidth={0.6} />
        </g>
      )}
      <circle cx={CX} cy={CY} r={cap} fill={s.dial} stroke={hi} strokeWidth={1.6} />
      <text
        x={CX}
        y={CY + 1}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={rect ? (centerText.length > 2 ? 10 : 14) : centerText.length > 2 ? 17 : 24}
        fontWeight={800}
        fontFamily="var(--font-display)"
        fill={s.ink}
      >
        {centerText}
      </text>
    </svg>
  );
}

/** Shows the watch's photo when there is one, otherwise the drawing. */
export function WatchImage({
  watch,
  photoUrl,
  className = '',
}: {
  watch: ArtInput;
  photoUrl?: string | null;
  className?: string;
}) {
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={`${watch.brand_name} ${watch.model_name}`}
        className={`block object-cover ${className}`}
        loading="lazy"
        decoding="async"
      />
    );
  }
  return <WatchArt watch={watch} className={className} />;
}
