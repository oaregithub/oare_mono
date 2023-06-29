import { TextDiscourse, TextDiscourseUnit } from '@oare/types';

// COMPLETE

/**
 * Nests text discourses into a tree structure.
 * @param discourseRows Text discourses to nest.
 * @param baseParentUuid The parent UUID to start nesting from.
 * @returns A nested tree structure of text discourses.
 */
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

/**
 * Sets the explicit spelling of each discourse unit to be the concatenation of its children's displayable strings.
 * @param unit The discourse unit to set the explicit spelling of.
 * @returns A complete discourse unit with explicit spelling set.
 */
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
