/* eslint-disable max-classes-per-file */

import {
  DiscourseUnit,
  DiscourseDisplayUnit,
  LocaleCode,
  DiscourseUnitType,
} from '@oare/types';
import { localizeString } from './tabletUtils';

export default class DiscourseRenderer {
  protected discourseUnits: DiscourseUnit[];

  protected locale: LocaleCode;

  protected renderClass: typeof DiscourseRenderer;

  constructor(discourseUnits: DiscourseUnit[], locale: LocaleCode) {
    this.discourseUnits = discourseUnits;
    this.discourseUnits.sort((a, b) => a.objInText - b.objInText);
    this.locale = locale;
    this.renderClass = DiscourseRenderer;
  }

  get sides(): number[] {
    return getSides(this.discourseUnits);
  }

  public linesOnSide(side: number): number[] {
    return getSideLines(side, this.discourseUnits);
  }

  public wordsOnLine(line: number): DiscourseDisplayUnit[] {
    const words: DiscourseDisplayUnit[] = [];
    displayUnitHelper(this.discourseUnits, line, words);
    return words.map(word => ({
      ...word,
      display: localizeString(word.display, this.locale),
    }));
  }

  public lineReading(line: number): string {
    const words: DiscourseDisplayUnit[] = [];
    displayUnitHelper(this.discourseUnits, line, words);
    return words
      .map(word => localizeString(word.display, this.locale))
      .join(' ');
  }

  public isRegion(lineNum: number): boolean {
    const types = getLineTypes(lineNum, this.discourseUnits);
    return types.includes('region');
  }
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

function getLineTypes(
  line: number,
  units: DiscourseUnit[]
): DiscourseUnitType[] {
  const types: Set<DiscourseUnitType> = new Set();
  units.forEach(unit => {
    if (unit.line === line) {
      types.add(unit.type);
    }
    const childrenTypes = getLineTypes(line, unit.units);
    childrenTypes.forEach(type => types.add(type));
  });
  return Array.from(types);
}

interface RenderFunc {
  (word: string): string;
}
interface RenderFormat {
  transliteration: RenderFunc;
  spelling: RenderFunc;
}
export function displayUnitHelper(
  units: DiscourseUnit[],
  line: number,
  words: DiscourseDisplayUnit[],
  renderFormatter: RenderFormat = {
    transliteration: word => word,
    spelling: word => word,
  }
) {
  units.forEach(unit => {
    if (unit.line === line) {
      if (unit.transcription) {
        words.push({
          uuid: unit.uuid,
          type: unit.type,
          display: renderFormatter.transliteration(unit.transcription),
        });
      } else if (unit.explicitSpelling) {
        words.push({
          uuid: unit.uuid,
          type: unit.type,
          display: renderFormatter.spelling(unit.explicitSpelling),
        });
      }
    }
    displayUnitHelper(unit.units, line, words, renderFormatter);
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
