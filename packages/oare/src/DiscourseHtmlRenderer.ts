import { DiscourseUnit } from '@oare/types';
import DiscourseRenderer, { lineReadingHelper } from './DiscourseRenderer';

export default class DiscourseHtmlRenderer extends DiscourseRenderer {
  constructor(discourseUnits: DiscourseUnit[]) {
    super(discourseUnits);
    this.renderClass = DiscourseHtmlRenderer;
  }

  public lineReading(line: number): string {
    const words: string[] = [];
    lineReadingHelper(
      this.discourseUnits,
      line,
      words,
      (word: string) => `<em>${word}</em>`
    );
    return words.join(' ');
  }
}
