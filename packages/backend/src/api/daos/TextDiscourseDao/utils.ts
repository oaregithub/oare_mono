import { DiscourseRow, NestedDiscourse } from './index';

export function createdNestedDiscourses(discourseRows: DiscourseRow[], parentUuid: string | null): NestedDiscourse[] {
  const children = discourseRows.filter((row) => row.parentUuid === parentUuid);
  const discourses: NestedDiscourse[] = [];

  children.forEach(({ type, uuid, spelling, transcription, line, wordOnTablet, paragraphLabel, translation }) => {
    const unitChildren = createdNestedDiscourses(discourseRows, uuid);
    unitChildren.sort((a, b) => discourseUnitOrder(a) - discourseUnitOrder(b));
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
  });

  discourses.sort((a, b) => discourseUnitOrder(a) - discourseUnitOrder(b));

  return discourses;
}

export function setDiscourseReading(discourse: NestedDiscourse): void {
  if (discourse.units.length < 1) {
    return;
  }
  discourse.units.forEach((unit) => setDiscourseReading(unit));
  // eslint-disable-next-line
  discourse.spelling = discourse.units
    .map((u) => {
      if (u.transcription) return u.transcription;
      return u.spelling || '';
    })
    .join(' ');
}

export function discourseUnitOrder(discourse: NestedDiscourse): number {
  if (discourse.wordOnTablet) {
    return Number(discourse.wordOnTablet);
  }
  if (discourse.units.length < 1) {
    return 0;
  }
  return discourseUnitOrder(discourse.units[0]);
}
