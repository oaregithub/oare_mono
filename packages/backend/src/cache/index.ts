export interface CacheKey {
  req: {
    method: string;
    originalUrl: string;
  };
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

  clear(key: CacheKey) {
    delete this.responses[keyString(key)];
  }
}

export default new Cache();
