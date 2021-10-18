import {
  CreateTextTables,
  EpigraphicUnit,
  EpigraphicUnitSide,
  AddTextInfo,
  AddTextEditorContent,
  TextEpigraphyRow,
  TextMarkupRow,
  SignInfo,
  TextRow,
  TextEpigraphyRowPartial,
  TextMarkupRowPartial,
  MarkupType,
} from '@oare/types';
import { v4 } from 'uuid';

export const getSideNumber = (number: number | null): EpigraphicUnitSide => {
  switch (number) {
    case 1:
      return 'obv.';
    case 2:
      return 'lo.e.';
    case 3:
      return 'rev.';
    case 4:
      return 'u.e.';
    case 5:
      return 'le.e.';
    default:
      return 'r.e.';
  }
};

export const convertTablesToUnits = (
  tables: CreateTextTables
): EpigraphicUnit[] => {
  let { markups } = tables;

  const refTypes: { [key: string]: Set<string> } = {};
  markups = markups.filter(markup => {
    if (refTypes[markup.referenceUuid]) {
      if (refTypes[markup.referenceUuid].has(markup.type)) {
        return false;
      }
    } else {
      refTypes[markup.referenceUuid] = new Set();
    }

    refTypes[markup.referenceUuid].add(markup.type);
    return true;
  });
  markups.sort(a => {
    if (a.type === 'damage' || a.type === 'partialDamage') {
      return -1;
    }
    return 0;
  });

  const markupUnits = markups.map(markup => ({
    referenceUuid: markup.referenceUuid,
    type: markup.type,
    value: markup.numValue,
    startChar: markup.startChar,
    endChar: markup.endChar,
  }));

  const relevantEpigraphyRows = tables.epigraphies.filter(
    epigraphy => epigraphy.charOnTablet || epigraphy.type === 'region'
  );

  const initalUnits: EpigraphicUnit[] = relevantEpigraphyRows.map(epigraphy => {
    const relevantSignInfo = tables.signInfo.filter(
      sign => sign.referenceUuid === epigraphy.uuid
    );
    const relevantSign =
      relevantSignInfo.length > 0 ? relevantSignInfo[0] : null;
    const unit: EpigraphicUnit = {
      uuid: epigraphy.uuid,
      side: getSideNumber(epigraphy.side),
      column: epigraphy.column || 0,
      line: epigraphy.line || 0,
      charOnLine: epigraphy.charOnLine || 0,
      charOnTablet: epigraphy.charOnTablet || 0,
      objOnTablet: epigraphy.objectOnTablet,
      discourseUuid: epigraphy.discourseUuid,
      reading: epigraphy.reading,
      epigType: epigraphy.type,
      type: relevantSign ? relevantSign.type : null,
      value: relevantSign ? relevantSign.value : null,
      markups: markupUnits.filter(
        markup => markup.referenceUuid === epigraphy.uuid
      ),
      readingUuid: epigraphy.readingUuid || '',
      signUuid: epigraphy.signUuid || '',
    };
    return unit;
  });

  const orderedInitialUnits = initalUnits.sort((a, b) => {
    if (a.objOnTablet > b.objOnTablet) {
      return 1;
    }
    return -1;
  });

  return orderedInitialUnits;
};

const regionMarkupType = (
  region:
    | 'Broken Area'
    | 'Ruling(s)'
    | 'Seal Impression'
    | 'Uninscribed Line(s)'
): MarkupType => {
  switch (region) {
    case 'Broken Area':
      return 'broken';
    case 'Ruling(s)':
      return 'ruling';
    case 'Seal Impression':
      return 'isSealImpression';
    case 'Uninscribed Line(s)':
      return 'uninscribed';
    default:
      return 'broken';
  }
};

const createTextEpigraphyRow = (
  row: TextEpigraphyRowPartial
): TextEpigraphyRow => ({
  uuid: row.uuid,
  type: row.type,
  textUuid: row.textUuid,
  treeUuid: row.treeUuid,
  parentUuid: row.parentUuid || null,
  objectOnTablet: row.objectOnTablet,
  side: row.side || null,
  column: row.column || null,
  line: row.line || null,
  charOnLine: row.charOnLine || null,
  charOnTablet: row.charOnTablet || null,
  signUuid: row.signUuid || null,
  sign: row.sign || null,
  readingUuid: row.readingUuid || null,
  reading: row.reading || null,
  discourseUuid: row.discourseUuid || null,
});

const createTextMarkupRow = (row: TextMarkupRowPartial): TextMarkupRow => ({
  uuid: row.uuid,
  referenceUuid: row.referenceUuid,
  type: row.type,
  numValue: row.numValue || null,
  altReadingUuid: row.altReadingUuid || null,
  altReading: row.altReading || null,
  startChar: row.startChar || null,
  endChar: row.endChar || null,
  objectUuid: row.objectUuid || null,
});

const createMockTextTable = (textInfo: AddTextInfo): TextRow => ({
  uuid: v4(),
  type: 'logosyllabic',
  language: null,
  cdliNum: textInfo.cdliNum,
  translitStatus: '5536b5bd-e18e-11ea-8c9d-02b316ca7378',
  name: textInfo.textName,
  excavationPrefix: textInfo.excavationPrefix,
  excavationNumber: textInfo.excavationNumber,
  museumPrefix: textInfo.museumPrefix,
  museumNumber: textInfo.museumNumber,
  publicationPrefic: textInfo.publicationPrefix,
  publicationNumber: textInfo.publicationNumber,
  objectType: null,
  source: null,
  genre: null,
  subgenre: null,
});

