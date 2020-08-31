import TabletRenderer from './TabletRenderer';

/**
 * Renders epigraphic readings with line numbers
 */
export default class TabletLineNumRenderer extends TabletRenderer {
  private renderer: TabletRenderer | null = null;

  constructor(renderer: TabletRenderer) {
    super(renderer.getEpigraphicUnits(), renderer.getMarkupUnits());
    this.renderer = renderer;
  }

  lineReading(lineNum: number) {
    if (this.renderer) {
      return `${lineNum}. ${this.renderer?.lineReading(lineNum)}`;
    }
    throw new Error('Undefined renderer passed to render decorator');
  }
}
