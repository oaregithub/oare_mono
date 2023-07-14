import {
  EpigraphicUnit,
  EpigraphicUnitSide,
  MarkupType,
  TextFormatType,
  LocaleCode,
  TextMarkupRow,
} from '@oare/types';
import _ from 'lodash';
import {
  getMarkupByDamageType,
  unitMatchesDamageType,
  convertMarkedUpUnitsToLineReading,
  regionReading,
  undeterminedReading,
  romanNumeral,
  localizeString,
} from './tabletUtils';

export default class TabletRenderer {
  protected epigraphicUnits: EpigraphicUnit[] = [];

  protected locale: LocaleCode;

  protected rendererType: TextFormatType;

  public getEpigraphicUnits() {
    return this.epigraphicUnits;
  }

  public getLocale() {
    return this.locale;
  }

  public getRendererType() {
    return this.rendererType;
  }

  constructor(
    epigraphicUnits: EpigraphicUnit[],
    locale: LocaleCode,
    rendererType: TextFormatType
  ) {
    this.epigraphicUnits = epigraphicUnits;
    this.epigraphicUnits.sort((a, b) => a.objectOnTablet - b.objectOnTablet);
    this.locale = locale;
    this.rendererType = rendererType;
    this.sortMarkupUnits();
    this.addLineNumbersToRegions();
  }

  private sortMarkupUnits() {
    const damageTypes = ['damage', 'partialDamage', 'erasure'];

    this.epigraphicUnits = this.epigraphicUnits.map(unit => ({
      ...unit,
      markup: unit.markup.sort((a, b) => {
        if (a.type === 'isSealImpression') {
          return 1;
        }
        if (b.type === 'isSealImpression') {
          return -1;
        }
        if (damageTypes.includes(a.type)) {
          return 1;
        }
        if (damageTypes.includes(b.type)) {
          return -1;
        }
        return 0;
      }),
    }));
  }

