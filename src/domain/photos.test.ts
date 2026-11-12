import { describe, expect, it } from 'vitest';
import { fitWithin } from './photos';

describe('fitWithin', () => {
  it('scales the longest side down to the limit, keeping the ratio', () => {
    expect(fitWithin({ width: 4000, height: 3000 })).toEqual({ width: 1600, height: 1200 });
    expect(fitWithin({ width: 3000, height: 4000 })).toEqual({ width: 1200, height: 1600 });
  });

  it('never scales up', () => {
    expect(fitWithin({ width: 800, height: 600 })).toEqual({ width: 800, height: 600 });
  });

  it('keeps at least one pixel on extreme ratios', () => {
    expect(fitWithin({ width: 10000, height: 2 })).toEqual({ width: 1600, height: 1 });
  });
});
