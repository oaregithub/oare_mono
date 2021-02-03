export interface Blacklists {
  blacklist: string[];
  whitelist: string[];
}

export interface PublicBlacklistPayloadItem {
  uuid: string;
  type: string;
}

export interface AddPublicBlacklistPayload {
  items: PublicBlacklistPayloadItem[];
}
