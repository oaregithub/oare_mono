// COMPLETE

export interface NoteRow {
  uuid: string;
  referenceUuid: string;
  title: string | null;
  language: string | null;
  primacy: number;
  date: Date | null;
  private: number | null;
  authorUuid: string | null;
}

export interface Note extends NoteRow {
  content: string;
}
