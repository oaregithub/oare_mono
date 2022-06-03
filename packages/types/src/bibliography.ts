export interface Bibliography {
  uuid: string;
  zoteroKey: string;
  citation: string;
}

export interface ZoteroResponse {
  key: string;
  version: number;
  library: {
    type: string;
    id: number;
    name: string;
    links: {
      alternate: ZoteroLink;
    };
  };
  links: {
    self: ZoteroLink;
    alternate: ZoteroLink;
  };
  meta: {
    createdByUser: {
      id: number;
      username: string;
      name: string;
      links: {
        alternate: ZoteroLink;
      };
      creatorSummary: string;
      numChildren: number;
    };
  };
  bib?: string | null;
  citation?: string | null;
  data?: ZoetroData | null;
}

export interface ZoteroLink {
  href: string;
  type: string;
}

export interface ZoetroData {
  key: string;
  version: number;
  itemType: string;
  title: string;
  creators: ZoetroCreator[];
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

export interface ZoetroCreator {
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
