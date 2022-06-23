export interface Image {
  uuid: string;
  link: string;
}

export interface ImageResponse {
  totalImagees: number;
  Images: Image[];
}
