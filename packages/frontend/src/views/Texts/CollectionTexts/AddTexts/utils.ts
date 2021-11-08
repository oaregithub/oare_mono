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
  TextDiscourseRow,
  TextDiscourseRowPartial,
  SideContent,
  ColumnContent,
  RowContent,
  SignCodeWithDiscourseUuid,
} from '@oare/types';
import { v4 } from 'uuid';
import sl from '@/serviceLocator';

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
      objOnTablet: epigraphy.objectOnTablet || 0, // check this
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
  objectOnTablet: row.objectOnTablet || null,
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

const createTextDiscourseRow = (
  row: TextDiscourseRowPartial
): TextDiscourseRow => ({
  uuid: row.uuid,
  type: row.type,
  objInText: row.objInText || null,
  wordOnTablet: row.wordOnTablet || null,
  childNum: row.childNum || null,
  textUuid: row.textUuid,
  treeUuid: row.treeUuid,
  parentUuid: row.parentUuid || null,
  spellingUuid: row.spellingUuid || null,
  spelling: row.spelling || null,
  explicitSpelling: row.explicitSpelling || null,
  transcription: row.transcription || null,
});

export const createNewTextTables = async (
  textInfo: AddTextInfo,
  content: AddTextEditorContent
): Promise<CreateTextTables> => {
  const epigraphyRows: TextEpigraphyRow[] = [];
  const markupRows: TextMarkupRow[] = [];
  const discourseRows: TextDiscourseRow[] = [];
  const signInformation: SignInfo[] = [];
  const textRow: TextRow = createMockTextTable(textInfo);
  const treeUuid = v4();
  const discourseTreeUuid = v4();
  const server = sl.get('serverProxy');

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

  const discourseUnitRow: TextDiscourseRow = createTextDiscourseRow({
    uuid: v4(),
    type: 'discourseUnit',
    objInText: 1,
    textUuid: textRow.uuid,
    treeUuid: discourseTreeUuid,
  });
  discourseRows.push(discourseUnitRow);

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

          // Words
          const words = row.words || [];
          words.forEach(async word => {
            const type =
              row.signs &&
              row.signs
                .filter(sign => sign.discourseUuid === word.discourseUuid)
                .every(sign => sign.readingType === 'number')
                ? 'number'
                : 'word';
            let spellingUuid: string | undefined;
            const forms = await server.searchSpellings(word.spelling);
            if (forms.length === 1) {
              spellingUuid = forms[0].spellingUuid;
            }
            const newDiscourseRow = createTextDiscourseRow({
              uuid: word.discourseUuid,
              type,
              objInText: discourseRows.length + 1,
              wordOnTablet: discourseRows.length,
              childNum: discourseRows.length,
              textUuid: textRow.uuid,
              treeUuid: discourseTreeUuid,
              parentUuid: discourseUnitRow.uuid,
              spelling: word.spelling,
              explicitSpelling: word.spelling,
              spellingUuid,
              // transcription to be inserted when submitted
            });
            discourseRows.push(newDiscourseRow);
          });

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
              discourseUuid: sign.discourseUuid,
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
    discourses: discourseRows,
    text: textRow,
    signInfo: signInformation,
  };
  console.log(
    `Final returned discourses length: ${createTextTables.discourses.length}`
  );
  return createTextTables;
};

