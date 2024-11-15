import type { DatabaseSchema } from './types'
import { QueryBuilder } from './builders/query'

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
