export interface Image {
  uuid: string;
  display_name: string;
  source_uuid: string;
  type: string;
  container: string;
  format: null;
  link: string;
  url: string;
}

export interface ImageResponse {
  totalImagees: number;
  Images: Image[];
}
