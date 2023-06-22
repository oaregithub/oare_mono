/* eslint-disable max-classes-per-file */

import {
  TextDiscourseUnit,
  DiscourseDisplayUnit,
  LocaleCode,
  DiscourseUnitType,
} from '@oare/types';
import { localizeString } from './tabletUtils';

export default class DiscourseRenderer {
  protected discourseUnits: TextDiscourseUnit[];

  protected locale: LocaleCode;

  protected renderClass: typeof DiscourseRenderer;

  constructor(discourseUnits: TextDiscourseUnit[], locale: LocaleCode) {
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

function getSides(units: TextDiscourseUnit[]): number[] {
  const sides: Set<number> = new Set();
  units.forEach(unit => {
    if (unit.epigraphy.side) {
      sides.add(unit.epigraphy.side);
    }
    const childrenSides = getSides(unit.children);
    childrenSides.forEach(side => sides.add(side));
  });
  return Array.from(sides);
}

function getSideLines(side: number, units: TextDiscourseUnit[]): number[] {
  const lines: Set<number> = new Set();
  units.forEach(unit => {
    if (unit.epigraphy.line && unit.epigraphy.side === side) {
      lines.add(unit.epigraphy.line);
    }
    const childrenLines = getSideLines(side, unit.children);
    childrenLines.forEach(line => lines.add(line));
  });
  return Array.from(lines);
}

function getLineTypes(
  line: number,
  units: TextDiscourseUnit[]
): DiscourseUnitType[] {
  const types: Set<DiscourseUnitType> = new Set();
  units.forEach(unit => {
    if (unit.epigraphy.line === line) {
      types.add(unit.type);
    }
    const childrenTypes = getLineTypes(line, unit.children);
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
  units: TextDiscourseUnit[],
  line: number,
  words: DiscourseDisplayUnit[],
  renderFormatter: RenderFormat = {
    transliteration: word => word,
    spelling: word => word,
  }
) {
  units.forEach(unit => {
    if (unit.epigraphy.line === line) {
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
    displayUnitHelper(unit.children, line, words, renderFormatter);
  });
}

export function lineReadingHelperForWordsInTexts(
  units: TextDiscourseUnit[],
  discourseUuids: string[],
  line: number,
  words: string[],
  renderFormatter: RenderFormat = {
    transliteration: word => word,
    spelling: word => word,
  }
) {
  units.forEach(unit => {
    if (unit.epigraphy.line === line) {
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
      unit.children,
      discourseUuids,
      line,
      words,
      renderFormatter
    );
  });
}
