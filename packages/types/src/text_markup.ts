export interface TextMarkupRow {
  uuid: string;
  referenceUuid: string;
  type: MarkupType;
  numValue: number | null;
  altReadingUuid: string | null;
  altReading: string | null;
  startChar: number | null;
  endChar: number | null;
  objectUuid: string | null;
}

export type MarkupType =
  | 'isCollatedReading'
  | 'alternateSign'
  | 'isEmendedReading'
  | 'erasure'
  | 'isUninterpreted'
  | 'omitted'
  | 'originalSign'
  | 'superfluous'
  | 'uncertain'
  | 'undeterminedSigns'
  | 'undeterminedLines'
  | 'damage'
  | 'partialDamage'
  | 'isWrittenOverErasure'
  | 'isWrittenBelowTheLine'
  | 'isWrittenAboveTheLine'
  | 'broken'
  | 'isSealImpression'
  | 'uninscribed'
  | 'ruling'
  | 'isStampSealImpression'
  | 'phoneticComplement';
