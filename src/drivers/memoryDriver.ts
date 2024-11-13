import { BaseDriver } from './baseDriver';

class MemoryDriver extends BaseDriver {
  private data: { [collection: string]: any[] } = {};
  private watchers: { [key: string]: ((event: string, key: string) => void)[] } = {};

  async create(collection: string, data: any): Promise<any> {
    if (!this.data[collection]) {
      this.data[collection] = [];
    }
    this.data[collection].push(data);
    return data;
  }

  async read(collection: string, query: any): Promise<any> {
    if (!this.data[collection]) {
      return [];
    }
    return this.data[collection].filter(item => {
      return Object.keys(query).every(key => item[key] === query[key]);
    });
  }

  async update(collection: string, query: any, data: any): Promise<any> {
    if (!this.data[collection]) {
      return 0;
    }
    let updatedCount = 0;
    this.data[collection] = this.data[collection].map(item => {
      if (Object.keys(query).every(key => item[key] === query[key])) {
        updatedCount++;
        return { ...item, ...data };
      }
      return item;
    });
    return updatedCount;
  }

  async delete(collection: string, query: any): Promise<any> {
    if (!this.data[collection]) {
      return 0;
    }
    const initialLength = this.data[collection].length;
    this.data[collection] = this.data[collection].filter(item => {
      return !Object.keys(query).every(key => item[key] === query[key]);
    });
    return initialLength - this.data[collection].length;
  }

  async hasItem(key: string): Promise<boolean> {
    return this.data.hasOwnProperty(key);
  }

  async getItem(key: string): Promise<any> {
    return this.data[key] ?? null;
  }

  async setItem(key: string, value: any): Promise<void> {
    this.data[key] = value;
    this.notifyWatchers('update', key);
  }

  async removeItem(key: string): Promise<void> {
    delete this.data[key];
    this.notifyWatchers('remove', key);
  }

  async getKeys(): Promise<string[]> {
    return Object.keys(this.data);
  }

  async clear(): Promise<void> {
    this.data = {};
    this.watchers = {};
  }

  async watch(callback: (event: string, key: string) => void): Promise<() => void> {
    const id = Symbol();
    this.watchers[id] = callback;
    return () => {
      delete this.watchers[id];
    };
  }

  async dispose(): Promise<void> {
    this.data = {};
    this.watchers = {};
  }

  private notifyWatchers(event: string, key: string) {
    for (const watcher of Object.values(this.watchers)) {
      watcher(event, key);
    }
  }
}

export { MemoryDriver };