  private addLineNumbersToRegions() {
    this.epigraphicUnits = this.epigraphicUnits.reduce<EpigraphicUnit[]>(
      (newUnits, unit) => {
        if (unit.type === 'region') {
          const { objectOnTablet } = unit;
          // Find line before this one
          const prevUnitIdx = _.findLastIndex(
            newUnits,
            backUnit =>
              backUnit.line !== null && backUnit.objectOnTablet < objectOnTablet
          );

          let objLine: number | null = null;

          if (prevUnitIdx === -1) {
            objLine = 0.1;
          } else if (newUnits[prevUnitIdx].line !== null) {
            objLine = newUnits[prevUnitIdx].line! + 0.1;
          }

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

  get sides(): EpigraphicUnit[] {
    return this.epigraphicUnits.filter(unit => unit.type === 'section');
  }

  get lines(): number[] {
    const orderedLines = this.epigraphicUnits
      .filter(unit => unit.line)
      .map(unit => unit.line!);

    return Array.from(new Set(orderedLines));
  }

  public getRegionUnitByLine(lineNum: number): EpigraphicUnit | null {
    if (this.isRegion(lineNum)) {
      const unitsOnLine = this.getUnitsOnLine(lineNum);
      return unitsOnLine[0];
    }

    return null;
  }

  public isRegion(lineNum: number): boolean {
    const unitsOnLine = this.getUnitsOnLine(lineNum);

    return unitsOnLine.length === 1 && unitsOnLine[0].type === 'region';
  }

  public isRegionType(lineNum: number, type: MarkupType): boolean {
    if (!this.isRegion(lineNum)) {
      return false;
    }

    const unitsOnLine = this.getUnitsOnLine(lineNum);
    return unitsOnLine[0].markup.some(unit => unit.type === type);
  }

  public isUndetermined(lineNum: number): boolean {
    const unitsOnLine = this.getUnitsOnLine(lineNum);

    return (
      unitsOnLine.length === 1 && unitsOnLine[0].type === 'undeterminedLines'
    );
  }

  public lineReading(lineNum: number): string {
    const unitsOnLine = this.getUnitsOnLine(lineNum);

    if (this.isRegion(lineNum)) {
      return regionReading(unitsOnLine[0]);
    }

    if (this.isUndetermined(lineNum)) {
      return undeterminedReading(unitsOnLine[0]);
    }

    const markedUpEpigraphicUnits = unitsOnLine.map(unit => ({
      ...unit,
      reading: this.markedUpEpigraphicReading(unit),
    }));

    const lineReading = convertMarkedUpUnitsToLineReading(
      markedUpEpigraphicUnits,
      this.rendererType === 'regular'
    );

    return localizeString(lineReading, this.locale);
  }

  public getLineWords(lineNum: number): EpigraphicUnit[][] {
    const unitsOnLine = this.getUnitsOnLine(lineNum).filter(
      unit => unit.type !== 'line'
    );

    const markedUpEpigraphicUnits = unitsOnLine.map(unit => ({
      ...unit,
      reading: this.markedUpEpigraphicReading(unit),
    }));

    const discourseUuids = Array.from(
      new Set(
        markedUpEpigraphicUnits
          .map(unit => unit.discourseUuid)
          .filter((discourseUuid): discourseUuid is string => !!discourseUuid)
      )
    );

    const unitsByWord = discourseUuids.map(uuid =>
      markedUpEpigraphicUnits.filter(unit => unit.discourseUuid === uuid)
    );

    return unitsByWord;
  }

  /**
   * Return an in order list of epigraphic units
   * on a given line.
   */
  public getUnitsOnLine(lineNum: number) {
    return this.epigraphicUnits.filter(item => item.line === lineNum);
  }

  public columnsOnSide(side: EpigraphicUnitSide): number[] {
    return this.epigraphicUnits
      .filter(unit => unit.type === 'column' && unit.sideReading === side)
      .map(unit => unit.column!);
  }

  public linesInColumn(column: number, side: EpigraphicUnitSide): number[] {
    const unitsInColumn = this.epigraphicUnits.filter(
      unit => unit.column === column && unit.sideReading === side
    );

    const lines: number[] = Array.from(
      new Set(unitsInColumn.filter(unit => unit.line).map(unit => unit.line!))
    );
    return lines;
  }

  /**
   * Take a single epigraphic unit and return it with
   * its markups applied
   */
  protected markedUpEpigraphicReading(unit: EpigraphicUnit): string {
    let markedUpReading = unit.reading;
    unit.markup.forEach(m => {
      markedUpReading = this.applySingleMarkup(m, markedUpReading || '');
    });
    return markedUpReading || '';
  }

  protected applySingleMarkup(markup: TextMarkupRow, reading: string): string {
    let formattedReading = reading;
    switch (markup.type) {
      case 'isCollatedReading':
        formattedReading += '!!';
        break;
      case 'isEmendedReading': {
        formattedReading += '!';
        break;
      }
      case 'uncertain': {
        formattedReading += '?';
        break;
      }
      case 'originalSign':
      case 'alternateSign':
        if (markup.altReading) {
          formattedReading += `(${markup.altReading})`;
        }
        break;
      case 'undeterminedSigns':
        if (markup.numValue) {
          if (markup.numValue > 0) {
            formattedReading = 'x'.repeat(markup.numValue);
          } else if (markup.numValue === -1) {
            formattedReading = '...';
          }
        }
        break;
      case 'damage':
      case 'partialDamage':
      case 'superfluous':
      case 'omitted':
      case 'erasure':
      case 'isUninterpreted':
      case 'isWrittenOverErasure':
      case 'phoneticComplement':
      case 'isWrittenBelowTheLine':
      case 'isWrittenAboveTheLine':
        formattedReading = this.applyBracketMarkup(markup, reading);
        break;
      default:
        break;
    }
    return formattedReading;
  }

  private getStartBracket(markupType: MarkupType): string {
    switch (markupType) {
      case 'damage':
        return '[';
      case 'partialDamage':
        return '⸢';
      case 'superfluous':
        return '«';
      case 'omitted':
        return '‹';
      case 'erasure':
        return '{';
      case 'isUninterpreted':
        return ':';
      case 'isWrittenOverErasure':
        return '*';
      case 'phoneticComplement':
        return ';';
      case 'isWrittenBelowTheLine':
        return '/';
      case 'isWrittenAboveTheLine':
        return '\\';
      default:
        return '';
    }
  }

  private getEndBracket(markupType: MarkupType): string {
    switch (markupType) {
      case 'damage':
        return ']';
      case 'partialDamage':
        return '⸣';
      case 'superfluous':
        return '»';
      case 'omitted':
        return '›';
      case 'erasure':
        return '}';
      case 'isUninterpreted':
        return ':';
      case 'isWrittenOverErasure':
        return '*';
      case 'phoneticComplement':
        return ';';
      case 'isWrittenBelowTheLine':
        return '';
      case 'isWrittenAboveTheLine':
        return '';
      default:
        return '';
    }
  }

  protected applyBracketMarkup(markup: TextMarkupRow, reading: string): string {
    let formattedReading = this.addStartBracket(markup, reading);
    formattedReading = this.addEndBracket(markup, formattedReading);
    return formattedReading;
  }

  protected addStartBracket(markup: TextMarkupRow, reading: string): string {
    const bracket = this.getStartBracket(markup.type);

    let formattedReading = reading;
    if (markup.startChar === null) {
      if (this.shouldAddStartBracket(markup)) {
        formattedReading = bracket + formattedReading;
      }
    } else {
      let { startChar } = markup;

      const originalStartChar = startChar;
      let charCounter = 0;
      for (let i = 0; i < formattedReading.length; i += 1) {
        if (charCounter === originalStartChar) {
          break;
        } else if (
          formattedReading[i].match(
            /([[\]{}⸢⸣«»‹›:;*?\\!])|(".+")|('.+')|(^\/)+/g
          )
        ) {
          startChar += 1;
        } else {
          charCounter += 1;
        }
      }
      formattedReading =
        formattedReading.slice(0, startChar) +
        bracket +
        formattedReading.slice(startChar);
    }
    return formattedReading;
  }

  protected addEndBracket(markup: TextMarkupRow, reading: string): string {
    const bracket = this.getEndBracket(markup.type);

    let formattedReading = reading;
    if (markup.endChar === null) {
      if (this.shouldAddEndBracket(markup)) {
        formattedReading += bracket;
      }
    } else {
      // Shift bracket over by 1 if a start character was added
      let { endChar } = markup;

      const originalEndChar = endChar;
      let charCounter = 0;
      for (let i = 0; i < formattedReading.length; i += 1) {
        if (charCounter === originalEndChar) {
          break;
        } else if (
          formattedReading[i].match(
            /([[\]{}⸢⸣«»‹›:;*?\\!])|(".+")|('.+')|(^\/)+/g
          )
        ) {
          endChar += 1;
        } else {
          charCounter += 1;
        }
      }

      formattedReading =
        formattedReading.slice(0, endChar) +
        bracket +
        formattedReading.slice(endChar);
    }
    return formattedReading;
  }

  private shouldAddStartBracket(markup: TextMarkupRow): boolean {
    return this.shouldAddBracket(markup, 'start');
  }

  private shouldAddEndBracket(markup: TextMarkupRow): boolean {
    return this.shouldAddBracket(markup, 'end');
  }

  private shouldAddBracket(markup: TextMarkupRow, startOrEnd: 'start' | 'end') {
    const unit = this.getEpigraphicUnitByUuid(markup.referenceUuid);

    if (!unit) {
      return false;
    }

    const [tabletDiff, neighborChar]: [number, 'endChar' | 'startChar'] =
      startOrEnd === 'start' ? [-1, 'endChar'] : [1, 'startChar'];

    const neighbor = this.epigraphicUnits.find(
      item =>
        unit.charOnTablet &&
        item.charOnTablet === unit.charOnTablet + tabletDiff
    );

    if (!neighbor || neighbor.markup.length === 0) {
      return true;
    }

    if (neighbor.line !== unit.line) {
      return true;
    }

    if (unitMatchesDamageType(neighbor, markup.type)) {
      const damageMarkup = getMarkupByDamageType(neighbor.markup, markup.type);
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

  public getEpigraphicUnitsByLine(line: number): EpigraphicUnit[] {
    return this.epigraphicUnits.filter(unit => unit.line === line);
  }

  public getTransliterationString(): string {
    let transliterationString = '';

    this.sides.forEach(side => {
      if (transliterationString === '') {
        transliterationString = `${side.side!}\n`;
      } else {
        transliterationString = `${transliterationString}\n${side.side!}\n`;
      }

      const columns = this.columnsOnSide(side.sideReading!);

      columns.forEach(column => {
        if (columns.length > 1) {
          transliterationString = `${transliterationString}col. ${romanNumeral(
            column
          )}\n`;
        }

        const lines = this.linesInColumn(column, side.sideReading!);

        lines.forEach(line => {
          const lineReading = this.lineReading(line);
          transliterationString = `${transliterationString}${lineReading}\n`;
        });
      });
    });

    return localizeString(transliterationString, this.locale);
  }
}
