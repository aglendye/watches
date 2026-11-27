import { useMemo } from 'react';
import { deriveArt, type ArtInput } from '../lib/watchArt';
import { DialFace, handAngle, roundedMarker } from './Dial';
import { WatchRatingFace } from './WatchArt';

interface Props {
  avg: number | null;
  /** Width class, e.g. 'w-28'. */
  className?: string;
  showNumbers?: boolean;
  /** When given, drawn as this watch's dial. */
  watch?: ArtInput;
}

/** Read-only dial: the hand points to the rounded average; the exact value is shown as text. */
export function DialReadOnly({ avg, className = 'w-28', showNumbers = true, watch }: Props) {
  const spec = useMemo(() => (watch ? deriveArt(watch) : null), [watch]);
  const text = avg === null ? '–' : avg.toFixed(1);
  return (
    <div
      role="img"
      aria-label={avg === null ? 'No ratings yet' : `Average score ${text} out of 10`}
      className={`aspect-square shrink-0 ${className}`}
    >
      {spec ? (
        <WatchRatingFace
          spec={spec}
          angle={avg === null ? null : handAngle(roundedMarker(avg))}
          centerText={text}
          showNumbers={showNumbers}
        />
      ) : (
        <DialFace hand={avg === null ? null : roundedMarker(avg)} centerText={text} showNumbers={showNumbers} />
      )}
    </div>
  );
}
