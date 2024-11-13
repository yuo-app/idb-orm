import { BaseDriver } from './drivers/baseDriver';

class ORM {
  private driver: BaseDriver;
  private collection: string | null = null;

  constructor(driver: BaseDriver) {
    this.driver = driver;
  }

  from(collection: string) {
    this.collection = collection;
    return this;
  }

  async select(query: any) {
    if (!this.collection) {
      throw new Error('Collection not specified');
    }
    const keys = await this.driver.getKeys();
    const results = [];
    for (const key of keys) {
      const item = await this.driver.getItem(key);
      if (Object.keys(query).every(k => item[k] === query[k])) {
        results.push(item);
      }
    }
    return results;
  }

  async insert(data: any) {
    if (!this.collection) {
      throw new Error('Collection not specified');
    }
    const key = `${this.collection}:${data.id}`;
    await this.driver.setItem(key, data);
    return data;
  }

  async update(query: any, data: any) {
    if (!this.collection) {
      throw new Error('Collection not specified');
    }
    const keys = await this.driver.getKeys();
    let updatedCount = 0;
    for (const key of keys) {
      const item = await this.driver.getItem(key);
      if (Object.keys(query).every(k => item[k] === query[k])) {
        await this.driver.setItem(key, { ...item, ...data });
        updatedCount++;
      }
    }
    return updatedCount;
  }

  async delete(query: any) {
    if (!this.collection) {
      throw new Error('Collection not specified');
    }
    const keys = await this.driver.getKeys();
    let deletedCount = 0;
    for (const key of keys) {
      const item = await this.driver.getItem(key);
      if (Object.keys(query).every(k => item[k] === query[k])) {
        await this.driver.removeItem(key);
        deletedCount++;
      }
    }
    return deletedCount;
  }

  chain() {
    // Implement chaining functions here
    return this;
  }
}

export { ORM };
