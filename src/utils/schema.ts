class Schema {
  private schema: any;

  constructor(schema: any) {
    this.schema = schema;
  }

  validate(data: any) {
    for (const key in this.schema) {
      if (this.schema.hasOwnProperty(key)) {
        const type = this.schema[key];
        if (typeof data[key] !== type) {
          throw new Error(`Invalid type for ${key}: expected ${type}, got ${typeof data[key]}`);
        }
      }
    }
    return true;
  }

  defineSchema(newSchema: any) {
    this.schema = newSchema;
  }
}

export { Schema };
