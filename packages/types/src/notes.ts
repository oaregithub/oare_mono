// FIXME distinguish between notesRows and notes. Shouldn't have discourse name

export interface DiscourseNote {
  uuid: string;
  referenceUuid: string;
  title: string | null;
  language: string | null;
  primacy: number;
  date: Date | null;
  content: string;
  authorUuid: string | null;
}
