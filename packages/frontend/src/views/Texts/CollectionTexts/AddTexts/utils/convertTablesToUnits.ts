import {
  CreateTextTables,
  EpigraphicUnit,
  TextDiscourseRow,
  MarkupUnit,
  DiscourseRow,
  TextEpigraphyRow,
  DiscourseUnit,
} from '@oare/types';
import { convertSideNumberToSide } from '@oare/oare';
import sl from '@/serviceLocator';

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

export const convertTablesToDiscourseUnits = (
  epigraphies: TextEpigraphyRow[],
  discourses: TextDiscourseRow[]
) => {
  const _ = sl.get('lodash');

  const discourseRows: DiscourseRow[] = discourses.map(d => {
    const relevantEpigraphyRow = epigraphies.find(
      e => e.discourseUuid === d.uuid
    );
    return {
      uuid: d.uuid,
      type: d.type,
      wordOnTablet: d.wordOnTablet,
      parentUuid: d.parentUuid,
      spelling: d.spelling,
      explicitSpelling: d.explicitSpelling,
      transcription: d.transcription,
      line: relevantEpigraphyRow ? relevantEpigraphyRow.line : null,
      paragraphLabel: null,
      translation: null,
      objInText: d.objInText || 0,
      side: relevantEpigraphyRow ? relevantEpigraphyRow.side : null,
      childNum: d.childNum,
    };
  });

  const discourseRowsWithRegionLineNumbers = discourseRows.reduce<
    DiscourseRow[]
  >((newUnits, unit) => {
    if (unit.type === 'region') {
      const { objInText } = unit;

      const prevUnitIdx = _.findLastIndex(
        newUnits,
        backUnit => backUnit.line !== null && backUnit.objInText < objInText
      );

      let objLine: number | null = null;
      if (prevUnitIdx === -1) {
        objLine = 0.1;
      } else if (newUnits[prevUnitIdx].line !== null) {
        objLine = newUnits[prevUnitIdx].line! + 0.1;
      }

      return [...newUnits, { ...unit, line: objLine }];
    }

    return [...newUnits, unit];
  }, []);

  const nestedDiscourses = createNestedDiscourses(
    discourseRowsWithRegionLineNumbers,
    null
  );
  nestedDiscourses.forEach(nestedDiscourse =>
    setDiscourseReading(nestedDiscourse)
  );
  return nestedDiscourses;
};

function createNestedDiscourses(
  discourseRows: DiscourseRow[],
  baseParentUuid: string | null
): DiscourseUnit[] {
  const children = discourseRows.filter(
    row => row.parentUuid === baseParentUuid
  );
  const discourses: DiscourseUnit[] = [];

  children.forEach(
    ({
      type,
      uuid,
      spelling,
      explicitSpelling,
      transcription,
      line,
      wordOnTablet,
      paragraphLabel,
      translation,
      objInText,
      side,
      parentUuid,
      childNum,
    }) => {
      const unitChildren = createNestedDiscourses(discourseRows, uuid);
      unitChildren.sort((a, b) => a.objInText - b.objInText);
      const unit = {
        uuid,
        type,
        units: unitChildren,
        objInText,
        translation: translation || undefined,
        paragraphLabel: paragraphLabel || undefined,
        spelling: spelling || undefined,
        explicitSpelling: explicitSpelling || undefined,
        transcription: transcription || undefined,
        line: line || undefined,
        wordOnTablet: wordOnTablet || undefined,
        side: side || undefined,
        parentUuid: parentUuid || undefined,
        childNum: childNum || undefined,
      };
      discourses.push(unit);
    }
  );

  discourses.sort((a, b) => a.objInText - b.objInText);

  return discourses;
}

function setDiscourseReading(discourse: DiscourseUnit): void {
  if (discourse.units.length < 1) {
    return;
  }
  discourse.units.forEach(unit => setDiscourseReading(unit));
  // eslint-disable-next-line
  discourse.explicitSpelling = discourse.units
    .map(u => {
      if (u.transcription) {
        return u.transcription;
      }
      return u.explicitSpelling || '';
    })
    .join(' ');
}
