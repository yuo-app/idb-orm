// from: https://github.com/supabase/supabase-js/blob/4c7f57197c0109b9393080db5971543347a6397a/src/lib/helpers.ts#L4-L10
export function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export interface SchemaField {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  required?: boolean
  defaultValue?: any
  primaryKey?: boolean
  autoIncrement?: boolean
}

export interface TableSchema {
  [key: string]: SchemaField
}

type PrimaryKeyField<T extends TableSchema> = {
  [K in keyof T]: T[K] extends { primaryKey: true } ? K : never
}[keyof T]

export interface DatabaseSchema {
  [tableName: string]: TableSchema
}

type InferValue<T extends SchemaField> =
  T extends { type: 'string' } ? string :
    T extends { type: 'number' } ? number :
      T extends { type: 'boolean' } ? boolean :
        T extends { type: 'object' } ? object :
          T extends { type: 'array' } ? any[] :
            never

type FieldType<T extends TableSchema, K extends keyof T> = InferValue<T[K]>

type InferSchemaType<T extends TableSchema> = {
  id?: number
} & {
  [K in keyof T]: InferValue<T[K]>
}

type RequiredKeys<T extends TableSchema> = {
  [K in keyof T]: T[K] extends { required: true } ? K : never
}[keyof T]

type OptionalKeys<T extends TableSchema> = {
  [K in keyof T]: T[K] extends { required: true } ? never : K
}[keyof T]

type TableInsert<T extends TableSchema> = {
  [K in RequiredKeys<T>]: InferValue<T[K]>
} & {
  [K in OptionalKeys<T> | PrimaryKeyField<T>]?: InferValue<T[K]>
}

export type Database<T extends DatabaseSchema> = {
  [TableName in keyof T]: InferSchemaType<T[TableName]>
}

function selectFields<T extends object, K extends keyof T>(
  obj: T,
  fields: K[],
): T extends object ? T : Pick<T, K> {
  if (fields.length === 0)
    return obj as any
  return fields.reduce((acc, field) => {
    acc[field] = obj[field]
    return acc
  }, {} as Pick<T, K>) as any
}

type Operation =
  | { type: 'select', payload: string[] | undefined }
  | { type: 'insert', payload: any }
  | { type: 'update', payload: any }
  | { type: 'upsert', payload: any }
  | { type: 'delete', payload: null }
  | { type: 'filter', payload: FilterCondition }
  | { type: 'order', payload: { field: string, direction: 'asc' | 'desc' } }
  | { type: 'limit', payload: number }
  | { type: 'offset', payload: number }

interface FilterCondition {
  field: string
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte'
  value: any
}

abstract class BaseQueryBuilder<
  TSchema extends DatabaseSchema,
  TableName extends keyof TSchema,
  TResult = any,
