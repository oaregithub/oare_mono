export interface PublicationResponse {
  prefix: string;
  textNumbers: PublicationText[];
}

export interface PublicationText {
  textUuid: string;
  type: string;
  name: string;
  excavationPrefix: string;
  excavationNumber: string;
  museumPrefix: string;
  museumNumber: string;
  publicationPrefix: string;
  publicationNumber: string;
}
