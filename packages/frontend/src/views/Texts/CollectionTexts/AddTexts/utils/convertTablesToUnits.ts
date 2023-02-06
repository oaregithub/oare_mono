import {
  CreateTextTables,
  EpigraphicUnit,
  TextDiscourseRow,
  MarkupUnit,
} from '@oare/types';
import { convertSideNumberToSide } from '@oare/oare';

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

  const initalUnits: EpigraphicUnit[] = tables.epigraphies.map(epigraphy => {
    const relevantSignInfo = tables.signInfo.filter(
      sign => sign.referenceUuid === epigraphy.uuid
    );
    const relevantSign =
      relevantSignInfo.length > 0 ? relevantSignInfo[0] : null;

    const unit: EpigraphicUnit = {
      uuid: epigraphy.uuid,
      side: epigraphy.side ? convertSideNumberToSide(epigraphy.side) : null,
      column: epigraphy.column,
      line: epigraphy.line,
      charOnLine: epigraphy.charOnLine,
      charOnTablet: epigraphy.charOnTablet,
      objOnTablet: epigraphy.objectOnTablet || 0,
      discourseUuid: epigraphy.discourseUuid,
      reading: epigraphy.reading,
      epigType: epigraphy.type,
      type: relevantSign ? relevantSign.type : null,
      value: relevantSign ? relevantSign.value : null,
      markups: markupUnits.filter(
        markup => markup.referenceUuid === epigraphy.uuid
      ),
      readingUuid: epigraphy.readingUuid,
      signUuid: epigraphy.signUuid,
      spellingUuid: getSpellingUuid(tables.discourses, epigraphy.discourseUuid),
      word: null,
      form: null,
      translation: null,
      parseInfo: null,
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
