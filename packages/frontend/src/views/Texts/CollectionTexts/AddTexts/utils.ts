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
  EditorMarkup,
  EpigraphyType,
  EpigraphicUnitType,
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
      objOnTablet: epigraphy.objectOnTablet || 0,
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

const createTextEpigraphyRow = async (
  row: TextEpigraphyRowPartial
): Promise<TextEpigraphyRow> => ({
  uuid: row.uuid,
  type: row.type,
  textUuid: row.textUuid,
  treeUuid: row.treeUuid,
  parentUuid: row.parentUuid || null,
  objectOnTablet: row.objectOnTablet !== undefined ? row.objectOnTablet : null,
  side: row.side !== undefined ? row.side : null,
  column: row.column !== undefined ? row.column : null,
  line: row.line !== undefined ? row.line : null,
  charOnLine: row.charOnLine !== undefined ? row.charOnLine : null,
  charOnTablet: row.charOnTablet !== undefined ? row.charOnTablet : null,
  signUuid: row.signUuid || null,
  sign: row.sign || null,
  readingUuid: row.readingUuid || null,
  reading: row.reading || null,
  discourseUuid: row.discourseUuid || null,
});

const createTextMarkupRow = async (
  row: TextMarkupRowPartial
): Promise<TextMarkupRow> => ({
  uuid: row.uuid,
  referenceUuid: row.referenceUuid,
  type: row.type,
  numValue: row.numValue !== undefined ? row.numValue : null,
  altReadingUuid: row.altReadingUuid || null,
  altReading: row.altReading || null,
  startChar: row.startChar !== undefined ? row.startChar : null,
  endChar: row.endChar !== undefined ? row.endChar : null,
  objectUuid: row.objectUuid || null,
});

