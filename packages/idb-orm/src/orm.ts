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

class QueryBuilder<T> {
  private table: string
  private filters: any[] = []
  private selectedFields: string[] = []
  private db: IDBDatabase

  constructor(db: IDBDatabase, table: string) {
    this.db = db
    this.table = table
  }

  from(table: string) {
    this.table = table
    return this
  }

  select(...fields: string[]) {
    this.selectedFields = fields
    return this
  }

  where(field: keyof T, operator: '=' | '>' | '<' | '>=' | '<=', value: any) {
    this.filters.push({ field, operator, value })
    return this
  }

  async get(): Promise<T[]> {
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

  async insert(data: Partial<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(this.table, 'readwrite')
      const store = transaction.objectStore(this.table)
      const request = store.add(data)

      request.onsuccess = () => resolve(data as T)
      request.onerror = () => reject(request.error)
    })
  }
}

export class IdbOrm {
  private dbName: string
  private version: number
  private schema: DatabaseSchema
  private db?: IDBDatabase

  constructor(dbName: string, version: number, schema: DatabaseSchema) {
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

  table<T>(name: string): QueryBuilder<T> {
    if (!this.db)
      throw new Error('Database not connected')
    return new QueryBuilder<T>(this.db, name)
  }
}
