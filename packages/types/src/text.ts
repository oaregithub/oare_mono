// COMPLETE

export interface TextTransliterationStatus {
  uuid: string;
  color: string;
  colorMeaning: string;
}

export interface UpdateTextTransliterationStatusPayload {
  textUuid: string;
  color: string;
}

export interface EditTextInfoPayload {
  excavationPrefix: string;
  excavationNumber: string;
  museumPrefix: string;
  museumNumber: string;
  publicationPrefix: string;
  publicationNumber: string;
}

export interface TextRow {
  uuid: string;
  type: string;
  language: string | null;
  cdliNum: string | null;
  translitStatus: string;
  name: string | null;
  displayName: string | null;
  excavationPrefix: string | null;
  excavationNumber: string | null;
  museumPrefix: string | null;
  museumNumber: string | null;
  publicationPrefix: string | null;
  publicationNumber: string | null;
  objectType: string | null;
  source: string | null;
  genre: string | null;
  subgenre: string | null;
}

export interface Text extends TextRow {
  collectionUuid: string;
  hasEpigraphy: boolean;
}
