import {
  EpigraphicUnit,
  MarkupUnit,
  EpigraphicUnitSide,
  EpigraphicUnitWithMarkup,
} from '@oare/types';
import _ from 'lodash';

import {
  getMarkupByDamageType,
  unitMatchesDamageType,
  convertMarkedUpUnitsToLineReading,
  regionReading,
} from './tabletUtils';

export default class TabletRenderer {
  protected epigraphicUnits: EpigraphicUnit[] = [];

  protected markupUnits: MarkupUnit[] = [];

  public getEpigraphicUnits() {
    return this.epigraphicUnits;
  }

  public getMarkupUnits() {
    return this.markupUnits;
  }

  constructor(
    epigraphicUnits: EpigraphicUnit[],
    markupUnits: MarkupUnit[] = []
  ) {
    this.epigraphicUnits = epigraphicUnits;
    this.markupUnits = markupUnits;
    this.addLineNumbersToRegions();
    this.attachMarkupsToEpigraphicUnits();
  }

  private addLineNumbersToRegions() {
    this.epigraphicUnits = this.epigraphicUnits.reduce<EpigraphicUnit[]>(
      (newUnits, unit) => {
        if (unit.epigType === 'region') {
          const { objOnTablet } = unit;
          // Find line before this one
          const prevUnitIdx = _.findLastIndex(
            newUnits,
            backUnit =>
              backUnit.line !== null && backUnit.objOnTablet < objOnTablet
          );
          const objLine =
            prevUnitIdx === -1 ? 0.1 : newUnits[prevUnitIdx].line + 0.1;
          return [
            ...newUnits,
            {
              ...unit,
              line: objLine,
            },
          ];
        }

        return [...newUnits, unit];
      },
      []
    );
  }

  public tabletReading(): string {
    let reading: string = '';
    this.sides.forEach(side => {
      reading += `${side}\n`;
      reading += `${this.sideReading(side)}\n\n`;
    });
    return reading.trim();
  }

  get sides(): EpigraphicUnitSide[] {
    const orderedSides: EpigraphicUnitSide[] = [];
    this.epigraphicUnits.forEach(unit => {
      if (!orderedSides.includes(unit.side)) {
        orderedSides.push(unit.side);
      }
    });
    return orderedSides;
  }

  // An ordered list of lines on the tablet
  get lines(): number[] {
    const lineSet = this.epigraphicUnits.reduce(
      (curSet, unit) => curSet.add(unit.line),
      new Set<number>()
    );
    return Array.from(lineSet).sort((a, b) => a - b);
  }

  public sideReading(side: EpigraphicUnitSide): string {
    const lineReadings: string[] = [];
    this.linesOnSide(side).forEach(lineNum => {
      lineReadings.push(`${this.lineReading(lineNum)}`);
    });
    return lineReadings.join('\n');
  }

  /**
   * Return the epigraphic reading at a specific line number
   */
  public lineReading(lineNum: number): string {
    const unitsOnLine = this.getUnitsOnLine(lineNum);

    if (unitsOnLine.length === 1 && unitsOnLine[0].epigType === 'region') {
      return regionReading(unitsOnLine[0]);
    }

    const charactersWithMarkup = this.addMarkupToEpigraphicUnits(unitsOnLine);
    return convertMarkedUpUnitsToLineReading(charactersWithMarkup);
  }

  /**
   * Return an in order list of epigraphic units
   * on a given line.
   */
  private getUnitsOnLine(lineNum: number) {
    return this.epigraphicUnits
      .filter(item => item.line === lineNum)
      .sort((a, b) => a.objOnTablet - b.objOnTablet);
  }

  public linesOnSide(side: EpigraphicUnitSide): number[] {
    const unitsOnSide = this.epigraphicUnits
      .filter(unit => unit.side === side)
      .sort((a, b) => a.objOnTablet - b.objOnTablet);

    const lines: number[] = [];
    unitsOnSide.forEach(({ line }) => {
      if (!lines.includes(line)) {
        lines.push(line);
      }
    });
    return lines;
  }

  /**
   * Attach a list of markups to its corresponding
   * epigraphic unit.
   */
  private attachMarkupsToEpigraphicUnits() {
    const markupMap = this.getMarkupReferenceMap();
    this.epigraphicUnits = this.epigraphicUnits
      .sort((a, b) => a.objOnTablet - b.objOnTablet)
      .map(epigraphy => {
        const markedEpig: EpigraphicUnit = {
          ...epigraphy,
        };
        if (markupMap[epigraphy.uuid]) {
          // Sort so that damages are applied last
          markedEpig.markups = markupMap[epigraphy.uuid].sort((a, b) => {
            if (a.type === 'damage' || a.type === 'partialDamage') {
              return 1;
            }
            if (b.type === 'damage' || b.type === 'partialDamage') {
              return -1;
            }
            return 0;
          });
        }

        return markedEpig;
      });
  }

  /**
   * Maps an epigraphic unit's UUID to a list
   * of its markup units
   */
  private getMarkupReferenceMap(): Record<string, MarkupUnit[]> {
    const markupMap: { [key: string]: MarkupUnit[] } = {};
    this.markupUnits.forEach(markup => {
      if (!markupMap[markup.referenceUuid]) {
        markupMap[markup.referenceUuid] = [];
      }
      markupMap[markup.referenceUuid].push(markup);
    });

    return markupMap;
  }

