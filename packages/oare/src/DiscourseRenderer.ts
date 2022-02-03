/* eslint-disable max-classes-per-file */

import { DiscourseUnit, DiscourseUnitType } from '@oare/types';

function getRenderersHelper(
  units: DiscourseUnit[],
  renderers: DiscourseRenderer[],
  type: DiscourseUnitType,
  RenderClass: typeof DiscourseRenderer
) {
  units.forEach(unit => {
    if (unit.type === 'paragraph') {
      renderers.push(new RenderClass(unit.units));
    } else {
      getRenderersHelper(unit.units, renderers, type, RenderClass);
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
    getRenderersHelper(
      this.discourseUnits,
      renderers,
      'paragraph',
      this.renderClass
    );
    return renderers;
  }

  get sentenceRenderers(): DiscourseRenderer[] {
    const renderers: DiscourseRenderer[] = [];
    getRenderersHelper(
      this.discourseUnits,
      renderers,
      'sentence',
      this.renderClass
    );
    return renderers;
  }

  public lineReading(line: number): string {
    const words: string[] = [];
    lineReadingHelper(this.discourseUnits, line, words);
    return words.join(' ');
  }
}

function getLineNums(units: DiscourseUnit[]): number[] {
  const lines: Set<number> = new Set();
  units.forEach(unit => {
    if (unit.line) {
      lines.add(unit.line);
    }
    const childrenLines = getLineNums(unit.units);
    childrenLines.forEach(line => lines.add(line));
  });
  return Array.from(lines);
}

interface TranscriptionRenderFunc {
  (word: string): string;
}
export function lineReadingHelper(
  units: DiscourseUnit[],
  line: number,
  words: string[],
  trRenderer: TranscriptionRenderFunc = word => word
) {
  units.forEach(unit => {
    if (unit.line === line) {
      if (unit.transcription) {
        words.push(trRenderer(unit.transcription));
      } else if (unit.explicitSpelling) {
        words.push(unit.explicitSpelling);
      }
    }
    lineReadingHelper(unit.units, line, words, trRenderer);
  });
}
