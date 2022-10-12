import { DiscourseDisplayUnit, DiscourseUnit } from '@oare/types';
import DiscourseRenderer, {
  displayUnitHelper,
  lineReadingHelperForWordsInTexts,
} from './DiscourseRenderer';

export default class DiscourseHtmlRenderer extends DiscourseRenderer {
  constructor(discourseUnits: DiscourseUnit[]) {
    super(discourseUnits);
    this.renderClass = DiscourseHtmlRenderer;
  }

  public wordsOnLine(line: number): DiscourseDisplayUnit[] {
    const words: DiscourseDisplayUnit[] = [];
    displayUnitHelper(this.discourseUnits, line, words, {
      transliteration: (word: string) => `<em>${word}</em>`,
      spelling: determinativeFormatter,
    });
    return words;
  }

  public lineReading(line: number): string {
    const words: DiscourseDisplayUnit[] = [];
    displayUnitHelper(this.discourseUnits, line, words, {
      transliteration: (word: string) => `<em>${word}</em>`,
      spelling: determinativeFormatter,
    });
    return words.map(word => word.display).join(' ');
  }

  public lineReadingForWordsInTexts(
    line: number,
    discourseUuids: string[]
  ): string {
    const words: string[] = [];
    lineReadingHelperForWordsInTexts(
      this.discourseUnits,
      discourseUuids,
      line,
      words,
      {
        transliteration: (word: string) => `<em>${word}</em>`,
        spelling: determinativeFormatter,
      }
    );
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
