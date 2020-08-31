export interface CollectionText {
  id: number;
  uuid: string;
  type: string;
  hasEpigraphy: boolean;
  name: string;
}
export interface CollectionResponse {
  collectionName: string;
  totalTexts: number;
  texts: CollectionText[];
}

export interface CollectionListItem {
  uuid: string;
  name: string;
}

export interface CollectionInfo {
  name: string;
}
