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
  TextPhoto,
  TextPhotoWithName,
  LinkRow,
  ResourceRow,
  HierarchyRow,
  MarkupUnit,
  EditorMarkupError,
} from '@oare/types';
import { v4 } from 'uuid';
import sl from '@/serviceLocator';
import { convertParsePropsToItemProps } from '@oare/oare';

export const MARKUP_CHARS = [
  '%',
  '{',
  '}',
  ':',
  ';',
  '‹',
  '›',
  '«',
  '»',
  '+',
  'x',
  '⸢',
  '⸣',
  '[',
  ']',
  '!',
  '?',
  '(',
  ')',
  '/',
  '\\',
];

export type MarkupSymbolPosition = 'start' | 'middle' | 'end';

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
    if (
      a.type === 'isCollatedReading' ||
      a.type === 'isEmendedReading' ||
      a.type === 'uncertain'
    ) {
      return -1;
    }
    return 0;
  });

  const markupUnits: MarkupUnit[] = markups.map(markup => ({
    referenceUuid: markup.referenceUuid,
    type: markup.type,
    value: markup.numValue,
    startChar: markup.startChar,
    endChar: markup.endChar,
    altReading: markup.altReading,
    altReadingUuid: markup.altReadingUuid,
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
      spellingUuid: getSpellingUuid(tables.discourses, epigraphy.discourseUuid),
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

const getSpellingUuid = (
  discourseRows: TextDiscourseRow[],
  discourseUuid: string | null
): string | null => {
  if (!discourseUuid) {
    return null;
  }

  const relevantDiscourseRow = discourseRows.find(
    row => row.uuid === discourseUuid
  );
  if (!relevantDiscourseRow) {
    return null;
  }

  return relevantDiscourseRow.spellingUuid;
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

function generateDisplayName(textInfo: AddTextInfo): string {
  let displayName: string = '';

  if (
    textInfo.excavationPrefix &&
    textInfo.excavationPrefix.slice(0, 2).toLowerCase() === 'kt'
  ) {
    displayName = `${textInfo.excavationPrefix} ${textInfo.excavationNumber}`;
    if (textInfo.publicationPrefix && textInfo.publicationNumber) {
      displayName += ` (${textInfo.publicationPrefix} ${textInfo.publicationNumber})`;
    } else if (textInfo.museumPrefix && textInfo.museumNumber) {
      displayName += ` (${textInfo.museumPrefix} ${textInfo.museumNumber})`;
    }
  } else if (textInfo.publicationPrefix && textInfo.publicationNumber) {
    displayName = `${textInfo.publicationPrefix} ${textInfo.publicationNumber}`;
    if (textInfo.excavationPrefix && textInfo.excavationNumber) {
      displayName += ` (${textInfo.excavationPrefix} ${textInfo.excavationNumber})`;
    } else if (textInfo.museumPrefix && textInfo.museumNumber) {
      displayName += ` (${textInfo.museumPrefix} ${textInfo.museumNumber})`;
    }
  } else if (textInfo.excavationPrefix && textInfo.excavationNumber) {
    displayName = `${textInfo.excavationPrefix} ${textInfo.excavationNumber}`;
    if (textInfo.museumPrefix && textInfo.museumNumber) {
      displayName += ` (${textInfo.museumPrefix} ${textInfo.museumNumber})`;
    }
  } else if (textInfo.museumPrefix && textInfo.museumNumber) {
    displayName = `${textInfo.museumPrefix} ${textInfo.museumNumber}`;
  } else {
    displayName = textInfo.textName ? textInfo.textName : '';
  }

  return displayName;
}

const createTextRow = async (textInfo: AddTextInfo): Promise<TextRow> => ({
  uuid: v4(),
  type: 'logosyllabic',
  language: null,
  cdliNum: textInfo.cdliNum,
  translitStatus: '5536b5bd-e18e-11ea-8c9d-02b316ca7378',
  name: textInfo.textName,
  displayName: generateDisplayName(textInfo),
  excavationPrefix: textInfo.excavationPrefix,
  excavationNumber: textInfo.excavationNumber,
  museumPrefix: textInfo.museumPrefix,
  museumNumber: textInfo.museumNumber,
  publicationPrefix: textInfo.publicationPrefix,
  publicationNumber: textInfo.publicationNumber,
  objectType: null,
  source: null,
  genre: null,
  subgenre: null,
});

export const createNewTextTables = async (
  textInfo: AddTextInfo,
  content: AddTextEditorContent,
  persistentDiscourseStorage: { [uuid: string]: string | null },
  photos: TextPhotoWithName[],
  collectionUuid: string
): Promise<CreateTextTables> => {
  const server = sl.get('serverProxy');
  const store = sl.get('store');

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

  const itemPropertiesRows = convertParsePropsToItemProps(
    textInfo.properties,
    textUuid
  );

  const resourceRows: ResourceRow[] = photos.map(photo => ({
    uuid: v4(),
    sourceUuid: store.getters.user ? store.getters.user.uuid : null,
    type: 'img',
    container: 'oare-image-bucket',
    format: null,
    link: photo.name,
  }));

  const linkRows: LinkRow[] = resourceRows.map(resource => ({
    uuid: v4(),
    referenceUuid: textUuid,
    objUuid: resource.uuid,
  }));

  const hierarchyRow: HierarchyRow = {
    uuid: v4(),
    parentUuid: await server.getHierarchyParentUuidByCollection(collectionUuid),
    type: 'text',
    role: 'child',
    objectUuid: textUuid,
    objectParentUuid: collectionUuid,
    published: 1,
  };

  const tables: CreateTextTables = {
    epigraphies: epigraphyRows,
    markups: markupRows,
    discourses: discourseRows,
    text: textRow,
    signInfo: signInformation,
    itemProperties: itemPropertiesRows,
    resources: resourceRows,
    links: linkRows,
    hierarchy: hierarchyRow,
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
            reading: row.reading,
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
        const discourseUuid =
          sign.markup &&
          sign.markup.markup.some(
            markup => markup.type === 'superfluous' || markup.type === 'erasure'
          )
            ? null
            : sign.discourseUuid;
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
          discourseUuid: discourseUuid || undefined,
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
  return markupRows.filter(row => !!row).flat();
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
                        words
                          .filter(word => !!word.discourseUuid)
                          .map(async word => {
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
                            if (
                              persistentDiscourseStorage[
                                word.discourseUuid!
                              ] !== undefined
                            ) {
                              spellingUuid =
                                persistentDiscourseStorage[
                                  word.discourseUuid!
                                ] || undefined;
                            } else if (forms.length === 1) {
                              spellingUuid = forms[0].spellingUuid;
                            } else if (forms.length >= 2) {
                              const sortedFormsByNumOccurrences = forms.sort(
                                (a, b) => {
                                  if (a.occurrences >= b.occurrences) {
                                    return -1;
                                  }
                                  return 1;
                                }
                              );
                              const occurrenceRatio =
                                sortedFormsByNumOccurrences[0].occurrences /
                                sortedFormsByNumOccurrences[1].occurrences;
                              if (occurrenceRatio >= 2) {
                                spellingUuid =
                                  sortedFormsByNumOccurrences[0].spellingUuid;
                              }
                            }
                            const newDiscourseRow = await createTextDiscourseRow(
                              {
                                uuid: word.discourseUuid!,
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
    postMatches: word.match(/[\s\-.+%]+/g) || [],
    signs: word.split(/[-.+%]+/),
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
    const matches = piece.text.match(/:/);
    if (matches || isUninterpretedStatus) {
      editorMarkup[idx] = {
        ...editorMarkup[idx],
        markup: [...editorMarkup[idx].markup, { type: 'isUninterpreted' }],
      };
    }
    if (matches) {
      isUninterpretedStatus = !isUninterpretedStatus;
    }
  });

  let isWrittenOverErasureStatus = false;
  editorMarkup.forEach((piece, idx) => {
    const matches = piece.text.match(/\*/);
    if (matches || isWrittenOverErasureStatus) {
      editorMarkup[idx] = {
        ...editorMarkup[idx],
        markup: [...editorMarkup[idx].markup, { type: 'isWrittenOverErasure' }],
      };
    }
    if (matches) {
      isWrittenOverErasureStatus = !isWrittenOverErasureStatus;
    }
  });

  let phoneticComplementStatus = false;
  editorMarkup.forEach((piece, idx) => {
    const matches = piece.text.match(/;/);
    if (matches || phoneticComplementStatus) {
      editorMarkup[idx] = {
        ...editorMarkup[idx],
        markup: [...editorMarkup[idx].markup, { type: 'phoneticComplement' }],
      };
    }
    if (matches) {
      phoneticComplementStatus = !phoneticComplementStatus;
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

const getBracketErrors = (
  words: string[],
  openingSymbol: string,
  closingSymbol: string,
  typeText: string,
  allowMarkupWithinSigns = false
): EditorMarkupError[] => {
  const errors: EditorMarkupError[] = [];

  // Open brackets must be closed
  if (openingSymbol !== closingSymbol) {
    const closingErrors = verifyBracketClosing(
      words,
      openingSymbol,
      closingSymbol,
      typeText
    );
    closingErrors.forEach(error => errors.push(error));
  }

  // Number of opening and closing brackets must match
  if (openingSymbol !== closingSymbol) {
    const matchingBracketErrors = verifyBracketMatching(
      words,
      openingSymbol,
      closingSymbol,
      typeText
    );
    matchingBracketErrors.forEach(error => errors.push(error));
  }

  // Number of brackets must be even when they are identical
  if (openingSymbol === closingSymbol) {
    const identicalBracketErrors = verifyIdenticalBrackets(
      words,
      openingSymbol,
      typeText
    );
    identicalBracketErrors.forEach(error => errors.push(error));
  }

  // Brackets cannot appear within signs (damage and partial damage are exceptions)
  if (!allowMarkupWithinSigns) {
    const bracketIndexErrors = verifyBracketIndex(
      words,
      openingSymbol,
      closingSymbol,
      typeText
    );
    bracketIndexErrors.forEach(error => errors.push(error));
  }

  // Brackets cannot be nested
  const bracketNestingErrors = verifyBracketNesting(
    words,
    openingSymbol,
    closingSymbol,
    typeText
  );
  bracketNestingErrors.forEach(error => errors.push(error));

  return errors;
};

const verifyBracketClosing = (
  words: string[],
  openingSymbol: string,
  closingSymbol: string,
  typeText: string
): EditorMarkupError[] => {
  let bracketStatus = false;
  let bracketErrorIndex: number | null = null;

  words = words.map(word => word.replace('@', '...'));

  const errors: EditorMarkupError[] = [];

  words.forEach((word, idx) => {
    if (word.includes(openingSymbol)) {
      bracketStatus = true;
      bracketErrorIndex = idx;
    }

    if (word.includes(closingSymbol)) {
      bracketStatus = false;
      bracketErrorIndex = null;
    }
  });

  if (bracketStatus && bracketErrorIndex !== null) {
    errors.push({
      error: `Opening ${typeText.toLowerCase()} bracket does not have a matching closing bracket:`,
      text: words[bracketErrorIndex],
    });
  }
  return errors;
};

const verifyBracketMatching = (
  words: string[],
  openingSymbol: string,
  closingSymbol: string,
  typeText: string
): EditorMarkupError[] => {
  const errors: EditorMarkupError[] = [];

  const allChars = words.join('').split('');
  const numOpenBracket = allChars.filter(char => char === openingSymbol).length;
  const numClosingBracket = allChars.filter(char => char === closingSymbol)
    .length;
  if (numOpenBracket !== numClosingBracket) {
    errors.push({
      error: `Number of opening and closing ${typeText.toLowerCase()} brackets does not match`,
    });
  }
  return errors;
};

const verifyBracketNesting = (
  words: string[],
  openingSymbol: string,
  closingSymbol: string,
  typeText: string
): EditorMarkupError[] => {
  const errors: EditorMarkupError[] = [];

  const rowText = words.join(' ');

  let regexp: RegExp;
  if (openingSymbol !== closingSymbol) {
    regexp = new RegExp(
      `\\${openingSymbol}.*\\${openingSymbol}.*\\${closingSymbol}.*\\${closingSymbol}`
    );
  } else {
    regexp = new RegExp(
      `\\${openingSymbol}.*\\${openingSymbol}[\\s]*\\${closingSymbol}.*\\${closingSymbol}`
    );
  }

  const hasNestedBrackets = rowText.match(regexp) || false;
  if (hasNestedBrackets) {
    errors.push({
      text: hasNestedBrackets[0],
      error: `${typeText} brackets cannot be nested: `,
    });
  }

  return errors;
};

const verifyBracketIndex = (
  words: string[],
  openingSymbol: string,
  closingSymbol: string,
  typeText: string
): EditorMarkupError[] => {
  const errors: EditorMarkupError[] = [];

  const markupCharsToRemove = MARKUP_CHARS.filter(
    char => char !== openingSymbol && char !== closingSymbol
  );

  const dirtySigns = words.flatMap(word => word.split(/[-.+%]+/));
  const signs = dirtySigns.map(sign => {
    const chars = sign.split('');
    const validChars = chars.filter(
      char => !markupCharsToRemove.includes(char)
    );
    return validChars.join('').replace('@', '...');
  });

  if (openingSymbol !== closingSymbol) {
    const signsWithOpeningSymbol = signs.filter(sign =>
      sign.includes(openingSymbol)
    );
    const openingSymbolErrors = signsWithOpeningSymbol.filter(
      sign => !sign.startsWith(openingSymbol)
    );
    openingSymbolErrors.forEach(sign =>
      errors.push({
        text: sign,
        error: `Opening ${typeText.toLowerCase()} bracket should only appear at beginning of sign: `,
      })
    );

    const signsWithClosingSymbol = signs.filter(sign =>
      sign.includes(closingSymbol)
    );
    const closingSymbolErrors = signsWithClosingSymbol.filter(
      sign => !sign.endsWith(closingSymbol)
    );
    closingSymbolErrors.forEach(sign =>
      errors.push({
        text: sign,
        error: `Closing ${typeText.toLowerCase()} bracket should only appear at end of sign: `,
      })
    );
  } else if (openingSymbol === closingSymbol) {
    const signsWithSymbol = signs.filter(sign => sign.includes(openingSymbol));
    const symbolErrors = signsWithSymbol.filter(
      sign => !sign.startsWith(openingSymbol) && !sign.endsWith(openingSymbol)
    );
    symbolErrors.forEach(sign =>
      errors.push({
        text: sign,
        error: `${typeText} brackets should only appear at beginning or the end of a sign: `,
      })
    );
  }

  return errors;
};

const verifyIdenticalBrackets = (
  words: string[],
  symbol: string,
  typeText: string
): EditorMarkupError[] => {
  const errors: EditorMarkupError[] = [];

  const allChars = words.join('').split('');
  const numBrackets = allChars.filter(char => char === symbol).length;
  const isValid = numBrackets % 2 === 0;
  if (!isValid) {
    errors.push({
      error: `Number of opening and closing ${typeText.toLowerCase()} brackets does not match`,
    });
  }

  return errors;
};

const verifyAboveAndBelowSymbols = (words: string[]): EditorMarkupError[] => {
  const errors: EditorMarkupError[] = [];

  const signs = words
    .flatMap(word => word.split(/[-.+%]+/))
    .map(sign => sign.replace('@', '...'));

  const belowLineSigns = signs.filter(sign => sign.startsWith('/'));
  if (belowLineSigns.length > 1) {
    belowLineSigns.forEach((sign, idx) => {
      if (idx > 0) {
        errors.push({
          text: sign,
          error:
            'Only one "written below line" symbol can be added to a line: ',
        });
      }
    });
  }

  const aboveLineSigns = signs.filter(sign => sign.startsWith('\\'));
  if (aboveLineSigns.length > 1) {
    aboveLineSigns.forEach((sign, idx) => {
      if (idx > 0) {
        errors.push({
          text: sign,
          error:
            'Only one "written above line" symbol can be added to a line: ',
        });
      }
    });
  }

  return errors;
};

const verifySymbolPosition = (
  words: string[],
  symbol: string,
  validPositions: MarkupSymbolPosition[],
  canOnlyBeFollowedBy: string[],
  avoidNumbers = false
): EditorMarkupError[] => {
  const errors: EditorMarkupError[] = [];

  const signs = words
    .flatMap(word => word.split(/[-.+%]+/))
    .map(sign => sign.replace('@', '...'));

  const allPossiblePositions: MarkupSymbolPosition[] = [
    'start',
    'middle',
    'end',
  ];
  const invalidPosiitons = allPossiblePositions.filter(
    position => !validPositions.includes(position)
  );

  if (invalidPosiitons.includes('start')) {
    signs.forEach(sign => {
      if (sign.startsWith(symbol)) {
        errors.push({
          text: sign,
          error: `${symbol} cannot appear at the beginning of a sign: `,
        });
      }
    });
  }

  if (invalidPosiitons.includes('end')) {
    signs.forEach(sign => {
      if (sign.endsWith(symbol)) {
        errors.push({
          text: sign,
          error: `${symbol} cannot appear at the end of a sign: `,
        });
      }
    });
  }

  if (invalidPosiitons.includes('middle')) {
    signs.forEach(sign => {
      if (!avoidNumbers || !sign.match(/\d/)) {
        if (sign.slice(1, sign.length - 1).includes(symbol)) {
          errors.push({
            text: sign,
            error: `${symbol} cannot appear in the middle of a sign: `,
          });
        }
      }
    });
  }

  if (validPositions.includes('middle') && canOnlyBeFollowedBy.length > 0) {
    signs.forEach(sign => {
      const middleOccurrenceIndex = sign
        .slice(1, sign.length - 1)
        .indexOf(symbol);
      if (
        middleOccurrenceIndex >= 0 &&
        !canOnlyBeFollowedBy.includes(
          sign[middleOccurrenceIndex + 1 + symbol.length]
        )
      ) {
        errors.push({
          text: sign,
          error: `${symbol} cannot appear in the middle of a sign`,
        });
      }
    });
  }

  return errors;
};

export const getMarkupContextErrors = async (
  markups: EditorMarkup[],
  word: string
): Promise<EditorMarkupError[]> => {
  const errors: EditorMarkupError[] = [];
  word = word.replace('@', '...');

  const individualMarkups = markups.map(markup =>
    markup.markup.map(piece => piece.type)
  );

  // Original Sign can only be added to isEmendedReading or isCollatedReading
  const originalSignMarkups = individualMarkups.filter(markup =>
    markup.includes('originalSign')
  );
  const originalSignErrors = originalSignMarkups.filter(
    markup =>
      !markup.includes('isCollatedReading') &&
      !markup.includes('isEmendedReading')
  );
  originalSignErrors.forEach(_error =>
    errors.push({
      text: word,
      error:
        'Original signs can only be added to signs marked as emended or collated readings: ',
    })
  );

  // Alternate Sign can only be added to uncertain signs
  const alternateSignMarkups = individualMarkups.filter(markup =>
    markup.includes('alternateSign')
  );
  const alternateSignErrors = alternateSignMarkups.filter(
    markup => !markup.includes('uncertain')
  );
  alternateSignErrors.forEach(_error =>
    errors.push({
      text: word,
      error: 'Alternate signs can only be added to signs marked as uncertain: ',
    })
  );

  // undeterminedSigns of numValue of -1 should only appear in damage, partial, or erasure
  const undeterminedSignsMarkups = markups.filter(markup =>
    markup.markup.map(mark => mark.type).includes('undeterminedSigns')
  );
  const relevantUndeterminedMarkups = undeterminedSignsMarkups.filter(markup =>
    markup.markup.map(mark => mark.numValue).includes(-1)
  );
  const undeterminedSignsErrors = relevantUndeterminedMarkups
    .map(markup => markup.markup.map(piece => piece.type))
    .filter(
      markup =>
        !markup.includes('damage') &&
        !markup.includes('partialDamage') &&
        !markup.includes('erasure')
    );
  undeterminedSignsErrors.forEach(_error =>
    errors.push({
      text: word,
      error:
        'Undetermined signs of an unknown quantity can only be found within areas marked as damaged, partially damaged, or erasures: ',
    })
  );

  return errors;
};

export const getMarkupInputErrors = async (
  rowText: string
): Promise<EditorMarkupError[]> => {
  const determinativeAltMatches = rowText.match(/%((!")|(!!")|(\?'))/g) || [];
  determinativeAltMatches.forEach(match => {
    const newText = match.replace('%', '$');
    rowText = rowText.replace(match, newText);
  });

  const words = rowText.split(/[\s]+/).filter(word => word !== '');
  const errors: EditorMarkupError[] = [];

  // Damage
  const damageBracketErrors = getBracketErrors(words, '[', ']', 'Damage', true);
  damageBracketErrors.forEach(error => errors.push(error));
  const openDamagePositionErrors = verifySymbolPosition(
    words,
    '[',
    ['start', 'middle'],
    []
  );
  openDamagePositionErrors.forEach(error => errors.push(error));
  const closeDamagePositionErrors = verifySymbolPosition(
    words,
    ']',
    ['middle', 'end'],
    []
  );
  closeDamagePositionErrors.forEach(error => errors.push(error));

  // Partial Damage
  const partialDamageBracketErrors = getBracketErrors(
    words,
    '⸢',
    '⸣',
    'Partial damage',
    true
  );
  partialDamageBracketErrors.forEach(error => errors.push(error));
  const openPartialDamagePositionErrors = verifySymbolPosition(
    words,
    '⸢',
    ['start', 'middle'],
    []
  );
  openPartialDamagePositionErrors.forEach(error => errors.push(error));
  const closePartialDamagePositionErrors = verifySymbolPosition(
    words,
    '⸣',
    ['middle', 'end'],
    []
  );
  closePartialDamagePositionErrors.forEach(error => errors.push(error));

  // Superfluous
  const superfluousBracketErrors = getBracketErrors(
    words,
    '«',
    '»',
    'Superfluous'
  );
  superfluousBracketErrors.forEach(error => errors.push(error));

  // Ommitted
  const omittedBracketErrors = getBracketErrors(words, '‹', '›', 'Omitted');
  omittedBracketErrors.forEach(error => errors.push(error));

  // Erasure
  const erasureBracketErrors = getBracketErrors(words, '{', '}', 'Erasure');
  erasureBracketErrors.forEach(error => errors.push(error));

  // Uninterpreted
  const uninterpretedErrors = getBracketErrors(
    words,
    ':',
    ':',
    'Uninterpreted'
  );
  uninterpretedErrors.forEach(error => errors.push(error));

  // isWrittenOverErasure
  const writtenOverErasureErrors = getBracketErrors(
    words,
    '*',
    '*',
    'Written over erasure'
  );
  writtenOverErasureErrors.forEach(error => errors.push(error));

  // phoneticComplement
  const phoneticComplementErrors = getBracketErrors(
    words,
    ';',
    ';',
    'Phonetic complement'
  );
  phoneticComplementErrors.forEach(error => errors.push(error));

  // originalSign
  const originalSignBracketErrors = getBracketErrors(
    words,
    '"',
    '"',
    'Original sign'
  );
  originalSignBracketErrors.forEach(error => errors.push(error));

  // alternateSign
  const alternateSignBracketErrors = getBracketErrors(
    words,
    "'",
    "'",
    'Alternate sign'
  );
  alternateSignBracketErrors.forEach(error => errors.push(error));

  // isWrittenAboveLine and isWrittenBelowLine
  const aboveAndBelowErrors = verifyAboveAndBelowSymbols(words);
  aboveAndBelowErrors.forEach(error => errors.push(error));
  const writtenBelowErrors = verifySymbolPosition(
    words,
    '/',
    ['start'],
    [],
    true
  );
  writtenBelowErrors.forEach(error => errors.push(error));
  const writtenAboveErrors = verifySymbolPosition(
    words,
    '\\',
    ['start'],
    [],
    true
  );
  writtenAboveErrors.forEach(error => errors.push(error));

  // Uncertain
  const uncertainPositionErrors = verifySymbolPosition(
    words,
    '?',
    ['middle', 'end'],
    ["'"]
  );
  uncertainPositionErrors.forEach(error => errors.push(error));

  // isEmendedReading
  const emendedPositionErrors = verifySymbolPosition(
    words,
    '!',
    ['middle', 'end'],
    ['"', '!']
  );
  emendedPositionErrors.forEach(error => errors.push(error));

  // isCollatedReading
  const collatedPositionErrors = verifySymbolPosition(
    words,
    '!!',
    ['middle', 'end'],
    ['"']
  );
  collatedPositionErrors.forEach(error => errors.push(error));

  return errors;
};

export const addNamesToTextPhotos = async (
  textInfo: AddTextInfo | undefined,
  photos: TextPhoto[]
): Promise<TextPhotoWithName[]> => {
  const photoNames = await Promise.all(
    photos.map(photo => generatePhotoName(textInfo, photo))
  );
  const photosWithNamesUncorrected: TextPhotoWithName[] = photos.map(
    (photo, idx) => ({
      ...photo,
      name: photoNames[idx],
    })
  );
  return correctPhotoNames(photosWithNamesUncorrected);
};

export const generatePhotoName = async (
  textInfo: AddTextInfo | undefined,
  photo: TextPhoto
): Promise<string> => {
  const store = sl.get('store');
  const server = sl.get('serverProxy');
  const { user } = store.getters;
  const lastNameAbb = user ? user.lastName.slice(0, 2).toLowerCase() : '';
  const firstNameAbb = user ? user.firstName.slice(0, 2).toLowerCase() : '';

  let collection: string = '';
  let objectNumber: string = '';
  if (textInfo && textInfo.excavationPrefix && textInfo.excavationNumber) {
    collection = textInfo.excavationPrefix;
    objectNumber = textInfo.excavationNumber;
  } else if (textInfo && textInfo.museumPrefix && textInfo.museumNumber) {
    collection = textInfo.museumPrefix;
    objectNumber = textInfo.museumNumber;
  } else if (
    textInfo &&
    textInfo.publicationPrefix &&
    textInfo.publicationNumber
  ) {
    collection = textInfo.publicationPrefix;
    objectNumber = textInfo.publicationNumber;
  }

  collection = collection.toLowerCase();
  collection = collection.replace('kt', '');
  const piecesToRemove = collection.match(/[^a-z\d]/g) || [];
  piecesToRemove.forEach(piece => {
    collection = collection.replace(piece, '');
  });

  objectNumber = objectNumber.toLowerCase();
  const objectPiecesToRemove = objectNumber.match(/[^a-z\d]/g) || [];
  objectPiecesToRemove.forEach(piece => {
    objectNumber = objectNumber.replace(piece, '');
  });

  const preDesignatorText = `${collection}-${objectNumber}-${lastNameAbb}${firstNameAbb}-s-${photo.side}-${photo.view}-`;

  const designator = await server.getNextImageDesignator(preDesignatorText);

  const fileType = photo.upload
    ? photo.upload.type.slice(photo.upload.type.lastIndexOf('/') + 1)
    : '';

  return `${preDesignatorText}${designator}.${fileType}`;
};

export const correctPhotoNames = (photos: TextPhotoWithName[]) => {
  const photosWithNames: TextPhotoWithName[] = photos.map((photo, idx) => {
    const relevantPhotosNames = photos
      .slice(0, idx)
      .map(relevantPhoto => relevantPhoto.name);
    if (relevantPhotosNames.some(name => name === photo.name)) {
      const preDesignatorText = photo.name.slice(
        0,
        photo.name.lastIndexOf('-') + 1
      );
      const newDesignator =
        (Number(photo.name.slice(photo.name.lastIndexOf('-') + 1)) || 0) + 1;
      const name = `${preDesignatorText}${newDesignator}`;
      return {
        ...photo,
        name,
      };
    }
    return photo;
  });
  return photosWithNames;
};
