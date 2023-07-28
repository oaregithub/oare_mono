import {
  CreateTextTables,
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
  EpigraphyType,
  EpigraphicUnitType,
  TextPhotoWithDetails,
  LinkRow,
  ResourceRow,
  HierarchyRow,
  TreeRow,
} from '@oare/types';
import { v4 } from 'uuid';
import sl from '@/serviceLocator';
import { convertAppliedPropsToItemProps } from '@oare/oare';

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

const createTextRow = async (
  textInfo: AddTextInfo,
  existingTextUuid: string | null
): Promise<TextRow> => ({
  uuid: existingTextUuid || v4(),
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
  persistentDiscourseStorage: {
    [uuid: string]: {
      spellingUuid: string | null;
      transcription: string | null;
    };
  },
  photos: TextPhotoWithDetails[],
  collectionUuid: string,
  existingTextRow: TextRow | undefined
): Promise<CreateTextTables> => {
  const server = sl.get('serverProxy');
  const store = sl.get('store');

  const textRow: TextRow = await createTextRow(
    textInfo,
    existingTextRow ? existingTextRow.uuid : null
  );
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

  let wordOnTablet = 0;
  const discourseRows = discourseRowsWithoutIterators.map((row, idx) => {
    if (row.type === 'word' || row.type === 'number') {
      wordOnTablet += 1;
    }
    return {
      ...row,
      objInText: idx + 1,
      wordOnTablet:
        row.type === 'word' || row.type === 'number' ? wordOnTablet : null,
      childNum: row.type === 'discourseUnit' ? null : idx,
    };
  });
  const signInformation = await createSignInformation(content);

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

  const textItemPropertiesRows = convertAppliedPropsToItemProps(
    textInfo.properties,
    textUuid
  );
  const photoItemPropertiesRows = photos.flatMap((photo, idx) =>
    convertAppliedPropsToItemProps(photo.properties, resourceRows[idx].uuid)
  );

  const itemPropertiesRows = [
    ...textItemPropertiesRows,
    ...photoItemPropertiesRows,
  ];

  const hierarchyRow: HierarchyRow = {
    uuid: v4(),
    parentUuid: await server.getHierarchyParentUuidByCollection(collectionUuid),
    type: 'text',
    role: 'child',
    objectUuid: textUuid,
    objectParentUuid: collectionUuid,
    published: 1,
  };

  const treeRows: TreeRow[] = [];
  if (epigraphyRows[0]) {
    treeRows.push({ uuid: epigraphyRows[0].treeUuid, type: 'epigraphy' });
  }
  if (discourseRows[0]) {
    treeRows.push({ uuid: discourseRows[0].treeUuid, type: 'discourse' });
  }

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
    trees: treeRows,
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
        const columnRow = await createTextEpigraphyRow({
          uuid: column.uuid,
          type: 'column',
          textUuid,
          treeUuid,
          parentUuid,
          side: sideNumber,
          column: idx + 1,
        });

        const editorRows: TextEpigraphyRow[] = await createEditorRows(
          textUuid,
          treeUuid,
          column.uuid,
          sideNumber,
          idx + 1,
          column.rows
        );

        return [columnRow, ...editorRows];
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
            discourseUuid: row.regionDiscourseUuid,
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
              discourseUuid: row.regionDiscourseUuid,
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

                    return [...rowMarkup, ...rowSigns];
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
  persistentDiscourseStorage: {
    [uuid: string]: {
      spellingUuid: string | null;
      transcription: string | null;
    };
  }
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
                    if (row.type === 'Line') {
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
                              let transcription: string | undefined;
                              const forms = await server.searchSpellings(
                                word.spelling
                              );
                              if (
                                persistentDiscourseStorage[word.discourseUuid!]
                                  ? persistentDiscourseStorage[
                                      word.discourseUuid!
                                    ].spellingUuid !== null
                                  : false
                              ) {
                                spellingUuid =
                                  persistentDiscourseStorage[
                                    word.discourseUuid!
                                  ].spellingUuid || undefined;
                                transcription =
                                  persistentDiscourseStorage[
                                    word.discourseUuid!
                                  ].transcription || undefined;
                              } else if (forms.length === 1) {
                                spellingUuid = forms[0].spellingUuid;
                                transcription = forms[0].form.form;
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
                                  transcription =
                                    sortedFormsByNumOccurrences[0].form.form;
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
                                  transcription,
                                }
                              );
                              return newDiscourseRow;
                            })
                        )
                      ).flat();
                      return wordRows;
                    }

                    if (row.type === 'Broken Area') {
                      const newDiscourseRow = await createTextDiscourseRow({
                        uuid: row.regionDiscourseUuid!,
                        type: 'region',
                        textUuid,
                        treeUuid,
                        parentUuid: discourseUnitRow.uuid,
                        explicitSpelling: '(large break)',
                        transcription: '(large break)',
                      });
                      return newDiscourseRow;
                    }

                    if (row.type === 'Broken Line(s)') {
                      const newDiscourseRow = await createTextDiscourseRow({
                        uuid: row.regionDiscourseUuid!,
                        type: 'region',
                        textUuid,
                        treeUuid,
                        parentUuid: discourseUnitRow.uuid,
                        explicitSpelling:
                          row.value && row.value > 1
                            ? `(${row.value} broken lines)`
                            : '(broken line)',
                        transcription:
                          row.value && row.value > 1
                            ? `(${row.value} broken lines)`
                            : '(broken line)',
                      });
                      return newDiscourseRow;
                    }

                    if (row.type === 'Ruling(s)') {
                      let transcription = '';
                      if (row.value) {
                        if (row.value === 1) {
                          transcription = '(single ruling)';
                        } else if (row.value === 2) {
                          transcription = '(double ruling)';
                        } else if (row.value === 3) {
                          transcription = '(triple ruling)';
                        } else {
                          transcription = `(${row.value} rulings)`;
                        }
                      } else {
                        transcription = '(ruling)';
                      }

                      const newDiscourseRow = await createTextDiscourseRow({
                        uuid: row.regionDiscourseUuid!,
                        type: 'region',
                        textUuid,
                        treeUuid,
                        parentUuid: discourseUnitRow.uuid,
                        explicitSpelling: transcription,
                        transcription,
                      });
                      return newDiscourseRow;
                    }

                    if (row.type === 'Uninscribed Line(s)') {
                      const newDiscourseRow = await createTextDiscourseRow({
                        uuid: row.regionDiscourseUuid!,
                        type: 'region',
                        textUuid,
                        treeUuid,
                        parentUuid: discourseUnitRow.uuid,
                        explicitSpelling:
                          row.value && row.value > 1
                            ? `(${row.value} uninscribed lines)`
                            : '(uninscribed line)',
                        transcription:
                          row.value && row.value > 1
                            ? `(${row.value} uninscribed lines)`
                            : '(uninscribed line)',
                      });
                      return newDiscourseRow;
                    }

                    return [];
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
