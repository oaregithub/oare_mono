import {
  EpigraphicUnit,
  MarkupUnit,
  EpigraphicUnitSide,
  EpigraphicUnitWithMarkup,
  EpigraphicWord,
  MarkupType,
  TextFormatType,
  LocaleCode,
} from '@oare/types';
import _ from 'lodash';

import {
  getMarkupByDamageType,
  unitMatchesDamageType,
  convertMarkedUpUnitsToLineReading,
  convertMarkedUpUnitsToEpigraphicWords,
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
    this.epigraphicUnits.sort((a, b) => a.objOnTablet - b.objOnTablet);
    this.locale = locale;
    this.rendererType = rendererType;
    this.sortMarkupUnits();
    this.addLineNumbersToRegions();
  }

  private sortMarkupUnits() {
    const damageTypes = ['damage', 'partialDamage', 'erasure'];
    this.epigraphicUnits = this.epigraphicUnits.map(unit => ({
      ...unit,
      markups: unit.markups.sort((a, b) => {
        // Sort isSealImpression to the top. It's the only region
        // type that can have multiple markups

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
        if (unit.epigType === 'region') {
          const { objOnTablet } = unit;
          // Find line before this one
          const prevUnitIdx = _.findLastIndex(
            newUnits,
            backUnit =>
              backUnit.line !== null && backUnit.objOnTablet < objOnTablet
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

  public tabletReading(): string {
    const tabletReading = this.sides
      .map(side => `${side.side!}\n${this.sideReading(side.side!)}`)
      .join('\n')
      .trim();
    return localizeString(tabletReading, this.locale);
  }

  get sides(): EpigraphicUnit[] {
    return this.epigraphicUnits.filter(unit => unit.epigType === 'section');
  }

  // An ordered list of lines on the tablet
  get lines(): number[] {
    const orderedLines = this.epigraphicUnits
      .filter(unit => unit.line)
      .map(unit => unit.line!);

    return Array.from(new Set(orderedLines));
  }

  public sideReading(side: EpigraphicUnitSide): string {
    const lineReadings: string[] = [];
    const columns = this.columnsOnSide(side);
    columns.forEach(column => {
      this.linesInColumn(column, side).forEach(lineNum => {
        lineReadings.push(`${this.lineReading(lineNum)}`);
      });
    });
    const sideReading = lineReadings.join('\n');
    return localizeString(sideReading, this.locale);
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
    return unitsOnLine.length === 1 && unitsOnLine[0].epigType === 'region';
  }

  public isUndetermined(lineNum: number): boolean {
    const unitsOnLine = this.getUnitsOnLine(lineNum);
    return (
      unitsOnLine.length === 1 &&
      unitsOnLine[0].epigType === 'undeterminedLines'
    );
  }

  /**
   * Return the epigraphic reading at a specific line number
   */
  public lineReading(lineNum: number): string {
    const unitsOnLine = this.getUnitsOnLine(lineNum);

    if (this.isRegion(lineNum)) {
      return regionReading(unitsOnLine[0]);
    }

    if (this.isUndetermined(lineNum)) {
      return undeterminedReading(unitsOnLine[0]);
    }

    const charactersWithMarkup = this.addMarkupToEpigraphicUnits(unitsOnLine);
    const lineReading = convertMarkedUpUnitsToLineReading(
      charactersWithMarkup,
      this.rendererType === 'regular'
    );
    return localizeString(lineReading, this.locale);
  }

  public getLineWords(lineNum: number): EpigraphicWord[] {
    const unitsOnLine = this.getUnitsOnLine(lineNum).filter(
      unit => unit.epigType !== 'line'
    );
    const charactersWithMarkup = this.addMarkupToEpigraphicUnits(unitsOnLine);
    const epigraphicWords = convertMarkedUpUnitsToEpigraphicWords(
      charactersWithMarkup
    );
    return epigraphicWords.map(word => ({
      ...word,
      reading: word.reading ? localizeString(word.reading, this.locale) : null,
      signs: [
        ...word.signs.map(sign => ({
          ...sign,
          reading: sign.reading
            ? localizeString(sign.reading, this.locale)
            : null,
        })),
      ],
    }));
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
      .filter(unit => unit.epigType === 'column' && unit.side === side)
      .map(unit => unit.column!);
  }

  public linesInColumn(column: number, side: EpigraphicUnitSide): number[] {
    const unitsInColumn = this.epigraphicUnits.filter(
      unit => unit.column === column && unit.side === side
    );

    const lines: number[] = Array.from(
      new Set(unitsInColumn.filter(unit => unit.line).map(unit => unit.line!))
    );
    return lines;
  }

  protected addMarkupToEpigraphicUnits(
    epigUnits: EpigraphicUnit[]
  ): EpigraphicUnitWithMarkup[] {
    return epigUnits.map(unit => ({
      uuid: unit.uuid,
      type: unit.epigType === 'region' ? null : unit.type || 'phonogram',
      epigType: unit.epigType,
      reading:
        unit.epigType === 'region'
          ? unit.reading || ''
          : this.markedUpEpigraphicReading(unit),
      discourseUuid: unit.discourseUuid,
      readingUuid: unit.readingUuid,
      signUuid: unit.signUuid,
      markups: unit.markups,
      spellingUuid: unit.spellingUuid,
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

  protected applyBracketMarkup(markup: MarkupUnit, reading: string): string {
    let formattedReading = this.addStartBracket(markup, reading);
    formattedReading = this.addEndBracket(markup, formattedReading);
    return formattedReading;
  }

  protected addStartBracket(markup: MarkupUnit, reading: string): string {
    const bracket = this.getStartBracket(markup.type);

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
    const bracket = this.getEndBracket(markup.type);

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
      item =>
        unit.charOnTablet &&
        item.charOnTablet === unit.charOnTablet + tabletDiff
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

      const columns = this.columnsOnSide(side.side!);

      columns.forEach(column => {
        if (columns.length > 1) {
          transliterationString = `${transliterationString}col. ${romanNumeral(
            column
          )}\n`;
        }

        const lines = this.linesInColumn(column, side.side!);

        lines.forEach(line => {
          const lineReading = this.lineReading(line);
          transliterationString = `${transliterationString}${lineReading}\n`;
        });
      });
    });

    return localizeString(transliterationString, this.locale);
  }
}