const asyncCreateTextEpigraphyRow = async (
  row: TextEpigraphyRowPartial
): Promise<TextEpigraphyRow> => ({
  uuid: row.uuid,
  type: row.type,
  textUuid: row.textUuid,
  treeUuid: row.treeUuid,
  parentUuid: row.parentUuid || null,
  objectOnTablet: row.objectOnTablet || null,
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

const asyncCreateTextMarkupRow = async (
  row: TextMarkupRowPartial
): Promise<TextMarkupRow> => ({
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

const asyncCreateTextDiscourseRow = async (
  row: TextDiscourseRowPartial
): Promise<TextDiscourseRow> => ({
  uuid: row.uuid,
  type: row.type,
  objInText: row.objInText || null,
  wordOnTablet: row.wordOnTablet || null,
  childNum: row.childNum || null,
  textUuid: row.textUuid,
  treeUuid: row.treeUuid,
  parentUuid: row.parentUuid || null,
  spellingUuid: row.spellingUuid || null,
  spelling: row.spelling || null,
  explicitSpelling: row.explicitSpelling || null,
  transcription: row.transcription || null,
});

const createTextRow = async (textInfo: AddTextInfo): Promise<TextRow> => ({
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

export const asynchronousCreateNewTextTables = async (
  textInfo: AddTextInfo,
  content: AddTextEditorContent
): Promise<CreateTextTables> => {
  const textRow: TextRow = await createTextRow(textInfo);
  const textUuid = textRow.uuid;

  const epigraphyRowsWithoutIterators: TextEpigraphyRow[] = await createEpigraphyRows(
    textUuid,
    content
  );
  let charOnTablet = 0;
  const epigraphyRows = epigraphyRowsWithoutIterators.map((epigRow, idx) => {
    if (epigRow.type === 'sign' || epigRow.type === 'number') {
      charOnTablet += 1;
    }
    return {
      ...epigRow,
      objectOnTablet: idx + 1,
      charOnTablet:
        epigRow.type === 'sign' || epigRow.type === 'number'
          ? charOnTablet
          : null,
    };
  });
  const markupRows: TextMarkupRow[] = await createMarkupRows(content);
  const discourseRowsWithoutIterators: TextDiscourseRow[] = await createDiscourseRows(
    textUuid,
    content
  );
  const discourseRows = discourseRowsWithoutIterators.map((row, idx) => ({
    ...row,
    objInText: idx + 1,
    wordOnTablet: row.type === 'discourseUnit' ? null : idx,
    childNum: row.type === 'discourseUnit' ? null : idx,
  }));
  // const signInformation = await createSignInformation();
  const signInformation: SignInfo[] = [];

  const tables: CreateTextTables = {
    epigraphies: epigraphyRows,
    markups: markupRows,
    discourses: discourseRows,
    text: textRow,
    signInfo: signInformation,
  };

  return tables;
};

const createEpigraphyRows = async (
  textUuid: string,
  content: AddTextEditorContent
): Promise<TextEpigraphyRow[]> => {
  const treeUuid = v4();

  const epigraphicUnitRow: TextEpigraphyRow = await asyncCreateTextEpigraphyRow(
    {
      uuid: v4(),
      type: 'epigraphicUnit',
      textUuid: textUuid,
      treeUuid,
      objectOnTablet: 1,
      column: 0,
    }
  );

  const sideRows: TextEpigraphyRow[] = await createSideRows(
    textUuid,
    treeUuid,
    epigraphicUnitRow.uuid,
    content.sides
  );

  return [epigraphicUnitRow, ...sideRows];
};

const createSideRows = async (
  textUuid: string,
  treeUuid: string,
  parentUuid: string,
  sides: SideContent[]
): Promise<TextEpigraphyRow[]> => {
  const sideRows: TextEpigraphyRow[] = (
    await Promise.all(
      sides.map(async side => {
        const sideRow = await asyncCreateTextEpigraphyRow({
          uuid: side.uuid,
          type: 'section',
          textUuid,
          treeUuid,
          parentUuid,
          side: side.number,
          column: 0,
          reading: side.type,
        });

        const columnRows: TextEpigraphyRow[] = await createColumnRows(
          textUuid,
          treeUuid,
          side.uuid,
          side.number,
          side.columns
        );
        return [sideRow, ...columnRows];
      })
    )
  ).flat();
  return sideRows;
};

const createColumnRows = async (
  textUuid: string,
  treeUuid: string,
  parentUuid: string,
  sideNumber: number,
  columns: ColumnContent[]
): Promise<TextEpigraphyRow[]> => {
  const columnRows: TextEpigraphyRow[] = (
    await Promise.all(
      columns.map(async (column, idx) => {
        let columnRow: TextEpigraphyRow | null = null;
        if (columns.length > 1) {
          columnRow = await asyncCreateTextEpigraphyRow({
            uuid: column.uuid,
            type: 'column',
            textUuid,
            treeUuid,
            parentUuid,
            side: sideNumber,
            column: idx + 1,
          });
        }

        const parentUuidForChildren =
          columns.length > 1 ? column.uuid : parentUuid;
        const columnNumber = columns.length > 1 ? idx + 1 : 0;

        const editorRows: TextEpigraphyRow[] = await createEditorRows(
          textUuid,
          treeUuid,
          parentUuidForChildren,
          sideNumber,
          columnNumber,
          column.rows
        );

        if (columnRow) {
          return [columnRow, ...editorRows];
        } else {
          return [...editorRows];
        }
      })
    )
  ).flat();
  return columnRows;
};

const createEditorRows = async (
  textUuid: string,
  treeUuid: string,
  parentUuid: string,
  sideNumber: number,
  columnNumber: number,
  rows: RowContent[]
): Promise<TextEpigraphyRow[]> => {
  const editorRows: TextEpigraphyRow[] = (
    await Promise.all(
      rows.map(async row => {
        if (row.type === 'Line') {
          const lineRow: TextEpigraphyRow = await asyncCreateTextEpigraphyRow({
            uuid: row.uuid,
            type: 'line',
            textUuid,
            treeUuid,
            parentUuid,
            side: sideNumber,
            column: columnNumber,
            line: row.lines[0],
          });

          const signRows: TextEpigraphyRow[] = await createSignRows(
            textUuid,
            treeUuid,
            lineRow.uuid,
            sideNumber,
            columnNumber,
            row.lines[0],
            row.signs || []
          );

          return [lineRow, ...signRows];
        } else if (
          row.type === 'Broken Area' ||
          row.type === 'Ruling(s)' ||
          row.type === 'Seal Impression' ||
          row.type === 'Uninscribed Line(s)'
        ) {
          const regionRow: TextEpigraphyRow = await asyncCreateTextEpigraphyRow(
            {
              uuid: row.uuid,
              type: 'region',
              textUuid,
              treeUuid,
              parentUuid,
              side: sideNumber,
              column: columnNumber,
            }
          );

          return [regionRow];
        } else if (row.type === 'Broken Line(s)') {
          const brokenLinesRow: TextEpigraphyRow = await asyncCreateTextEpigraphyRow(
            {
              uuid: row.uuid,
              type: 'undeterminedLines',
              textUuid,
              treeUuid,
              parentUuid,
              side: sideNumber,
              column: columnNumber,
              line: row.lines[0],
            }
          );
          return [brokenLinesRow];
        }
      })
    )
  ).flat();
  return editorRows;
};

const createSignRows = async (
  textUuid: string,
  treeUuid: string,
  parentUuid: string,
  sideNumber: number,
  columnNumber: number,
  lineNumber: number,
  signs: SignCodeWithDiscourseUuid[]
): Promise<TextEpigraphyRow[]> => {
  const signRows: TextEpigraphyRow[] = (
    await Promise.all(
      signs.map(async (sign, idx) => {
        const signRow: TextEpigraphyRow = await asyncCreateTextEpigraphyRow({
          uuid: sign.uuid,
          type: sign.readingType === 'number' ? 'number' : 'sign',
          textUuid,
          treeUuid,
          parentUuid,
          side: sideNumber,
          column: columnNumber,
          line: lineNumber,
          signUuid: sign.signUuid || undefined,
          sign: sign.sign || undefined,
          readingUuid: sign.readingUuid || undefined,
          reading: sign.value || undefined,
          discourseUuid: sign.discourseUuid,
          charOnLine: idx + 1,
        });
        return signRow;
      })
    )
  ).flat();

  return signRows;
};

const createMarkupRows = async (
  content: AddTextEditorContent
): Promise<TextMarkupRow[]> => {
  const markupRows: TextMarkupRow[] = (
    await Promise.all(
      content.sides.map(async side => {
        const sideRows = (
          await Promise.all(
            side.columns.map(async column => {
              const columnRows = (
                await Promise.all(
                  column.rows.map(async row => {
                    if (
                      row.type === 'Broken Area' ||
                      row.type === 'Ruling(s)' ||
                      row.type === 'Seal Impression' ||
                      row.type === 'Uninscribed Line(s)'
                    ) {
                      const regionMarkupRow: TextMarkupRow = await asyncCreateTextMarkupRow(
                        {
                          uuid: v4(),
                          referenceUuid: row.uuid,
                          type: regionMarkupType(row.type),
                          numValue: row.value || undefined,
                        }
                      );
                      return regionMarkupRow;
                    } else if (row.type === 'Broken Line(s)') {
                      const brokenLinesMarkupRow: TextMarkupRow = await asyncCreateTextMarkupRow(
                        {
                          uuid: v4(),
                          referenceUuid: row.uuid,
                          type: 'undeterminedLines',
                          numValue: row.value || undefined,
                        }
                      );
                      return brokenLinesMarkupRow;
                    }
                  })
                )
              ).flat();
              return columnRows;
            })
          )
        ).flat();
        return sideRows;
      })
    )
  ).flat();
  return markupRows.filter(row => !!row);
};

const createDiscourseRows = async (
  textUuid: string,
  content: AddTextEditorContent
): Promise<TextDiscourseRow[]> => {
  const server = sl.get('serverProxy');

  const treeUuid = v4();
  const discourseUnitRow: TextDiscourseRow = await asyncCreateTextDiscourseRow({
    uuid: v4(),
    type: 'discourseUnit',
    objInText: 1,
    textUuid,
    treeUuid,
  });

  const discourseRows: TextDiscourseRow[] = (
    await Promise.all(
      content.sides.map(async side => {
        const sideRows = (
          await Promise.all(
            side.columns.map(async column => {
              const columnRows = (
                await Promise.all(
                  column.rows.map(async row => {
                    const words = row.words || [];
                    const wordRows = (
                      await Promise.all(
                        words.map(async word => {
                          const type =
                            row.signs &&
                            row.signs
                              .filter(
                                sign =>
                                  sign.discourseUuid === word.discourseUuid
                              )
                              .every(sign => sign.readingType === 'number')
                              ? 'number'
                              : 'word';
                          let spellingUuid: string | undefined;
                          const forms = await server.searchSpellings(
                            word.spelling
                          );
                          if (forms.length === 1) {
                            spellingUuid = forms[0].spellingUuid;
                          }
                          const newDiscourseRow = await asyncCreateTextDiscourseRow(
                            {
                              uuid: word.discourseUuid,
                              type,
                              textUuid,
                              treeUuid,
                              parentUuid: discourseUnitRow.uuid,
                              spelling: word.spelling,
                              explicitSpelling: word.spelling,
                              spellingUuid,
                            }
                          );
                          return newDiscourseRow;
                        })
                      )
                    ).flat();
                    return wordRows;
                  })
                )
              ).flat();
              return columnRows;
            })
          )
        ).flat();
        return sideRows;
      })
    )
  ).flat();

  return [discourseUnitRow, ...discourseRows];
};
