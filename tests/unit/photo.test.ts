import { describe, expect, it } from 'vitest';
import { fitWithin, MAX_EDGE } from '../../src/lib/photo';

describe('photo resize maths', () => {
  it('shrinks the long edge to 1,600 px and keeps the aspect ratio', () => {
    expect(fitWithin(4032, 3024)).toEqual({ width: 1600, height: 1200 }); // iPhone landscape
    expect(fitWithin(3024, 4032)).toEqual({ width: 1200, height: 1600 }); // portrait
    expect(fitWithin(4000, 4000)).toEqual({ width: 1600, height: 1600 });
    expect(fitWithin(5000, 1000)).toEqual({ width: 1600, height: 320 });
  });

  it('never enlarges small photos', () => {
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 });
    expect(fitWithin(MAX_EDGE, 900)).toEqual({ width: MAX_EDGE, height: 900 });
  });

  it('rounds and never returns zero', () => {
    expect(fitWithin(16000, 3)).toEqual({ width: 1600, height: 1 });
    expect(fitWithin(3001, 2001, 1000)).toEqual({ width: 1000, height: 667 });
    expect(() => fitWithin(0, 10)).toThrow();
  });
});
