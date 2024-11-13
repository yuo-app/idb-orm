class QueryBuilder {
  private collection: string;
  private query: any = {};
  private sort: any = {};
  private limitCount: number | null = null;
  private skipCount: number | null = null;

  constructor(collection: string) {
    this.collection = collection;
  }

  where(field: string, value: any) {
    this.query[field] = value;
    return this;
  }

  sortBy(field: string, direction: 'asc' | 'desc' = 'asc') {
    this.sort[field] = direction;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  skip(count: number) {
    this.skipCount = count;
    return this;
  }

  async execute(driver: any) {
    let results = await driver.read(this.collection, this.query);

    if (Object.keys(this.sort).length > 0) {
      results = results.sort((a: any, b: any) => {
        for (const field in this.sort) {
          if (a[field] < b[field]) return this.sort[field] === 'asc' ? -1 : 1;
          if (a[field] > b[field]) return this.sort[field] === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    if (this.skipCount !== null) {
      results = results.slice(this.skipCount);
    }

    if (this.limitCount !== null) {
      results = results.slice(0, this.limitCount);
    }

    return results;
  }
}

export { QueryBuilder };
