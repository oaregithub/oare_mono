import { createTabletRenderer } from '../src';

describe('tablet renderer tests', () => {
  it('renders undetermined signs with damage', () => {
    const renderer = createTabletRenderer(
      [
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
        },
      ],
      [
        {
          startChar: null,
          endChar: null,
          referenceUuid: 'uuid',
          type: 'damage',
          value: null,
        },
        {
          startChar: null,
          endChar: null,
          referenceUuid: 'uuid',
          type: 'undeterminedSigns',
          value: 1,
        },
      ]
    );

    expect(renderer.lineReading(1)).toBe('[x]');
  });
});
