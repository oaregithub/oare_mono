import { DiscourseRenderer, DiscourseHtmlRenderer } from '../src/index';
import mockUnits from '../mock/discourse';

describe('discourse renderer', () => {
  let renderer: DiscourseRenderer;
  beforeEach(() => {
    renderer = new DiscourseRenderer(mockUnits);
  });

  it('gets line numbers', () => {
    expect(renderer.lines).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
      11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
      21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
      31, 32, 33, 34, 35, 36, 37, 38,
    ]);
  });

  it('returns correct reading', () => {
    expect(renderer.lineReading(1)).toBe('KIŠIB ku-ku-zi mer\'a ṣé-eḫ-ri-ì-lí');
    expect(renderer.lineReading(20)).toBe('ana 4 ḫamšātem išaqqal');
    expect(renderer.lineReading(38)).toBe('ḫarrumūtem GÁN-lam e-tí-qú');
  });

  it('gets paragraph renderers', () => {
    expect(renderer.paragraphRenderers.length).toBe(3);
  });
});

describe('discourse html renderer', () => {
  let renderer: DiscourseRenderer;

  beforeEach(() => {
    renderer = new DiscourseHtmlRenderer(mockUnits);
  });

  test('renders with html', () => {
    expect(renderer.lineReading(1)).toBe('KIŠIB ku-ku-zi <em>mer\'a</em> ṣé-eḫ-ri-ì-lí');
  });

  test('paragraph renderers render with html', () => {
    const renderers = renderer.paragraphRenderers;
    expect(renderers[0].lineReading(1)).toBe('KIŠIB ku-ku-zi <em>mer\'a</em> ṣé-eḫ-ri-ì-lí');
  });

  test('sentence renderers render with html', () => {
    const renderers = renderer.sentenceRenderers;
    expect(renderers[0].lineReading(1)).toBe('KIŠIB ku-ku-zi <em>mer\'a</em> ṣé-eḫ-ri-ì-lí');
  });
});
