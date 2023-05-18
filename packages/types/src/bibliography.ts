export interface Bibliography {
  uuid: string;
  title: string | null;
  authors: string[];
  date: string | null;
  bibliography: {
    bib: string | null;
    url: string | null;
  };
  itemType: string | null;
}

export interface BibliographyRow {
  uuid: string;
  zoteroKey: string;
  citation: string;
}

export interface ZoteroResponse {
  bib: string | null;
  citation: string | null;
  data: ZoteroResponseData | null;
}

interface ZoteroCreator {
  creatorType: string;
  firstName: string;
  lastName: string;
}

interface ZoteroResponseData {
  key: string;
  version: number;
  itemType: string;
  title: string;
  creators: ZoteroCreator[];
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

export interface ReferringLocationInfo {
  beginPage: number | null;
  endPage: number | null;
  beginPlate: number | null;
  endPlate: number | null;
  note: string | null;
  publicationNumber: number | null;
}
