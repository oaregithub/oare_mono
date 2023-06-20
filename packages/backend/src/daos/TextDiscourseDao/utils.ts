import { TextDiscourse, TextDiscourseUnit } from '@oare/types';

// COMPLETE

export function createNestedDiscourses(
  discourseRows: TextDiscourse[],
  baseParentUuid: string | null
): TextDiscourseUnit[] {
  const children = discourseRows.filter(
    row => row.parentUuid === baseParentUuid
  );
  const discourses: TextDiscourseUnit[] = [];

  children.forEach(child => {
    const unitChildren = createNestedDiscourses(discourseRows, child.uuid);

    unitChildren.sort((a, b) => a.objInText - b.objInText);

    const unit = {
      ...child,
      children: unitChildren,
    };

    discourses.push(unit);
  });

  discourses.sort((a, b) => a.objInText - b.objInText);

  return discourses;
}

export function setDiscourseReading(unit: TextDiscourseUnit): void {
  if (unit.children.length < 1) {
    return;
  }

  unit.children.forEach(child => setDiscourseReading(child));
  // eslint-disable-next-line
  unit.explicitSpelling = unit.children
    .map(child => {
      if (child.transcription) {
        return child.transcription;
      }
      return child.explicitSpelling || '';
    })
    .join(' ');
}
