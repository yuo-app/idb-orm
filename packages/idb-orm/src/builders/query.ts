import type { DatabaseSchema, TableInsert } from '../types'
import { BaseQueryBuilder } from './base'
import { FilterBuilder } from './filter'

export class QueryBuilder<
  TSchema extends DatabaseSchema,
  TableName extends keyof TSchema,
> extends BaseQueryBuilder<TSchema, TableName> {
  select(...fields: (keyof TSchema[TableName])[]): FilterBuilder<TSchema, TableName> {
    this.operations.push({ type: 'select', payload: fields.map(f => String(f)) })
    return new FilterBuilder(this.db, this.tableName as TableName, this.schema, this.operations)
  }

  insert(data: TableInsert<TSchema[TableName]>): FilterBuilder<TSchema, TableName> {
    this.operations.push({ type: 'insert', payload: data })
    return new FilterBuilder(this.db, this.tableName as TableName, this.schema, this.operations)
  }

  update(data: Partial<TableInsert<TSchema[TableName]>>): FilterBuilder<TSchema, TableName> {
    this.operations.push({ type: 'update', payload: data })
    return new FilterBuilder(this.db, this.tableName as TableName, this.schema, this.operations)
  }

  upsert(data: Partial<TableInsert<TSchema[TableName]>>): FilterBuilder<TSchema, TableName> {
    this.operations.push({ type: 'upsert', payload: data })
    return new FilterBuilder(this.db, this.tableName as TableName, this.schema, this.operations)
  }

  delete(): FilterBuilder<TSchema, TableName> {
    this.operations.push({ type: 'delete', payload: null })
    return new FilterBuilder(this.db, this.tableName as TableName, this.schema, this.operations)
  }
}
