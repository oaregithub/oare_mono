/* eslint-disable dot-notation */
import { EpigraphicUnit, MarkupUnit, TabletHtmlOptions } from '@oare/types';
import TabletRenderer from './TabletRenderer';

const superscriptRegex = /<sup>.*<\/sup>/;

export function containsSuperscript(markedupUnit: string): boolean {
  return !!markedupUnit.match(superscriptRegex);
}

function isMarkupChar(char: string): boolean {
  return [
    '%',
    '{',
    '}',
    ':',
    '‹',
    '›',
    '«',
    '»',
    '+',
    'x',
    '⸢',
    '⸣',
    '[',
    ']',
    '!',
    '?',
    '(',
    ')',
  ].includes(char);
}

function italicize(word: string) {
  let reading: string = '';
  word.split('').forEach(char => {
    if (isMarkupChar(char)) {
      reading += char;
    } else {
      reading += `<em>${char}</em>`;
    }
  });
  return reading;
}

export function wordPiecesWithoutSuperscript(word: string): string[] {
  return word.split(superscriptRegex);
}

export function wordPiecesWithSuperscript(word: string): string[] {
  return word.match(/<sup>.*<\/sup>/g) || [];
}
/**
 * Renders epigraphic readings for display in a webpage
 */
export default class TabletHtmlRenderer extends TabletRenderer {
  private renderer: TabletRenderer | null = null;

  private showNullDiscourse: boolean;

  private highlightDiscourses: string[];

  constructor(
    renderer: TabletRenderer,
    { showNullDiscourse, highlightDiscourses }: TabletHtmlOptions = {}
  ) {
    super(renderer.getEpigraphicUnits());
    this.renderer = renderer;
    this.showNullDiscourse = showNullDiscourse || false;
    this.highlightDiscourses = highlightDiscourses || [];
  }

  markedUpEpigraphicReading(unit: EpigraphicUnit): string {
    let baseReading = super.markedUpEpigraphicReading(unit);
    if (unit.type === 'determinative') {
      baseReading = `<sup>${baseReading}</sup>`;
    }
    if (unit.type === 'phonogram' && unit.reading !== '...') {
      if (containsSuperscript(baseReading)) {
        const basePieces = wordPiecesWithoutSuperscript(baseReading);
        const superscriptPieces = wordPiecesWithSuperscript(baseReading);

        let newReading = '';

        basePieces.forEach((piece, idx) => {
          const followingSuperscript = superscriptPieces[idx] || '';
          newReading = newReading + italicize(piece) + followingSuperscript;
        });
        baseReading = newReading;
      } else {
        baseReading = italicize(baseReading);
      }
    }

    if (
      this.showNullDiscourse &&
      unit.discourseUuid === null &&
      unit.reading !== '|'
    ) {
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
      case 'isCollatedReading':
        formattedReading += '<sup>!!</sup>';
        break;
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
