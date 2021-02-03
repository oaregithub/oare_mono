export type DiscourseUnitType =
  | 'discourseUnit'
  | 'sentence'
  | 'phrase'
  | 'number'
  | 'word'
  | 'paragraph'
  | 'clause'
  | 'heading'
  | 'stitch'
  | 'morpheme'
  | null;

export interface DiscourseUnit {
  uuid: string;
  type: DiscourseUnitType;
  units: DiscourseUnit[];
  spelling?: string;
  transcription?: string;
  line?: number;
  wordOnTablet?: number;
  paragraphLabel?: string;
  translation?: string;
}