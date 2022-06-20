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

  get sides(): number[] {
    return getSides(this.discourseUnits);
  }

  public linesOnSide(side: number): number[] {
    return getSideLines(side, this.discourseUnits);
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

function getSides(units: DiscourseUnit[]): number[] {
  const sides: Set<number> = new Set();
  units.forEach(unit => {
    if (unit.side) {
      sides.add(unit.side);
    }
    const childrenSides = getSides(unit.units);
    childrenSides.forEach(side => sides.add(side));
  });
  return Array.from(sides);
}

function getSideLines(side: number, units: DiscourseUnit[]): number[] {
  const lines: Set<number> = new Set();
  units.forEach(unit => {
    if (unit.line && unit.side === side) {
      lines.add(unit.line);
    }
    const childrenLines = getSideLines(side, unit.units);
    childrenLines.forEach(line => lines.add(line));
  });
  return Array.from(lines);
}

interface RenderFunc {
  (word: string): string;
}
interface RenderFormat {
  transliteration: RenderFunc;
  spelling: RenderFunc;
}
export function lineReadingHelper(
  units: DiscourseUnit[],
  line: number,
  words: string[],
  renderFormatter: RenderFormat = {
    transliteration: word => word,
    spelling: word => word,
  }
) {
  units.forEach(unit => {
    if (unit.line === line) {
      if (unit.transcription) {
        words.push(renderFormatter.transliteration(unit.transcription));
      } else if (unit.explicitSpelling) {
        words.push(renderFormatter.spelling(unit.explicitSpelling));
      }
    }
    lineReadingHelper(unit.units, line, words, renderFormatter);
  });
}

export function lineReadingHelperForWordsInTexts(
  units: DiscourseUnit[],
  discourseUuids: string[],
  line: number,
  words: string[],
  renderFormatter: RenderFormat = {
    transliteration: word => word,
    spelling: word => word,
  }
) {
  units.forEach(unit => {
    if (unit.line === line) {
      if (unit.transcription) {
        words.push(
          renderFormatter.transliteration(
            discourseUuids.includes(unit.uuid)
              ? `<mark>${unit.transcription}</mark>`
              : unit.transcription
          )
        );
      } else if (unit.explicitSpelling) {
        words.push(
          renderFormatter.spelling(
            discourseUuids.includes(unit.uuid)
              ? `<mark>${unit.explicitSpelling}</mark>`
              : unit.explicitSpelling
          )
        );
      }
    }
    lineReadingHelperForWordsInTexts(
      unit.units,
      discourseUuids,
      line,
      words,
      renderFormatter
    );
  });
}
