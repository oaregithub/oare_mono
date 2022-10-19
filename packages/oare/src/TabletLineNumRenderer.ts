import TabletRenderer from './TabletRenderer';
import { formatLineNumber, localizeString } from './tabletUtils';

/**
 * Renders epigraphic readings with line numbers
 */
export default class TabletLineNumRenderer extends TabletRenderer {
  private renderer: TabletRenderer | null = null;

  constructor(renderer: TabletRenderer) {
    super(
      renderer.getEpigraphicUnits(),
      renderer.getLocale(),
      renderer.getRendererType()
    );
    this.renderer = renderer;
  }

  lineReading(lineNum: number) {
    if (this.renderer) {
      const reading = this.renderer.lineReading(lineNum);

      const lineNumber = formatLineNumber(lineNum);
      return reading
        ? localizeString(`${lineNumber} ${reading}`, this.locale)
        : '';
    }
    throw new Error('Undefined renderer passed to render decorator');
  }
}
