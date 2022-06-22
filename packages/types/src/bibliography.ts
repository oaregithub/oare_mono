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

export interface ZoteroLink {
  href: string;
  type: string;
}

export interface ZoteroResponseData {
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
  tags: ZoteroTag[];
  collections: ZoteroCollection[];
  relations: ZoteroRelation;
  dateAdded: string;
  dateModified: string;
}

export interface ZoteroCreator {
  creatorType: string;
  firstName: string;
  lastName: string;
}

export interface ZoteroTag {
  tag: string;
}

export interface ZoteroCollection {}

export interface ZoteroRelation {
  'owl:sameAs': string;
  'dc:replaces': string;
}

export interface BibliographyRow {
  id: string;
  uuid: string;
  zot_item_key: string;
  short_cit: string;
}
