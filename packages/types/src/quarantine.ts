import { Text } from './text';

// COMPLETE

export interface QuarantineTextRow {
  referenceUuid: string;
  timestamp: string;
}

export interface QuarantineText extends QuarantineTextRow {
  text: Text;
}
