import { DiscourseUnit } from '@oare/types';
import knex from '@/connection';
import { DiscourseRow, NewDiscourseRow } from './index';

export function discourseUnitOrder(discourse: DiscourseUnit): number {
  if (discourse.wordOnTablet) {
    return Number(discourse.wordOnTablet);
  }
  if (discourse.units.length < 1) {
    return 0;
  }
  return discourseUnitOrder(discourse.units[0]);
}

export function createdNestedDiscourses(
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
      transcription,
      line,
      wordOnTablet,
      paragraphLabel,
      translation,
    }) => {
      const unitChildren = createdNestedDiscourses(discourseRows, uuid);
      unitChildren.sort(
        (a, b) => discourseUnitOrder(a) - discourseUnitOrder(b)
      );
      const unit = {
        uuid,
        type,
        units: unitChildren,
        ...(translation && { translation }),
        ...(paragraphLabel && { paragraphLabel }),
        ...(spelling && { spelling }),
        ...(transcription && { transcription }),
        ...(line && { line }),
        ...(wordOnTablet && { wordOnTablet }),
      };
      discourses.push(unit);
    }
  );

  discourses.sort((a, b) => discourseUnitOrder(a) - discourseUnitOrder(b));

  return discourses;
}

export function setDiscourseReading(discourse: DiscourseUnit): void {
  if (discourse.units.length < 1) {
    return;
  }
  discourse.units.forEach(unit => setDiscourseReading(unit));
  // eslint-disable-next-line
  discourse.spelling = discourse.units
    .map(u => {
      if (u.transcription) return u.transcription;
      return u.spelling || '';
    })
    .join(' ');
}

export async function incrementChildNum(
        textUuid: string,
        parentUuid: string | null,
        childNum: number | null
): Promise<void> {
  if (childNum && parentUuid) {
    await knex('text_discourse')
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
     await knex('text_discourse')
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
    await knex('text_discourse')
      .where({
        text_uuid: textUuid,
      })
      .andWhere('obj_in_text', '>=', objInText)
      .increment('obj_in_text', 1);
  }
}

export async function decrementChildNum(
        textUuid: string,
        parentUuid: string | null,
        childNum: number | null
): Promise<void> {
  if (childNum && parentUuid) {
    await knex('text_discourse')
      .where({
        text_uuid: textUuid,
        parent_uuid: parentUuid,
      })
      .andWhere('child_num', '>', childNum)
      .decrement('child_num', 1);
  }
}

export async function decrementWordOnTablet(
        textUuid: string,
        wordOnTablet: number | null
): Promise<void> {
  if (wordOnTablet) {
     await knex('text_discourse')
      .where({
        text_uuid: textUuid,
      })
      .andWhere('word_on_tablet', '>', wordOnTablet)
      .decrement('word_on_tablet', 1);
  }
}

export async function decrementObjInText(
        textUuid: string,
        objInText: number | null
): Promise<void> {
  if (objInText) {
    await knex('text_discourse')
      .where({
        text_uuid: textUuid,
      })
      .andWhere('obj_in_text', '>', objInText)
      .decrement('obj_in_text', 1);
  }
}
