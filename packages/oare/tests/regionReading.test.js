import { regionReading } from '../src/tabletUtils';

describe('region reading test', () => {
  it('displays seal impression with no reading', () => {
    expect(
      regionReading({
        reading: null,
        markups: [
          {
            type: 'isSealImpression',
          },
        ],
      })
    ).toBe('Seal Impression');
  });

  it('displays seal impression with reading', () => {
    expect(
      regionReading({
        reading: 'A',
        markups: [
          {
            type: 'isSealImpression',
          },
        ],
      })
    ).toBe('Seal Impression A');
  });

  it('displays broken', () => {
    expect(
      regionReading({
        markups: [
          {
            type: 'broken',
          },
        ],
      })
    ).toBe('broken');
  });

  it('displays uninscribed with no value', () => {
    expect(
      regionReading({
        markups: [
          {
            type: 'uninscribed',
            value: null,
          },
        ],
      })
    ).toBe('uninscribed');
  });

  it('displays uninscribed with 1 line', () => {
    expect(
      regionReading({
        markups: [
          {
            type: 'uninscribed',
            value: 1,
          },
        ],
      })
    ).toBe('1 uninscribed line');
  });

  it('displays uninscribed with more than 1 line', () => {
    expect(
      regionReading({
        markups: [
          {
            type: 'uninscribed',
            value: 2,
          },
        ],
      })
    ).toBe('2 uninscribed lines');
  });

  it('displays ruling', () => {
    expect(
      regionReading({
        markups: [
          {
            type: 'ruling',
            value: 1,
          },
        ],
      })
    ).toBe('---- Single Ruling ----');
  });

  it('displays stamp seal impression', () => {
    expect(
      regionReading({
        reading: 'A',
        markups: [
          {
            type: 'isStampSealImpression',
            value: 1,
          },
        ],
      })
    ).toBe('Stamp Seal Impression A (1)');
  });
});
