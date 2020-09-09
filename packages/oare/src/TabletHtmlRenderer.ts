import TabletRenderer from './TabletRenderer';
import { EpigraphicUnit, MarkupUnit } from './index';

const superscriptRegex = /<sup>.*<\/sup>$/;

export function endsWithSuperscript(markedupUnit: string): boolean {
  return !!markedupUnit.match(superscriptRegex);
}

function isMarkupChar(char: string): boolean {
  return [
    '%',
    '{',
    '}',
    ':',
    '×',
    '‹',
    '›',
    '«',
    '»',
    '+',
    '+',
    'x',
    '#',
    '⸢',
    '⸣',
    '[',
    ']',
    '!',
    '?',
  ].includes(char);
}

function italicize(word: string) {
  let reading: string = '';
  word.split('').forEach((char) => {
    if (isMarkupChar(char)) {
      reading += char;
    } else {
      reading += `<em>${char}</em>`;
    }
  });
  return reading;
}

export function wordWithoutSuperscript(word: string): string {
  return word.split(superscriptRegex)[0];
}
/**
 * Renders epigraphic readings for display in a webpage
 */
export default class TabletHtmlRenderer extends TabletRenderer {
  private renderer: TabletRenderer | null = null;

  constructor(renderer: TabletRenderer) {
    super(renderer.getEpigraphicUnits(), renderer.getMarkupUnits());
    this.renderer = renderer;
  }

  markedUpEpigraphicReading(unit: EpigraphicUnit): string {
    const baseReading = super.markedUpEpigraphicReading(unit);
    if (unit.type === 'determinative') {
      return `<sup>${baseReading}</sup>`;
    }
    if (unit.type === 'phonogram' && unit.reading !== '...') {
      if (endsWithSuperscript(baseReading)) {
        const word = wordWithoutSuperscript(baseReading);
        return italicize(word) + baseReading.substring(word.length);
      }

      return italicize(baseReading);
    }
    return baseReading;
  }

  lineReading(lineNum: number) {
    if (this.renderer) {
      this.renderer[
        'markedUpEpigraphicReading' // eslint-disable-line dot-notation
      ] = this.markedUpEpigraphicReading;
      this.renderer['applySingleMarkup'] = this.applySingleMarkup; // eslint-disable-line
      return this.renderer.lineReading(lineNum);
    }
    throw new Error('Undefined renderer passed to render decorator');
  }

  applySingleMarkup(markup: MarkupUnit, reading: string): string {
    let formattedReading = reading;
    switch (markup.type) {
      case 'alternateSign':
      case 'isEmendedReading':
        formattedReading += '<sup>!</sup>';
        break;
      case 'uncertain':
        formattedReading += '<sup>?</sup>';
        break;
      default:
        return super.applySingleMarkup(markup, reading);
    }
    return formattedReading;
  }
}