  protected addMarkupToEpigraphicUnits(
    epigUnits: EpigraphicUnit[]
  ): EpigraphicUnitWithMarkup[] {
    return epigUnits.map(unit => ({
      type: unit.epigType === 'region' ? null : unit.type || 'phonogram',
      reading:
        unit.epigType === 'region'
          ? unit.reading || ''
          : this.markedUpEpigraphicReading(unit),
      discourseUuid: unit.discourseUuid,
    }));
  }

  /**
   * Take a single epigraphic unit and return it with
   * its markups applied
   */
  protected markedUpEpigraphicReading(unit: EpigraphicUnit): string {
    if (unit.markups) {
      let markedUpReading = unit.reading;
      unit.markups.forEach(markup => {
        markedUpReading = this.applySingleMarkup(markup, markedUpReading || '');
      });
      return markedUpReading || '';
    }
    return unit.reading || '';
  }

  protected applySingleMarkup(markup: MarkupUnit, reading: string): string {
    let formattedReading = reading;
    switch (markup.type) {
      case 'isCollatedReading':
        formattedReading = `*${formattedReading}*`;
        break;
      case 'alternateSign':
      case 'isEmendedReading': {
        formattedReading += '!';
        break;
      }
      case 'erasure':
        formattedReading = `{${formattedReading}}`;
        break;
      case 'isUninterpreted':
        formattedReading = `:${formattedReading}:`;
        break;
      case 'isWrittenWithinPrevSign':
        formattedReading = `×${formattedReading}`;
        break;
      case 'omitted':
        formattedReading = `‹${formattedReading}›`;
        break;
      case 'originalSign':
        formattedReading += '!';
        break;
      case 'superfluous':
        formattedReading = `«${formattedReading}»`;
        break;
      case 'uncertain': {
        formattedReading += '?';
        break;
      }
      case 'isWrittenAsLigature':
        formattedReading = `+${formattedReading}`;
        break;
      case 'undeterminedSigns':
        if (markup.value) {
          if (markup.value > 0) {
            formattedReading = 'x'.repeat(markup.value);
          } else if (markup.value === -1) {
            formattedReading = '...';
          }
        }
        break;
      case 'damage':
      case 'partialDamage':
        formattedReading = this.applyDamageMarkup(markup, reading);
        break;
      case 'isWrittenOverErasure':
        formattedReading = `#${formattedReading}`;
        break;
      default:
        break;
    }
    return formattedReading;
  }

  protected applyDamageMarkup(markup: MarkupUnit, reading: string): string {
    let formattedReading = this.addStartBracket(markup, reading);
    formattedReading = this.addEndBracket(markup, formattedReading);
    return formattedReading;
  }

  protected addStartBracket(markup: MarkupUnit, reading: string): string {
    const bracket = markup.type === 'damage' ? '[' : '⸢';

    let formattedReading = reading;
    if (markup.startChar === null) {
      if (this.shouldAddStartBracket(markup)) {
        formattedReading = bracket + formattedReading;
      }
    } else {
      formattedReading =
        formattedReading.slice(0, markup.startChar) +
        bracket +
        formattedReading.slice(markup.startChar);
    }
    return formattedReading;
  }

  protected addEndBracket(markup: MarkupUnit, reading: string): string {
    const bracket = markup.type === 'damage' ? ']' : '⸣';

    let formattedReading = reading;
    if (markup.endChar === null) {
      if (this.shouldAddEndBracket(markup)) {
        formattedReading += bracket;
      }
    } else {
      // Shift bracket over by 1 if a start character was added
      let { endChar } = markup;
      if (this.shouldAddStartBracket(markup)) {
        endChar += 1;
      }
      formattedReading =
        formattedReading.slice(0, endChar) +
        bracket +
        formattedReading.slice(endChar);
    }
    return formattedReading;
  }

  private shouldAddStartBracket(markup: MarkupUnit): boolean {
    return this.shouldAddBracket(markup, 'start');
  }

  private shouldAddEndBracket(markup: MarkupUnit): boolean {
    return this.shouldAddBracket(markup, 'end');
  }

  private shouldAddBracket(markup: MarkupUnit, startOrEnd: 'start' | 'end') {
    const unit = this.getEpigraphicUnitByUuid(markup.referenceUuid);

    if (!unit) {
      return false;
    }
    const [tabletDiff, neighborChar]: [number, 'endChar' | 'startChar'] =
      startOrEnd === 'start' ? [-1, 'endChar'] : [1, 'startChar'];

    const neighbor = this.epigraphicUnits.find(
      item => item.charOnTablet === unit.charOnTablet + tabletDiff
    );

    if (!neighbor || !neighbor.markups) {
      return true;
    }

    if (neighbor.line !== unit.line) {
      return true;
    }

    if (unitMatchesDamageType(neighbor, markup.type)) {
      const damageMarkup = getMarkupByDamageType(neighbor.markups, markup.type);
      if (damageMarkup && damageMarkup[neighborChar] !== null) {
        return true;
      }
      return false;
    }
    return true;
  }

  private getEpigraphicUnitByUuid(uuid: string) {
    return this.epigraphicUnits.find(unit => unit.uuid === uuid);
  }

  public getMarkupsByLineNumber(line: number): MarkupUnit[] {
    const epigUuids = this.epigraphicUnits
      .filter(unit => unit.line === line)
      .map(unit => unit.uuid);
    return this.markupUnits.filter(unit =>
      epigUuids.includes(unit.referenceUuid)
    );
  }

  public getEpigraphicUnitsByLine(line: number): EpigraphicUnit[] {
    return this.epigraphicUnits.filter(unit => unit.line === line);
  }
}
