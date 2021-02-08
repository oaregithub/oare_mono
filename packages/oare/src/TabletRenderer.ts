import {
  EpigraphicUnit,
  MarkupUnit,
  EpigraphicUnitSide,
  EpigraphicUnitWithMarkup,
} from '@oare/types';

import {
  getMarkupByDamageType,
  unitMatchesDamageType,
  convertMarkedUpUnitsToLineReading,
} from './tabletUtils';

const a = 3;

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
    markupUnits: MarkupUnit[] = [],
  ) {
    this.epigraphicUnits = epigraphicUnits;
    this.markupUnits = markupUnits;
    this.attachMarkupsToEpigraphicUnits();
  }

  public tabletReading(): string {
    let reading: string = '';
    this.sides.forEach((side) => {
      reading += `${side}\n`;
      reading += `${this.sideReading(side)}\n\n`;
    });
    return reading.trim();
  }

  get sides(): EpigraphicUnitSide[] {
    const orderedSides: EpigraphicUnitSide[] = [];
    this.epigraphicUnits.forEach((unit) => {
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
      new Set<number>(),
    );
    return Array.from(lineSet).sort((a, b) => a - b);
  }

  public sideReading(side: EpigraphicUnitSide): string {
    const lineReadings: string[] = [];
    this.linesOnSide(side).forEach((lineNum) => {
      lineReadings.push(`${this.lineReading(lineNum)}`);
    });
    return lineReadings.join('\n');
  }

  /**
   * Return the epigraphic reading at a specific line number
   */
  public lineReading(lineNum: number) {
    const unitsOnLine = this.getUnitsOnLine(lineNum);
    const charactersWithMarkup = this.addMarkupToEpigraphicUnits(unitsOnLine);
    return convertMarkedUpUnitsToLineReading(charactersWithMarkup);
  }

  /**
   * Return an in order list of epigraphic units
   * on a given line.
   */
  private getUnitsOnLine(lineNum: number) {
    return this.epigraphicUnits
      .filter((item) => item.line === lineNum)
      .sort((a, b) => a.charOnTablet - b.charOnTablet);
  }

  public linesOnSide(side: EpigraphicUnitSide): number[] {
    const unitsOnSide = this.epigraphicUnits
      .filter((unit) => unit.side === side)
      .sort((a, b) => a.charOnTablet - b.charOnTablet);

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
      .sort((a, b) => a.charOnTablet - b.charOnTablet)
      .map((epigraphy) => {
        const markedEpig: EpigraphicUnit = {
          ...epigraphy,
        };
        if (markupMap[epigraphy.uuid]) {
          markedEpig.markups = markupMap[epigraphy.uuid];
        }

        return markedEpig;
      });
  }

  /**
   * Maps an epigraphic unit's UUID to a list
   * of its markup units
   */
  private getMarkupReferenceMap() {
    const markupMap: { [key: string]: MarkupUnit[] } = {};
    this.markupUnits.forEach((markup) => {
      if (!markupMap[markup.referenceUuid]) {
        markupMap[markup.referenceUuid] = [];
      }
      markupMap[markup.referenceUuid].push(markup);
    });
    return markupMap;
  }

  protected addMarkupToEpigraphicUnits(
    epigUnits: EpigraphicUnit[],
  ): EpigraphicUnitWithMarkup[] {
    return epigUnits.map((unit) => ({
      type: unit.type || 'phonogram',
      reading: this.markedUpEpigraphicReading(unit),
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
      unit.markups.forEach((markup) => {
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
        formattedReading = this.applyDamageMarkup(markup, formattedReading);
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
    const bracket =
      markup.type === 'damage' || markup.type === 'undeterminedSigns'
        ? '['
        : '⸢';

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
    const bracket =
      markup.type === 'damage' || markup.type === 'undeterminedSigns'
        ? ']'
        : '⸣';

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
      (item) => item.charOnTablet === unit.charOnTablet + tabletDiff,
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
    return this.epigraphicUnits.find((unit) => unit.uuid === uuid);
  }

  public getMarkupsByLineNumber(line: number): MarkupUnit[] {
    const epigUuids = this.epigraphicUnits
      .filter((unit) => unit.line === line)
      .map((unit) => unit.uuid);
    return this.markupUnits.filter((unit) =>
      epigUuids.includes(unit.referenceUuid),
    );
  }

  public getEpigraphicUnitsByLine(line: number): EpigraphicUnit[] {
    return this.epigraphicUnits.filter((unit) => unit.line === line);
  }
}
