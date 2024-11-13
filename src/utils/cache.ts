class Cache {
  private cache: Map<string, any>;
  private ttl: number;

  constructor(ttl: number = 60000) {
    this.cache = new Map();
    this.ttl = ttl;
  }

  set(key: string, value: any) {
    const expiration = Date.now() + this.ttl;
    this.cache.set(key, { value, expiration });
  }

  get(key: string) {
    const cached = this.cache.get(key);
    if (!cached) {
      return null;
    }
    if (Date.now() > cached.expiration) {
      this.cache.delete(key);
      return null;
    }
    return cached.value;
  }

  delete(key: string) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }
}

export { Cache };