> {
  protected operations: Operation[] = []
  protected db: IDBDatabase
  protected tableName: string
  protected schema: TSchema
  protected tableSchema: TSchema[TableName]

  constructor(db: IDBDatabase, table: TableName, schema: TSchema) {
    this.db = db
    this.tableName = table as string
    this.schema = schema
    this.tableSchema = schema[table]
  }

  protected async executeQuery(): Promise<TResult> {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(this.tableName, 'readwrite')
      const store = transaction.objectStore(this.tableName)

      let results: any[] = []
      let completed = false

      const processResults = async () => {
        try {
          const modifyOp = this.operations.find(op =>
            ['insert', 'update', 'upsert', 'delete'].includes(op.type),
          )

          // Handle data modifications first
          if (modifyOp) {
            switch (modifyOp.type) {
              case 'insert':
                results = await this.handleInsert(store, modifyOp.payload)
                break
              case 'update':
                results = await this.handleUpdate(store, modifyOp.payload)
                break
              case 'upsert':
                results = await this.handleUpsert(store, modifyOp.payload)
                break
              case 'delete':
                await this.handleDelete(store)
                results = []
                break
            }
          }

          // If no modifications or select requested, get filtered results
          const selectOp = this.operations.find(op => op.type === 'select')
          if (!modifyOp || selectOp) {
            const allRecords = await this.getFilteredRecords(store)

            // Apply sorting
            const orderOp = this.operations.find(op => op.type === 'order')
            if (orderOp) {
              allRecords.sort((a, b) => {
                const { field, direction } = orderOp.payload
                return direction === 'asc'
                  ? a[field] > b[field] ? 1 : -1
                  : a[field] < b[field] ? 1 : -1
              })
            }

            // Apply limit
            const limitOp = this.operations.find(op => op.type === 'limit')
            if (limitOp)
              allRecords.splice(limitOp.payload)

            // Apply offset
            const offsetOp = this.operations.find(op => op.type === 'offset')
            if (offsetOp)
              allRecords.splice(0, offsetOp.payload)

            // Select specific fields if requested
            if (selectOp?.payload)
              results = allRecords.map(r => selectFields(r, selectOp.payload as string[]))
            else
              results = allRecords
          }

          completed = true
        }
        catch (error) {
          reject(error)
        }
      }

      processResults()

      transaction.onerror = () => reject(transaction.error)
      transaction.oncomplete = () => {
        if (completed)
          resolve(results as TResult)
        else
          reject(new Error('Transaction completed before processing finished'))
      }
    })
  }

  private async handleInsert(store: IDBObjectStore, data: any): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const request = store.add(data)
      request.onsuccess = () => {
        data.id = request.result
        resolve([data])
      }
      request.onerror = () => reject(request.error)
    })
  }

  private async exists(store: IDBObjectStore, id: any): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const request = store.get(id)
      request.onsuccess = () => resolve(!!request.result)
      request.onerror = () => reject(request.error)
    })
  }

  private async handleUpdate(store: IDBObjectStore, data: any): Promise<any[]> {
    if (!data.id)
      throw new Error('Update requires an id')

    const exists = await this.exists(store, data.id)
    if (!exists)
      return []

    return new Promise((resolve, reject) => {
      const request = store.put(data)
      request.onsuccess = () => resolve([data])
      request.onerror = () => reject(request.error)
    })
  }

  private async handleUpsert(store: IDBObjectStore, data: any): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const request = store.put(data)
      request.onsuccess = () => resolve([data])
      request.onerror = () => reject(request.error)
    })
  }

  private async handleDelete(store: IDBObjectStore): Promise<void> {
    const records = await this.getFilteredRecords(store)
    return Promise.all(
      records.map(record =>
        new Promise<void>((resolve, reject) => {
          const request = store.delete(record.id)
          request.onsuccess = () => resolve()
          request.onerror = () => reject(request.error)
        }),
      ),
    ).then(() => undefined)
  }

  private async getFilteredRecords(store: IDBObjectStore): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => {
        let results = request.result

        const filterOps = this.operations.filter(op => op.type === 'filter')
        if (filterOps.length) {
          results = results.filter(record =>
            filterOps.every((op) => {
              const { field, operator, value } = op.payload
              switch (operator) {
                case 'eq': return record[field] === value
                case 'neq': return record[field] !== value
                case 'gt': return record[field] > value
                case 'gte': return record[field] >= value
                case 'lt': return record[field] < value
                case 'lte': return record[field] <= value
                default: return true
              }
            }),
          )
        }

        resolve(results)
      }
      request.onerror = () => reject(request.error)
    })
  }
}

class QueryBuilder<
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

class FilterBuilder<
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

  async single(): Promise<InferSchemaType<TSchema[TableName]> | null> {
    const results = await this.get()
    return results[0] || null
  }
}

export class IdbOrm<TSchema extends DatabaseSchema> {
  private dbName: string
  private version: number
  private schema: TSchema
  private db?: IDBDatabase

  constructor(dbName: string, version: number, schema: TSchema) {
    this.dbName = dbName
    this.version = version
    this.schema = schema
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)

      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = () => {
        const db = request.result

        Object.entries(this.schema).forEach(([tableName, tableSchema]) => {
          if (!db.objectStoreNames.contains(tableName)) {
            const pkField = Object.entries(tableSchema).find(
              ([_, field]) => field.primaryKey,
            )

            if (!pkField)
              throw new Error(`Table ${tableName} must have a primary key`)

            const [keyPath, field] = pkField
            db.createObjectStore(tableName, {
              keyPath,
              autoIncrement: field.autoIncrement ?? false,
            })
          }
        })
      }
    })
  }

  disconnect(): void {
    if (this.db) {
      this.db.close()
      this.db = undefined
    }
  }

  from<TableName extends keyof TSchema>(
    name: TableName,
  ): QueryBuilder<TSchema, TableName> {
    if (!this.db)
      throw new Error('Database not connected')
    return new QueryBuilder(this.db, name, this.schema)
  }
}
