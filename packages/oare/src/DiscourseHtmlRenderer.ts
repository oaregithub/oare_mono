import { DiscourseUnit } from '@oare/types';
import DiscourseRenderer, { lineReadingHelper } from './DiscourseRenderer';

export default class DiscourseHtmlRenderer extends DiscourseRenderer {
  constructor(discourseUnits: DiscourseUnit[]) {
    super(discourseUnits);
    this.renderClass = DiscourseHtmlRenderer;
  }

  public lineReading(line: number): string {
    const words: string[] = [];
    lineReadingHelper(this.discourseUnits, line, words, {
      transliteration: (word: string) => `<em>${word}</em>`,
      spelling: determinativeFormatter,
    });
    return words.join(' ');
  }
}

function determinativeFormatter(word: string) {
  const matches = word.match(/\(.+\)/) || [];
  matches.forEach(match => {
    word = word.replace(
      match,
      `<sup>${match.slice(1, match.length - 1)}</sup>`
    );
  });
  return word;
}
