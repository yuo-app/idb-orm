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

// Helper type to find primary key in schema
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

class QueryBuilder<
  TSchema extends DatabaseSchema,
  TableName extends keyof TSchema,
> {
  private tableName: string
  private filters: any[] = []
  private db: IDBDatabase
  private limitCount?: number
  private tableSchema: TSchema[TableName]
  private primaryKey: PrimaryKeyField<TSchema[TableName]>

  constructor(db: IDBDatabase, table: TableName, schema: TSchema) {
    this.db = db
    this.tableName = table as string
    this.tableSchema = schema[table]
    this.primaryKey = Object.entries(this.tableSchema).find(
      ([_, field]) => field.primaryKey,
    )?.[0] as PrimaryKeyField<TSchema[TableName]>
  }

  private generateId(): string | number {
    const pkField = this.tableSchema[this.primaryKey]
    if (pkField.type === 'string')
      return uuid()

    return 0
  }

  eq(field: keyof TSchema[TableName], value: TSchema[TableName][typeof field]) {
    this.filters.push({ field, operator: '=', value })
    return this
  }

  neq(field: keyof TSchema[TableName], value: TSchema[TableName][typeof field]) {
    this.filters.push({ field, operator: '!=', value })
    return this
  }

  gt(field: keyof TSchema[TableName], value: TSchema[TableName][typeof field]) {
    this.filters.push({ field, operator: '>', value })
    return this
  }

  gte(field: keyof TSchema[TableName], value: TSchema[TableName][typeof field]) {
    this.filters.push({ field, operator: '>=', value })
    return this
  }

  lt(field: keyof TSchema[TableName], value: TSchema[TableName][typeof field]) {
    this.filters.push({ field, operator: '<', value })
    return this
  }

  lte(field: keyof TSchema[TableName], value: TSchema[TableName][typeof field]) {
    this.filters.push({ field, operator: '<=', value })
    return this
  }

  limit(count: number) {
    this.limitCount = count
    return this
  }

  async single(): Promise<InferSchemaType<TSchema[TableName]> | null> {
    const results = await this.select()
    return results[0] || null
  }

  async select<Fields extends (keyof TSchema[TableName])[]>(
    ...fields: Fields
  ): Promise<Array<InferSchemaType<TSchema[TableName]>>> {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(this.tableName, 'readonly')
      const store = transaction.objectStore(this.tableName)
      const request = store.getAll()

      request.onsuccess = () => {
        let results = request.result

        results = results.filter((item) => {
          return this.filters.every((filter) => {
            switch (filter.operator) {
              case '=': return item[filter.field] === filter.value
              case '!=': return item[filter.field] !== filter.value
              case '>': return item[filter.field] > filter.value
              case '<': return item[filter.field] < filter.value
              case '>=': return item[filter.field] >= filter.value
              case '<=': return item[filter.field] <= filter.value
              default: return true
            }
          })
        })

        if (fields.length > 0) {
          results = results.map((item) => {
            const selected: any = {}
            fields.forEach((field) => {
              selected[field] = item[field]
            })
            return selected
          })
        }

        if (this.limitCount !== undefined)
          results = results.slice(0, this.limitCount)

        resolve(results)
      }

      request.onerror = () => reject(request.error)
    })
  }

  private async exists(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(this.tableName, 'readonly')
      const store = transaction.objectStore(this.tableName)
      const request = store.get(id)

      request.onsuccess = () => resolve(!!request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async insert(
    data: TableInsert<TSchema[TableName]>,
  ): Promise<QueryBuilder<TSchema, TableName>> {
    const newData = { ...data }
    if (!newData[this.primaryKey] && !this.tableSchema[this.primaryKey].autoIncrement) {
      const id = this.generateId()
      newData[this.primaryKey] = id as any
    }

    const transaction = this.db.transaction(this.tableName, 'readwrite')
    const store = transaction.objectStore(this.tableName)

    return new Promise((resolve, reject) => {
      const request = store.add(newData)
      request.onsuccess = () => resolve(this)
      request.onerror = () => reject(request.error)
    })
  }

  async update(
    data: Partial<TableInsert<TSchema[TableName]>> & { id: number },
  ): Promise<QueryBuilder<TSchema, TableName>> {
    const exists = await this.exists(data.id)
    if (!exists)
      throw new Error('Record not found')

    const transaction = this.db.transaction(this.tableName, 'readwrite')
    const store = transaction.objectStore(this.tableName)

    return new Promise((resolve, reject) => {
      const request = store.put(data)
      request.onsuccess = () => resolve(this)
      request.onerror = () => reject(request.error)
    })
  }

  async upsert(
    data: TableInsert<TSchema[TableName]> & { id?: number },
  ): Promise<QueryBuilder<TSchema, TableName>> {
    const transaction = this.db.transaction(this.tableName, 'readwrite')
    const store = transaction.objectStore(this.tableName)

    return new Promise((resolve, reject) => {
      const request = store.put(data)
      request.onsuccess = () => resolve(this)
      request.onerror = () => reject(request.error)
    })
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

  from<TableName extends keyof TSchema>(
    name: TableName,
  ): QueryBuilder<TSchema, TableName> {
    if (!this.db)
      throw new Error('Database not connected')
    return new QueryBuilder<TSchema, TableName>(this.db, name, this.schema)
  }
}
