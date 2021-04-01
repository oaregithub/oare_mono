import { DiscourseUnit } from '@oare/types';
import { DiscourseRow, NewDiscourseRow } from './index';
import knex from '@/connection';

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

export function incrementIncrementalsBeforeInsert(
  newDiscourseRow: NewDiscourseRow
  ): void {
  if (newDiscourseRow.childNum !== null) {
    const incrementChildNum = knex('text_discourse')
      .where({
        text_uuid: newDiscourseRow.textUuid,
        parent_uuid: newDiscourseRow.parentUuid,
      })
      .andWhere('child_num', '>=', newDiscourseRow.childNum)
      .increment('child_num');
  }
  if (newDiscourseRow.wordOnTablet !== null) {
    const incrementWordOnTablet = knex('text_discourse')
      .where({
        text_uuid: newDiscourseRow.textUuid
         })
      .andWhere('word_on_tablet', '>=', newDiscourseRow.wordOnTablet)
      .increment('word_on_tablet');
  }
  if (newDiscourseRow.objInText !== null) {
   const incrementObjInText = knex('text_discourse')
    .where({
      text_uuid: newDiscourseRow.textUuid
      })
    .andWhere('obj_in_text', '>=', newDiscourseRow.objInText)
    .increment('obj_in_text');
  }
}