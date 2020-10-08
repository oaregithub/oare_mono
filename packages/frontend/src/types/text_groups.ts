export interface TextGroup {
  uuid: string;
  can_write: boolean;
}

export interface Text {
  can_read: boolean;
  can_write: boolean;
  name: string;
  text_uuid: string;
}
