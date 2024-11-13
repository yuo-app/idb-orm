import { BaseDriver } from './baseDriver';

class MemoryDriver extends BaseDriver {
  private data: { [collection: string]: any[] } = {};

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
}

export { MemoryDriver };
