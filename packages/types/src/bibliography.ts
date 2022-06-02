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
  bib: string;
}

export interface ZoteroLink {
  href: string;
  type: string;
}