export const createNewTextTables = (
  textInfo: AddTextInfo,
  content: AddTextEditorContent
): CreateTextTables => {
  const epigraphyRows: TextEpigraphyRow[] = [];
  const markupRows: TextMarkupRow[] = [];
  const signInformation: SignInfo[] = [];
  const textRow: TextRow = createMockTextTable(textInfo);
  const treeUuid = v4();

  let charOnTablet = 1;

  const epigraphicUnitRow: TextEpigraphyRow = createTextEpigraphyRow({
    uuid: v4(),
    type: 'epigraphicUnit',
    textUuid: textRow.uuid,
    treeUuid,
    objectOnTablet: 1,
    column: 0,
  });
  epigraphyRows.push(epigraphicUnitRow);

  // Sides
  content.sides.forEach(side => {
    const sideRow: TextEpigraphyRow = createTextEpigraphyRow({
      uuid: side.uuid,
      type: 'section',
      textUuid: textRow.uuid,
      treeUuid,
      parentUuid: epigraphicUnitRow.uuid,
      objectOnTablet: epigraphyRows.length + 1,
      side: side.number,
      column: 0,
      reading: side.type,
    });
    epigraphyRows.push(sideRow);

    // Columns
    side.columns.forEach((column, columnIndex) => {
      if (side.columns.length > 1) {
        const columnRow: TextEpigraphyRow = createTextEpigraphyRow({
          uuid: column.uuid,
          type: 'column',
          textUuid: textRow.uuid,
          treeUuid,
          parentUuid: side.uuid,
          objectOnTablet: epigraphyRows.length + 1,
          side: side.number,
          column: columnIndex + 1,
        });
        epigraphyRows.push(columnRow);
      }

      // Rows
      column.rows.forEach(row => {
        if (row.type === 'Line') {
          const lineRow: TextEpigraphyRow = createTextEpigraphyRow({
            uuid: row.uuid,
            type: 'line',
            textUuid: textRow.uuid,
            treeUuid,
            parentUuid: side.columns.length > 1 ? column.uuid : side.uuid,
            objectOnTablet: epigraphyRows.length + 1,
            side: side.number,
            column: side.columns.length > 1 ? columnIndex + 1 : 0,
            line: row.lines[0],
          });
          epigraphyRows.push(lineRow);

          // Signs
          const signs = row.signs || [];
          signs.forEach((sign, signIndex) => {
            const signRow: TextEpigraphyRow = createTextEpigraphyRow({
              uuid: v4(),
              type: sign.readingType === 'number' ? 'number' : 'sign',
              textUuid: textRow.uuid,
              treeUuid,
              parentUuid: row.uuid,
              objectOnTablet: epigraphyRows.length + 1,
              side: side.number,
              column: side.columns.length > 1 ? columnIndex + 1 : 0,
              line: row.lines[0],
              charOnLine: signIndex + 1,
              charOnTablet,
              signUuid: sign.signUuid || undefined,
              sign: sign.sign || undefined,
              readingUuid: sign.readingUuid || undefined,
              reading: sign.value || undefined,
            });
            charOnTablet += 1;
            epigraphyRows.push(signRow);

            const signInfo: SignInfo = {
              referenceUuid: signRow.uuid,
              type: sign.readingType || null,
              value: sign.value || null,
            };
            signInformation.push(signInfo);
          });
        } else if (
          row.type === 'Broken Area' ||
          row.type === 'Ruling(s)' ||
          row.type === 'Seal Impression' ||
          row.type === 'Uninscribed Line(s)'
        ) {
          const regionRow: TextEpigraphyRow = createTextEpigraphyRow({
            uuid: row.uuid,
            type: 'region',
            textUuid: textRow.uuid,
            treeUuid,
            parentUuid: side.columns.length > 1 ? column.uuid : side.uuid,
            objectOnTablet: epigraphyRows.length + 1,
            side: side.number,
            column: side.columns.length > 1 ? columnIndex + 1 : 0,
          });
          const regionMarkupRow: TextMarkupRow = createTextMarkupRow({
            uuid: v4(),
            referenceUuid: row.uuid,
            type: regionMarkupType(row.type),
            numValue: row.value || undefined,
          });
          markupRows.push(regionMarkupRow);
          epigraphyRows.push(regionRow);
        } else if (row.type === 'Broken Line(s)') {
          const brokenLinesRow: TextEpigraphyRow = createTextEpigraphyRow({
            uuid: row.uuid,
            type: 'undeterminedLines',
            textUuid: textRow.uuid,
            treeUuid,
            parentUuid: side.columns.length > 1 ? column.uuid : side.uuid,
            objectOnTablet: epigraphyRows.length + 1,
            side: side.number,
            column: side.columns.length > 1 ? columnIndex + 1 : 0,
            line: row.lines[0],
          });
          const brokenLinesMarkupRow: TextMarkupRow = createTextMarkupRow({
            uuid: v4(),
            referenceUuid: row.uuid,
            type: 'undeterminedLines',
            numValue: row.value || undefined,
          });
          markupRows.push(brokenLinesMarkupRow);
          epigraphyRows.push(brokenLinesRow);
        }
      });
    });
  });

  const createTextTables: CreateTextTables = {
    epigraphies: epigraphyRows,
    markups: markupRows,
    text: textRow,
    signInfo: signInformation,
  };
  return createTextTables;
};
