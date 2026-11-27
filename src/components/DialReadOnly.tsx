import { DialFace, roundedMarker } from './Dial';

interface Props {
  avg: number | null;
  /** Width class, e.g. 'w-28'. */
  className?: string;
  showNumbers?: boolean;
}

/** Read-only dial: the hand points to the rounded average; the exact value is shown as text. */
export function DialReadOnly({ avg, className = 'w-28', showNumbers = true }: Props) {
  const text = avg === null ? '–' : avg.toFixed(1);
  return (
    <div
      role="img"
      aria-label={avg === null ? 'No ratings yet' : `Average score ${text} out of 10`}
      className={`aspect-square shrink-0 ${className}`}
    >
      <DialFace hand={avg === null ? null : roundedMarker(avg)} centerText={text} showNumbers={showNumbers} />
    </div>
  );
}
