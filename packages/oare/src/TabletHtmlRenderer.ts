/* eslint-disable dot-notation */
import TabletRenderer from './TabletRenderer';
import { EpigraphicUnit, MarkupUnit, TabletHtmlOptions } from './index';

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

  private admin: boolean;

  private highlightDiscourses: string[];

  constructor(
    renderer: TabletRenderer,
    { admin, highlightDiscourses }: TabletHtmlOptions = {},
  ) {
    super(renderer.getEpigraphicUnits(), renderer.getMarkupUnits());
    this.renderer = renderer;
    this.admin = admin || false;
    this.highlightDiscourses = highlightDiscourses || [];
  }

  markedUpEpigraphicReading(unit: EpigraphicUnit): string {
    let baseReading = super.markedUpEpigraphicReading(unit);
    if (unit.type === 'determinative') {
      baseReading = `<sup>${baseReading}</sup>`;
    }
    if (unit.type === 'phonogram' && unit.reading !== '...') {
      if (endsWithSuperscript(baseReading)) {
        const word = wordWithoutSuperscript(baseReading);
        baseReading = italicize(word) + baseReading.substring(word.length);
      } else {
        baseReading = italicize(baseReading);
      }
    }

    if (this.admin && unit.discourseUuid === null && unit.reading !== '|') {
      baseReading = `<mark style="background-color: #ffb3b3">${baseReading}</mark>`;
    } else if (this.highlightDiscourses.includes(unit.discourseUuid || '')) {
      baseReading = `<mark>${baseReading}</mark>`;
    }
    return baseReading;
  }

  lineReading(lineNum: number) {
    if (this.renderer) {
      this.renderer[
        'markedUpEpigraphicReading'
      ] = this.markedUpEpigraphicReading;
      this.renderer['applySingleMarkup'] = this.applySingleMarkup;

      // Intermediate steps are being overridden. We need to supply
      // the renderer with HtmlRenderer's this object
      return this.renderer.lineReading.call(this, lineNum);
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