const createTextDiscourseRow = async (
  row: TextDiscourseRowPartial
): Promise<TextDiscourseRow> => ({
  uuid: row.uuid,
  type: row.type,
  objInText: row.objInText !== undefined ? row.objInText : null,
  wordOnTablet: row.wordOnTablet !== undefined ? row.wordOnTablet : null,
  childNum: row.childNum !== undefined ? row.childNum : null,
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

export const createNewTextTables = async (
  textInfo: AddTextInfo,
  content: AddTextEditorContent,
  persistentDiscourseStorage: { [uuid: string]: string | null }
): Promise<CreateTextTables> => {
  const textRow: TextRow = await createTextRow(textInfo);
  const textUuid = textRow.uuid;

  const epigraphyRowsWithoutIterators: TextEpigraphyRow[] = await createEpigraphyRows(
    textUuid,
    content
  );
  let charOnTablet = 0;
  const epigraphyRows = epigraphyRowsWithoutIterators.map((epigRow, idx) => {
    if (
      epigRow.type === 'sign' ||
      epigRow.type === 'number' ||
      epigRow.type === 'undeterminedSigns' ||
      epigRow.type === 'separator'
    ) {
      charOnTablet += 1;
    }
    return {
      ...epigRow,
      objectOnTablet: idx + 1,
      charOnTablet:
        epigRow.type === 'sign' ||
        epigRow.type === 'number' ||
        epigRow.type === 'undeterminedSigns' ||
        epigRow.type === 'separator'
          ? charOnTablet
          : null,
    };
  });
  const markupRows: TextMarkupRow[] = await createMarkupRows(content);
  const discourseRowsWithoutIterators: TextDiscourseRow[] = await createDiscourseRows(
    textUuid,
    content,
    persistentDiscourseStorage
  );
  const discourseRows = discourseRowsWithoutIterators.map((row, idx) => ({
    ...row,
    objInText: idx + 1,
    wordOnTablet: row.type === 'discourseUnit' ? null : idx,
    childNum: row.type === 'discourseUnit' ? null : idx,
  }));
  const signInformation = await createSignInformation(content);

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

  const epigraphicUnitRow: TextEpigraphyRow = await createTextEpigraphyRow({
    uuid: v4(),
    type: 'epigraphicUnit',
    textUuid,
    treeUuid,
    objectOnTablet: 1,
    column: 0,
  });

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
        const sideRow = await createTextEpigraphyRow({
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
          columnRow = await createTextEpigraphyRow({
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
        }
        return [...editorRows];
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
          const lineRow: TextEpigraphyRow = await createTextEpigraphyRow({
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
        }
        if (
          row.type === 'Broken Area' ||
          row.type === 'Ruling(s)' ||
          row.type === 'Seal Impression' ||
          row.type === 'Uninscribed Line(s)'
        ) {
          const regionRow: TextEpigraphyRow = await createTextEpigraphyRow({
            uuid: row.uuid,
            type: 'region',
            textUuid,
            treeUuid,
            parentUuid,
            side: sideNumber,
            column: columnNumber,
          });

          return [regionRow];
        }
        if (row.type === 'Broken Line(s)') {
          const brokenLinesRow: TextEpigraphyRow = await createTextEpigraphyRow(
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
        return [];
      })
    )
  ).flat();
  return editorRows;
};

const getEpigraphyType = (
  readingType: EpigraphicUnitType | undefined
): EpigraphyType => {
  if (readingType) {
    switch (readingType) {
      case 'number':
        return 'number';
      case 'punctuation':
        return 'separator';
      default:
        return 'sign';
    }
  }
  return 'undeterminedSigns';
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
        const type = getEpigraphyType(sign.readingType);
        const signRow: TextEpigraphyRow = await createTextEpigraphyRow({
          uuid: sign.uuid,
          type,
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
                    const rowMarkup: TextMarkupRow[] = [];
                    if (
                      row.type === 'Broken Area' ||
                      row.type === 'Ruling(s)' ||
                      row.type === 'Seal Impression' ||
                      row.type === 'Uninscribed Line(s)'
                    ) {
                      const regionMarkupRow: TextMarkupRow = await createTextMarkupRow(
                        {
                          uuid: v4(),
                          referenceUuid: row.uuid,
                          type: regionMarkupType(row.type),
                          numValue: row.value || undefined,
                        }
                      );
                      rowMarkup.push(regionMarkupRow);
                    }
                    if (row.type === 'Broken Line(s)') {
                      const brokenLinesMarkupRow: TextMarkupRow = await createTextMarkupRow(
                        {
                          uuid: v4(),
                          referenceUuid: row.uuid,
                          type: 'undeterminedLines',
                          numValue: row.value || undefined,
                        }
                      );
                      rowMarkup.push(brokenLinesMarkupRow);
                    }

                    const rowSigns = row.signs
                      ? (
                          await Promise.all(
                            row.signs.map(async sign => {
                              const signMarkupRows = sign.markup
                                ? (
                                    await Promise.all(
                                      sign.markup.markup.map(async markup => {
                                        const server = sl.get('serverProxy');

                                        const formattedAltReading = markup.altReading
                                          ? (
                                              await server.getFormattedSign(
                                                markup.altReading
                                              )
                                            ).join('')
                                          : undefined;

                                        const determinativePost = markup.isDeterminative
                                          ? 'isPercent'
                                          : 'notPercent';
                                        const altReadingUuid = markup.altReading
                                          ? (
                                              await server.getSignCode(
                                                markup.altReading,
                                                determinativePost
                                              )
                                            ).readingUuid || undefined
                                          : undefined;

                                        const markupRow: TextMarkupRow = await createTextMarkupRow(
                                          {
                                            uuid: v4(),
                                            referenceUuid: sign.uuid,
                                            type: markup.type,
                                            startChar:
                                              markup.startChar !== undefined
                                                ? markup.startChar
                                                : undefined,
                                            endChar:
                                              markup.endChar !== undefined
                                                ? markup.endChar
                                                : undefined,
                                            altReading: formattedAltReading,
                                            altReadingUuid,
                                            numValue:
                                              markup.numValue !== undefined
                                                ? markup.numValue
                                                : undefined,
                                          }
                                        );
                                        return markupRow;
                                      })
                                    )
                                  ).flat()
                                : [];
                              return signMarkupRows;
                            })
                          )
                        ).flat()
                      : [];

                    return [rowMarkup, ...rowSigns];
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
  content: AddTextEditorContent,
  persistentDiscourseStorage: { [uuid: string]: string | null }
): Promise<TextDiscourseRow[]> => {
  const server = sl.get('serverProxy');

  const treeUuid = v4();
  const discourseUnitRow: TextDiscourseRow = await createTextDiscourseRow({
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
                          if (persistentDiscourseStorage[word.discourseUuid]) {
                            spellingUuid =
                              persistentDiscourseStorage[word.discourseUuid] ||
                              undefined;
                          } else if (forms.length === 1) {
                            spellingUuid = forms[0].spellingUuid;
                          }
                          const newDiscourseRow = await createTextDiscourseRow({
                            uuid: word.discourseUuid,
                            type,
                            textUuid,
                            treeUuid,
                            parentUuid: discourseUnitRow.uuid,
                            spelling: word.spelling,
                            explicitSpelling: word.spelling,
                            spellingUuid,
                          });
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

const createSignInformation = async (
  content: AddTextEditorContent
): Promise<SignInfo[]> => {
  const signRows: SignInfo[] = (
    await Promise.all(
      content.sides.map(async side => {
        const sideRows = (
          await Promise.all(
            side.columns.map(async column => {
              const columnRows = (
                await Promise.all(
                  column.rows.map(async row => {
                    if (!row.signs) {
                      return [];
                    }
                    const signs = (
                      await Promise.all(
                        row.signs.map(async sign => {
                          const signInfo: SignInfo = {
                            referenceUuid: sign.uuid,
                            type: sign.readingType || null,
                            value: sign.value || null,
                          };
                          return signInfo;
                        })
                      )
                    ).flat();
                    return signs;
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
  return signRows;
};

export const applyMarkup = async (rowText: string): Promise<EditorMarkup[]> => {
  const determinativeAltMatches = rowText.match(/%((!")|(!!")|(\?'))/g) || [];
  determinativeAltMatches.forEach(match => {
    const newText = match.replace('%', '$');
    rowText = rowText.replace(match, newText);
  });

  const words = rowText.split(/[\s]+/).filter(word => word !== '');
  const pieces = words.map((word, index) => ({
    postMatches: word.match(/[\s\-.%]+/g) || [],
    signs: word.split(/[-.%]+/),
    wordIndex: index,
  }));
  const editorMarkup: EditorMarkup[] = pieces.flatMap(piece =>
    piece.signs.map((sign, idx) => ({
      text: sign,
      markup: [],
      post: piece.postMatches[idx] || '',
      wordIndex: piece.wordIndex,
    }))
  );

  let damageStatus = false;
  let pieceWithStart: number;
  let currentStartValue = 0;
  editorMarkup.forEach((piece, idx) => {
    let startChar: number | undefined;
    let endChar: number | undefined;
    const prefixMatches = piece.text.match(/\[/g);
    if (prefixMatches) {
      startChar = piece.text.indexOf('[');
      currentStartValue = startChar;
      damageStatus = true;
      pieceWithStart = idx;
    }

    if (damageStatus) {
      editorMarkup[idx] = {
        ...editorMarkup[idx],
        markup: [...editorMarkup[idx].markup, { type: 'damage' }],
      };
    }

    const postfixMatches = piece.text.match(/\]/g);
    if (postfixMatches) {
      endChar = piece.text.replace('[', '').indexOf(']');
      damageStatus = false;
    }

    if (startChar) {
      editorMarkup[idx] = {
        ...editorMarkup[idx],
        markup: [
          ...editorMarkup[idx].markup.filter(mark => mark.type !== 'damage'),
          {
            type: 'damage',
            startChar,
          },
        ],
      };
    }

    if (
      endChar &&
      ((endChar !== piece.text.replace('[', '').replace(']', '').length &&
        currentStartValue === 0) ||
        currentStartValue > 0)
    ) {
      const originalStartDamageRow = editorMarkup[idx].markup.filter(
        mark => mark.type === 'damage'
      )[0];
      editorMarkup[idx] = {
        ...editorMarkup[idx],
        markup: [
          ...editorMarkup[idx].markup.filter(mark => mark.type !== 'damage'),
          {
            ...originalStartDamageRow,
            endChar,
          },
        ],
      };
      const originalEndDamageRow = editorMarkup[pieceWithStart].markup.filter(
        mark => mark.type === 'damage'
      )[0];
      editorMarkup[pieceWithStart] = {
        ...editorMarkup[pieceWithStart],
        markup: [
          ...editorMarkup[pieceWithStart].markup.filter(
            mark => mark.type !== 'damage'
          ),
          {
            ...originalEndDamageRow,
            startChar: currentStartValue,
          },
        ],
      };
    }
  });

  let partialDamageStatus = false;
  let partialPieceWithStart: number;
  let currentPartialStartValue = 0;
  editorMarkup.forEach((piece, idx) => {
    let startChar: number | undefined;
    let endChar: number | undefined;
    const prefixMatches = piece.text.match(/⸢/g);
    if (prefixMatches) {
      startChar = piece.text.indexOf('⸢');
      currentPartialStartValue = startChar;
      partialDamageStatus = true;
      partialPieceWithStart = idx;
    }

    if (partialDamageStatus) {
      editorMarkup[idx] = {
        ...editorMarkup[idx],
        markup: [...editorMarkup[idx].markup, { type: 'partialDamage' }],
      };
    }

    const postfixMatches = piece.text.match(/⸣/g);
    if (postfixMatches) {
      endChar = piece.text.replace('⸢', '').indexOf('⸣');
      partialDamageStatus = false;
    }

    if (startChar) {
      editorMarkup[idx] = {
        ...editorMarkup[idx],
        markup: [
          ...editorMarkup[idx].markup.filter(
            mark => mark.type !== 'partialDamage'
          ),
          {
            type: 'partialDamage',
            startChar,
          },
        ],
      };
    }

    if (
      endChar &&
      ((endChar !== piece.text.replace('⸢', '').replace('⸣', '').length &&
        currentPartialStartValue === 0) ||
        currentPartialStartValue > 0)
    ) {
      const originalStartDamageRow = editorMarkup[idx].markup.filter(
        mark => mark.type === 'partialDamage'
      )[0];
      editorMarkup[idx] = {
        ...editorMarkup[idx],
        markup: [
          ...editorMarkup[idx].markup.filter(
            mark => mark.type !== 'partialDamage'
          ),
          {
            ...originalStartDamageRow,
            endChar,
          },
        ],
      };
      const originalEndDamageRow = editorMarkup[
        partialPieceWithStart
      ].markup.filter(mark => mark.type === 'partialDamage')[0];
      editorMarkup[partialPieceWithStart] = {
        ...editorMarkup[partialPieceWithStart],
        markup: [
          ...editorMarkup[partialPieceWithStart].markup.filter(
            mark => mark.type !== 'partialDamage'
          ),
          {
            ...originalEndDamageRow,
            startChar: currentPartialStartValue,
          },
        ],
      };
    }
  });

  editorMarkup.forEach((piece, idx) => {
    const undeterminedSignsMatches = piece.text.match(/x+/g) || [];
    if (undeterminedSignsMatches) {
      undeterminedSignsMatches.forEach(match => {
        editorMarkup[idx] = {
          ...editorMarkup[idx],
          markup: [
            ...editorMarkup[idx].markup,
            { type: 'undeterminedSigns', numValue: match.length },
          ],
        };
      });
    }

    const unknownSignsMatches = piece.text.match(/@/g) || [];
    if (unknownSignsMatches) {
      unknownSignsMatches.forEach(_ => {
        editorMarkup[idx] = {
          ...editorMarkup[idx],
          markup: [
            ...editorMarkup[idx].markup,
            { type: 'undeterminedSigns', numValue: -1 },
          ],
        };
      });
    }
  });

  let superfluousStatus = 0;
  editorMarkup.forEach((piece, idx) => {
    const prefixMatches = piece.text.match(/«/g);
    if (prefixMatches) {
      superfluousStatus += prefixMatches.length;
    }

    if (superfluousStatus > 0) {
      editorMarkup[idx] = {
        ...editorMarkup[idx],
        markup: [...editorMarkup[idx].markup, { type: 'superfluous' }],
      };
    }

    const postfixMatches = piece.text.match(/»/g);
    if (postfixMatches) {
      superfluousStatus -= postfixMatches.length;
    }
  });

  let omittedStatus = 0;
  editorMarkup.forEach((piece, idx) => {
    const prefixMatches = piece.text.match(/‹/g);
    if (prefixMatches) {
      omittedStatus += prefixMatches.length;
    }

    if (omittedStatus > 0) {
      editorMarkup[idx] = {
        ...editorMarkup[idx],
        markup: [...editorMarkup[idx].markup, { type: 'omitted' }],
      };
    }

    const postfixMatches = piece.text.match(/›/g);
    if (postfixMatches) {
      omittedStatus -= postfixMatches.length;
    }
  });

  let erasureStatus = 0;
  editorMarkup.forEach((piece, idx) => {
    const prefixMatches = piece.text.match(/\{/g);
    if (prefixMatches) {
      erasureStatus += prefixMatches.length;
    }

    if (erasureStatus > 0) {
      editorMarkup[idx] = {
        ...editorMarkup[idx],
        markup: [...editorMarkup[idx].markup, { type: 'erasure' }],
      };
    }

    const postfixMatches = piece.text.match(/\}/g);
    if (postfixMatches) {
      erasureStatus -= postfixMatches.length;
    }
  });

  let isUninterpretedStatus = false;
  editorMarkup.forEach((piece, idx) => {
    const prefixMatches = piece.text.match(/:/);
    if (prefixMatches) {
      isUninterpretedStatus = true;
    }

    if (isUninterpretedStatus) {
      editorMarkup[idx] = {
        ...editorMarkup[idx],
        markup: [...editorMarkup[idx].markup, { type: 'isUninterpreted' }],
      };
    }

    const postfixMatches = piece.text.match(/:/);
    if (postfixMatches) {
      isUninterpretedStatus = false;
    }
  });

  let isWrittenOverErasureStatus = false;
  editorMarkup.forEach((piece, idx) => {
    const prefixMatches = piece.text.match(/\*/);
    if (prefixMatches) {
      isWrittenOverErasureStatus = true;
    }

    if (isWrittenOverErasureStatus) {
      editorMarkup[idx] = {
        ...editorMarkup[idx],
        markup: [...editorMarkup[idx].markup, { type: 'isWrittenOverErasure' }],
      };
    }

    const postfixMatches = piece.text.match(/\*/);
    if (postfixMatches) {
      isWrittenOverErasureStatus = false;
    }
  });

  let phoneticComplementStatus = false;
  editorMarkup.forEach((piece, idx) => {
    const prefixMatches = piece.text.match(/;/);
    if (prefixMatches) {
      phoneticComplementStatus = true;
    }

    if (phoneticComplementStatus) {
      editorMarkup[idx] = {
        ...editorMarkup[idx],
        markup: [...editorMarkup[idx].markup, { type: 'phoneticComplement' }],
      };
    }

    const postfixMatches = piece.text.match(/;/);
    if (postfixMatches) {
      phoneticComplementStatus = false;
    }
  });

  editorMarkup.forEach((piece, idx) => {
    const match = piece.text.match(/".+"/);
    if (match) {
      const innerMatches = piece.text.match(/"/g) || [];
      let altReading = match[0];
      innerMatches.forEach(_ => {
        altReading = altReading.replace('"', '');
      });
      editorMarkup[idx] = {
        ...editorMarkup[idx],
        markup: [
          ...editorMarkup[idx].markup,
          {
            type: 'originalSign',
            altReading,
            isDeterminative: piece.text.includes('$'),
          },
        ],
      };
    }
  });

  editorMarkup.forEach((piece, idx) => {
    const match = piece.text.match(/'.+'/);
    if (match) {
      const innerMatches = piece.text.match(/'/g) || [];
      let altReading = match[0];
      innerMatches.forEach(_ => {
        altReading = altReading.replace("'", '');
      });
      editorMarkup[idx] = {
        ...editorMarkup[idx],
        markup: [
          ...editorMarkup[idx].markup,
          {
            type: 'alternateSign',
            altReading,
            isDeterminative: piece.text.includes('$'),
          },
        ],
      };
    }
  });

  editorMarkup.forEach((piece, idx) => {
    if (piece.text.endsWith('?') || piece.text.includes("?'")) {
      editorMarkup[idx] = {
        ...editorMarkup[idx],
        markup: [...editorMarkup[idx].markup, { type: 'uncertain' }],
      };
    }
  });

  let lineHasWrittenBelowLine = false;
  editorMarkup.forEach((piece, idx) => {
    if (piece.text.startsWith('/') || lineHasWrittenBelowLine) {
      lineHasWrittenBelowLine = true;
      editorMarkup[idx] = {
        ...editorMarkup[idx],
        markup: [
          ...editorMarkup[idx].markup,
          { type: 'isWrittenBelowTheLine' },
        ],
      };
    }
  });

  let lineHasWrittenAboveLine = false;
  editorMarkup.forEach((piece, idx) => {
    if (piece.text.startsWith('\\') || lineHasWrittenAboveLine) {
      lineHasWrittenAboveLine = true;
      editorMarkup[idx] = {
        ...editorMarkup[idx],
        markup: [
          ...editorMarkup[idx].markup,
          { type: 'isWrittenAboveTheLine' },
        ],
      };
    }
  });

  editorMarkup.forEach((piece, idx) => {
    if (piece.text.endsWith('!!') || piece.text.includes('!!"')) {
      editorMarkup[idx] = {
        ...editorMarkup[idx],
        markup: [...editorMarkup[idx].markup, { type: 'isCollatedReading' }],
      };
    }
  });

  editorMarkup.forEach((piece, idx) => {
    if (
      (piece.text.endsWith('!') && !piece.text.endsWith('!!')) ||
      (piece.text.includes('!"') && !piece.text.includes('!!'))
    ) {
      editorMarkup[idx] = {
        ...editorMarkup[idx],
        markup: [...editorMarkup[idx].markup, { type: 'isEmendedReading' }],
      };
    }
  });

  return editorMarkup;
};
