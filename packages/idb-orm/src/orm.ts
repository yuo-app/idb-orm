export interface SchemaField {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  required?: boolean
  defaultValue?: any
}

export interface TableSchema {
  [key: string]: SchemaField
}

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
  [K in OptionalKeys<T>]?: InferValue<T[K]>
}

export type Database<T extends DatabaseSchema> = {
  [TableName in keyof T]: InferSchemaType<T[TableName]>
}

class QueryBuilder<
  TSchema extends DatabaseSchema,
  TableName extends keyof TSchema,
> {
  private table: string
  private filters: any[] = []
  private selectedFields: string[] = []
  private db: IDBDatabase

  constructor(db: IDBDatabase, table: TableName) {
    this.db = db
    this.table = table as string
  }

  from(table: TableName) {
    this.table = table as string
    return this
  }

  select<Fields extends (keyof TSchema[TableName])[]>(...fields: Fields) {
    this.selectedFields = fields as string[]
    return this as QueryBuilder<TSchema, TableName>
  }

  where(
    field: keyof TSchema[TableName],
    operator: '=' | '>' | '<' | '>=' | '<=',
    value: TSchema[TableName][typeof field],
  ) {
    this.filters.push({ field, operator, value })
    return this
  }

  async get(): Promise<Array<InferSchemaType<TSchema[TableName]>>> {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(this.table, 'readonly')
      const store = transaction.objectStore(this.table)
      const request = store.getAll()

      request.onsuccess = () => {
        let results = request.result

        results = results.filter((item) => {
          return this.filters.every((filter) => {
            switch (filter.operator) {
              case '=': return item[filter.field] === filter.value
              case '>': return item[filter.field] > filter.value
              case '<': return item[filter.field] < filter.value
              case '>=': return item[filter.field] >= filter.value
              case '<=': return item[filter.field] <= filter.value
              default: return true
            }
          })
        })

        if (this.selectedFields.length > 0) {
          results = results.map((item) => {
            const selected: any = {}
            this.selectedFields.forEach((field) => {
              selected[field] = item[field]
            })
            return selected
          })
        }

        resolve(results)
      }

      request.onerror = () => reject(request.error)
    })
  }

  async insert(data: TableInsert<TSchema[TableName]>): Promise<InferSchemaType<TSchema[TableName]>> {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(this.table, 'readwrite')
      const store = transaction.objectStore(this.table)
      const request = store.add(data)

      request.onsuccess = () => {
        resolve(data as InferSchemaType<TSchema[TableName]>)
      }
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

        Object.entries(this.schema).forEach(([tableName, _tableSchema]) => {
          if (!db.objectStoreNames.contains(tableName)) {
            db.createObjectStore(tableName, {
              keyPath: 'id',
              autoIncrement: true,
            })
          }
        })
      }
    })
  }

  table<TableName extends keyof TSchema>(
    name: TableName,
  ): QueryBuilder<TSchema, TableName> {
    if (!this.db)
      throw new Error('Database not connected')
    return new QueryBuilder<TSchema, TableName>(this.db, name)
  }
}
