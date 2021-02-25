export interface CacheKey {
  req: {
    method: string;
    originalUrl: string;
  };
}

export interface ClearCacheOptions {
  exact: boolean;
}

const keyString = (key: CacheKey): string =>
  JSON.stringify({
    method: key.req.method,
    url: key.req.originalUrl,
  });
class Cache {
  private responses: { [key: string]: any } = {};

  contains(key: CacheKey): boolean {
    return Object.prototype.hasOwnProperty.call(this.responses, keyString(key));
  }

  insert(key: CacheKey, response: any): void {
    this.responses[keyString(key)] = response;
  }

  retrieve(key: CacheKey) {
    return this.responses[keyString(key)];
  }

  clear(key: CacheKey, { exact }: ClearCacheOptions = { exact: true }) {
    if (exact) {
      delete this.responses[keyString(key)];
    } else {
      const keys = Object.keys(this.responses).filter(k =>
        JSON.parse(k).url.startsWith(key.req.originalUrl)
      );
      keys.forEach(k => delete this.responses[k]);
    }
  }
}

export default new Cache();
