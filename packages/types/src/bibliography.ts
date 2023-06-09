// COMPLETE

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
  data: {
    key: string;
    version: number;
    itemType: string;
    title: string;
    creators: {
      creatorType: string;
      firstName: string;
      lastName: string;
    }[];
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
  } | null;
}

export interface Citation {
  bibliographyUuid: string;
  citation: string | null;
  beginPage: number | null;
  endPage: number | null;
  beginPlate: number | null;
  endPlate: number | null;
  note: string | null;
  publicationNumber: number | null;
  urls: CitationUrls;
}

export interface CitationUrls {
  general: string | null;
  page: string | null;
  plate: string | null;
}
