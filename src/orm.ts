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

  select(query: any) {
    if (!this.collection) {
      throw new Error('Collection not specified');
    }
    return this.driver.read(this.collection, query);
  }

  insert(data: any) {
    if (!this.collection) {
      throw new Error('Collection not specified');
    }
    return this.driver.create(this.collection, data);
  }

  update(query: any, data: any) {
    if (!this.collection) {
      throw new Error('Collection not specified');
    }
    return this.driver.update(this.collection, query, data);
  }

  delete(query: any) {
    if (!this.collection) {
      throw new Error('Collection not specified');
    }
    return this.driver.delete(this.collection, query);
  }

  chain() {
    // Implement chaining functions here
    return this;
  }
}

export { ORM };
