export interface CacheKey {
  userId: number | null;
  reqPath: string;
}

class Cache {
  private responses: { [key: string]: any } = {};

  contains(key: CacheKey): boolean {
    return Object.prototype.hasOwnProperty.call(this.responses, JSON.stringify(key));
  }

  insert(key: CacheKey, response: any): void {
    this.responses[JSON.stringify(key)] = response;
  }

  retrieve(key: CacheKey) {
    return this.responses[JSON.stringify(key)];
  }
}

export default new Cache();
