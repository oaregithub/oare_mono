import { DiscourseUnit } from '@oare/types';
import { knexWrite } from '@/connection';
import { DiscourseRow } from './index';

export function createNestedDiscourses(
  discourseRows: DiscourseRow[],
  parentUuid: string | null
): DiscourseUnit[] {
  const children = discourseRows.filter(row => row.parentUuid === parentUuid);
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
      };
      discourses.push(unit);
    }
  );

  discourses.sort((a, b) => a.objInText - b.objInText);

  return discourses;
}

export function setDiscourseReading(discourse: DiscourseUnit): void {
  if (discourse.units.length < 1) {
    return;
  }
  discourse.units.forEach(unit => setDiscourseReading(unit));
  // eslint-disable-next-line
  discourse.explicitSpelling = discourse.units
    .map(u => {
      if (u.transcription) return u.transcription;
      return u.explicitSpelling || '';
    })
    .join(' ');
}

export async function incrementChildNum(
  textUuid: string,
  parentUuid: string,
  childNum: number | null
): Promise<void> {
  if (childNum) {
    await knexWrite()('text_discourse')
      .where({
        text_uuid: textUuid,
        parent_uuid: parentUuid,
      })
      .andWhere('child_num', '>=', childNum)
      .increment('child_num', 1);
  }
}

export async function incrementWordOnTablet(
  textUuid: string,
  wordOnTablet: number | null
): Promise<void> {
  if (wordOnTablet) {
    await knexWrite()('text_discourse')
      .where({
        text_uuid: textUuid,
      })
      .andWhere('word_on_tablet', '>=', wordOnTablet)
      .increment('word_on_tablet', 1);
  }
}

export async function incrementObjInText(
  textUuid: string,
  objInText: number | null
): Promise<void> {
  if (objInText) {
    await knexWrite()('text_discourse')
      .where({
        text_uuid: textUuid,
      })
      .andWhere('obj_in_text', '>=', objInText)
      .increment('obj_in_text', 1);
  }
}
