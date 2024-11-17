import type { DatabaseSchema, FieldType, InferSchemaType, Operation } from '../types'
import { BaseQueryBuilder } from './base'

export class FilterBuilder<
  TSchema extends DatabaseSchema,
  TableName extends keyof TSchema,
> extends BaseQueryBuilder<TSchema, TableName> {
  constructor(
    db: IDBDatabase,
    table: TableName,
    schema: TSchema,
    operations: Operation[],
  ) {
    super(db, table, schema)
    this.operations = operations
  }

  eq<K extends keyof TSchema[TableName]>(
    field: K,
    value: FieldType<TSchema[TableName], K>,
  ): this {
    this.operations.push({
      type: 'filter',
      payload: { field: field as string, operator: 'eq', value },
    })
    return this
  }

  neq<K extends keyof TSchema[TableName]>(
    field: K,
    value: FieldType<TSchema[TableName], K>,
  ): this {
    this.operations.push({
      type: 'filter',
      payload: { field: field as string, operator: 'neq', value },
    })
    return this
  }

  gt<K extends keyof TSchema[TableName]>(
    field: K,
    value: FieldType<TSchema[TableName], K>,
  ): this {
    this.operations.push({
      type: 'filter',
      payload: { field: field as string, operator: 'gt', value },
    })
    return this
  }

  gte<K extends keyof TSchema[TableName]>(
    field: K,
    value: FieldType<TSchema[TableName], K>,
  ): this {
    this.operations.push({
      type: 'filter',
      payload: { field: field as string, operator: 'gte', value },
    })
    return this
  }

  lt<K extends keyof TSchema[TableName]>(
    field: K,
    value: FieldType<TSchema[TableName], K>,
  ): this {
    this.operations.push({
      type: 'filter',
      payload: { field: field as string, operator: 'lt', value },
    })
    return this
  }

  lte<K extends keyof TSchema[TableName]>(
    field: K,
    value: FieldType<TSchema[TableName], K>,
  ): this {
    this.operations.push({
      type: 'filter',
      payload: { field: field as string, operator: 'lte', value },
    })
    return this
  }

  limit(count: number): this {
    this.operations.push({ type: 'limit', payload: count })
    return this
  }

  order(field: keyof TSchema[TableName], direction: 'asc' | 'desc' = 'asc'): this {
    this.operations.push({
      type: 'order',
      payload: { field: field as string, direction },
    })
    return this
  }

  offset(count: number): this {
    this.operations.push({ type: 'offset', payload: count })
    return this
  }

  async get(): Promise<InferSchemaType<TSchema[TableName]>[]> {
    return this.executeQuery()
  }

  async single(): Promise<InferSchemaType<TSchema[TableName]> | undefined> {
    const results = await this.get()
    return results[0] || undefined
  }
}
