import type { DatabaseResults, DatabaseSchema, PrimitiveFieldSchema } from './types'
import { QueryBuilder } from './builders/query'
import { isPrimaryKeyField } from './utils'

export class IdbOrm<TSchema extends DatabaseSchema> {
  public dbName: string
  public version: number
  public connected = false
  private schema: TSchema
  private db?: IDBDatabase

  constructor(dbName: string, version: number, schema: TSchema) {
    this.dbName = dbName
    this.version = version
    this.schema = schema
  }

  async connect(): Promise<void> {
    if (this.connected)
      return

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)

      request.onsuccess = () => {
        this.db = request.result
        this.connected = true
        resolve()
      }

      request.onupgradeneeded = () => {
        const db = request.result

        Object.entries(this.schema).forEach(([tableName, tableSchema]) => {
          if (!db.objectStoreNames.contains(tableName)) {
            const pkField = Object.entries(tableSchema).find(
              ([_, field]) => isPrimaryKeyField(field) && field.primaryKey,
            )

            if (!pkField)
              throw new Error(`Table ${tableName} must have a primary key`)

            const [keyPath, field] = pkField
            db.createObjectStore(tableName, {
              keyPath,
              autoIncrement: (field as PrimitiveFieldSchema<any>).autoIncrement ?? false,
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
      this.connected = false
    }
  }

  from<TableName extends keyof TSchema>(
    name: TableName,
  ): QueryBuilder<TSchema, TableName> {
    if (!this.connected)
      throw new Error('Database not connected')
    return new QueryBuilder(this.db!, name, this.schema)
  }

  async getAll(): Promise<DatabaseResults<TSchema>> {
    if (!this.connected)
      throw new Error('Database not connected')

    return new Promise((resolve, reject) => {
      if (!this.db)
        return

      const tableNames = Array.from(this.db.objectStoreNames)
      const transaction = this.db.transaction(tableNames, 'readonly')
      const result = {} as DatabaseResults<TSchema>

      tableNames.forEach((tableName) => {
        const store = transaction.objectStore(tableName)
        const request = store.getAll()

        request.onsuccess = () => {
          result[tableName as keyof TSchema] = request.result
        }
        request.onerror = () => reject(request.error)
      })

      transaction.oncomplete = () => resolve(result)
      transaction.onerror = () => reject(transaction.error)
    })
  }

  getTableNames(): string[] {
    if (!this.connected)
      throw new Error('Database not connected')
    return Array.from(this.db!.objectStoreNames)
  }

  async clearAll(): Promise<void> {
    if (!this.connected || !this.db)
      throw new Error('Database not connected')

    const tableNames = this.getTableNames()
    const transaction = this.db.transaction(tableNames, 'readwrite')

    await Promise.all(
      tableNames.map(tableName => new Promise<void>((resolve, reject) => {
        const store = transaction.objectStore(tableName)
        const request = store.clear()
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })),
    )
  }

  async deleteAll(): Promise<void> {
    this.disconnect()
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase(this.dbName)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
}
