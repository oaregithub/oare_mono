export interface Image {
  uuid: string;
  name: string;
  url: string;
}

export interface ImageResponse {
  totalImagees: number;
  Images: Image[];
}
