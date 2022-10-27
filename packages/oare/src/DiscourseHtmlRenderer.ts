import { DiscourseDisplayUnit, DiscourseUnit, LocaleCode } from '@oare/types';
import DiscourseRenderer, {
  displayUnitHelper,
  lineReadingHelperForWordsInTexts,
} from './DiscourseRenderer';
import { localizeString } from './tabletUtils';

export default class DiscourseHtmlRenderer extends DiscourseRenderer {
  constructor(discourseUnits: DiscourseUnit[], locale: LocaleCode) {
    super(discourseUnits, locale);
    this.renderClass = DiscourseHtmlRenderer;
  }

  public wordsOnLine(line: number): DiscourseDisplayUnit[] {
    const words: DiscourseDisplayUnit[] = [];
    displayUnitHelper(this.discourseUnits, line, words, {
      transliteration: (word: string) => `<em>${word}</em>`,
      spelling: determinativeFormatter,
    });
    return words.map(word => ({
      ...word,
      display: localizeString(word.display, this.locale),
    }));
  }

  public lineReading(line: number): string {
    const words: DiscourseDisplayUnit[] = [];
    displayUnitHelper(this.discourseUnits, line, words, {
      transliteration: (word: string) => `<em>${word}</em>`,
      spelling: determinativeFormatter,
    });
    return words
      .map(word => localizeString(word.display, this.locale))
      .join(' ');
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
    return words.map(word => localizeString(word, this.locale)).join(' ');
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
