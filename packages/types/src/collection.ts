export interface Collection {
  uuid: string;
  name: string;
}

export interface CollectionText {
  id: number;
  uuid: string;
  type: string;
  hasEpigraphy: boolean;
  name: string;
  excavationPrefix: string;
  excavationNumber: string;
  museumPrefix: string;
  museumNumber: string;
  publicationPrefix: string;
  publicationNumber: string;
}
export interface CollectionResponse {
  totalTexts: number;
  texts: CollectionText[];
}

export interface CollectionInfo {
  name: string;
}
