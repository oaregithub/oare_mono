/* eslint-disable max-classes-per-file */

export type DiscourseUnitType = 'discourseUnit' |
  'sentence' | 'phrase' | 'number' | 'word' | 'paragraph' |
  'clause' | 'heading' | 'stitch' | 'morpheme' | null;

export interface DiscourseUnit {
  uuid: string;
  type: DiscourseUnitType;
  units: DiscourseUnit[];
  spelling?: string;
  transcription?: string;
  line?: number;
  wordOnTablet?: number;
  paragraphLabel?: string;
  translation?: string;
}

function getLineNums(units: DiscourseUnit[]): number[] {
  const lines: Set<number> = new Set();
  units.forEach((unit) => {
    if (unit.line) {
      lines.add(unit.line);
    }
    const childrenLines = getLineNums(unit.units);
    childrenLines.forEach((line) => lines.add(line));
  });
  return Array.from(lines).sort((a, b) => a - b);
}

interface TranscriptionRenderFunc {
  (word: string): string
}
export function lineReadingHelper(units: DiscourseUnit[], line: number, words: string[],
  trRenderer: TranscriptionRenderFunc = (word) => word) {
  units.forEach((unit) => {
    if (unit.line === line) {
      if (unit.transcription) {
        words.push(trRenderer(unit.transcription));
      } else if (unit.spelling) {
        words.push(unit.spelling);
      }
    }
    lineReadingHelper(unit.units, line, words, trRenderer);
  });
}

function getRenderersHelper(units: DiscourseUnit[],
  renderers: DiscourseRenderer[],
  type: DiscourseUnitType,
  renderClass: typeof DiscourseRenderer) {  // eslint-disable-line
  units.forEach((unit) => {
    if (unit.type === 'paragraph') {
      renderers.push(new renderClass(unit.units)); //eslint-disable-line
    } else {
      getRenderersHelper(unit.units, renderers, type, renderClass);
    }
  });
}

export default class DiscourseRenderer {
  protected discourseUnits: DiscourseUnit[];

  protected renderClass: typeof DiscourseRenderer;

  constructor(discourseUnits: DiscourseUnit[]) {
    this.discourseUnits = discourseUnits;
    this.renderClass = DiscourseRenderer;
  }

  get lines(): number[] {
    return getLineNums(this.discourseUnits);
  }

  get paragraphRenderers(): DiscourseRenderer[] {
    const renderers: DiscourseRenderer[] = [];
    getRenderersHelper(this.discourseUnits, renderers, 'paragraph', this.renderClass);
    return renderers;
  }

  get sentenceRenderers(): DiscourseRenderer[] {
    const renderers: DiscourseRenderer[] = [];
    getRenderersHelper(this.discourseUnits, renderers, 'sentence', this.renderClass);
    return renderers;
  }

  public lineReading(line: number): string {
    const words: string[] = [];
    lineReadingHelper(this.discourseUnits, line, words);
    return words.join(' ');
  }
}
