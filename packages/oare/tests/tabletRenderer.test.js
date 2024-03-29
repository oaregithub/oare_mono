import { createTabletRenderer } from '../src';

describe('tablet renderer tests', () => {
  it('renders undetermined signs with damage', () => {
    const renderer = createTabletRenderer([
      {
        charOnLine: 1,
        charOnTablet: 1,
        column: 1,
        discourseUuid: 'dUuid',
        line: 1,
        reading: null,
        side: 'obv.',
        type: 'phonogram',
        uuid: 'uuid',
        value: null,
        objOnTablet: 1,
        markups: [
          {
            startChar: null,
            endChar: null,
            referenceUuid: 'uuid',
            type: 'undeterminedSigns',
            value: 1,
          },
          {
            startChar: null,
            endChar: null,
            referenceUuid: 'uuid',
            type: 'damage',
            value: null,
          },
        ],
      },
    ]);

    expect(renderer.lineReading(1)).toBe('[x]');
  });

  it('renders undeterminedSigns with erasure', () => {
    const renderer = createTabletRenderer([
      {
        uuid: 'uuid',
        line: 10,
        reading: null,
        markups: [
          {
            referenceUuid: 'uuid',
            type: 'undeterminedSigns',
            value: 1,
            startChar: null,
            endChar: null,
          },
          {
            referenceUuid: 'uuid',
            type: 'erasure',
            startChar: null,
            endChar: null,
          },
        ],
      },
    ]);

    expect(renderer.lineReading(10)).toBe('{x}');
  });
});
