export interface BibliographyItem {
  uuid: string;
  zoteroKey: string;
  citation: string;
}

export interface ZoteroResponse {
  bib?: string | null;
  citation?: string | null;
  data?: ZoteroResponseData | null;
}

export interface ZoteroResponseData {
  key: string;
  version: number;
  itemType: string;
  title: string;
  creators: any[];
  abstractNote: string;
  series: string;
  seriesNumber: string;
  volume: string;
  numberOfVolumes: string;
  edition: string;
  place: string;
  publisher: string;
  date: string;
  numPages: string;
  language: string;
  ISBN: string;
  shortTitle: string;
  url: string;
  accessDate: string;
  archive: string;
  archiveLocation: string;
  libraryCatalog: string;
  callNumber: string;
  rights: string;
  extra: string;
  tags: any[];
  collections: any[];
  relations: any;
  dateAdded: string;
  dateModified: string;
}

export interface BibliographyResponse {
  bib: string;
  data: ZoteroResponseData;
  url: string;
}
