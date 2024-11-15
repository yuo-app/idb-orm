import type { DatabaseSchema, Operation } from '../types'
import { selectFields, uuid } from '../utils'

export abstract class BaseQueryBuilder<
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
            let allRecords = await this.getFilteredRecords(store)

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

            // Apply offset and limit
            const offsetOp = this.operations.find(op => op.type === 'offset')
            const limitOp = this.operations.find(op => op.type === 'limit')

            if (offsetOp)
              allRecords = allRecords.slice(offsetOp.payload)
            if (limitOp)
              allRecords = allRecords.slice(0, limitOp.payload)

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

  private ensurePrimaryKey(data: any): void {
    const pkField = Object.entries(this.tableSchema).find(
      ([_, field]) => field.primaryKey,
    )

    if (pkField) {
      const [keyName, field] = pkField
      // If primary key is string type and not provided, generate UUID
      if (field.type === 'string' && !data[keyName])
        data[keyName] = uuid()
    }
  }

  private async handleInsert(store: IDBObjectStore, data: any): Promise<any[]> {
    this.ensurePrimaryKey(data)

    return new Promise((resolve, reject) => {
      const request = store.add(data)
      request.onsuccess = () => {
        // For auto-increment fields, update the id
        if (request.result !== data.id)
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
    const records = await this.getFilteredRecords(store)

    if (records.length === 0)
      return []

    // If no id in data, apply updates to all filtered records
    if (!data.id) {
      return Promise.all(
        records.map((record) => {
          const updatedRecord = { ...record, ...data }
          return new Promise((resolve, reject) => {
            const request = store.put(updatedRecord)
            request.onsuccess = () => resolve(updatedRecord)
            request.onerror = () => reject(request.error)
          })
        }),
      )
    }

    // If id provided, verify it exists and update
    const exists = await this.exists(store, data.id)
    if (!exists)
      return []

    return new Promise((resolve, reject) => {
      // Merge with existing record to preserve unspecified fields
      const existingRecord = records.find(r => r.id === data.id)
      const updatedRecord = { ...existingRecord, ...data }
      const request = store.put(updatedRecord)
      request.onsuccess = () => resolve([updatedRecord])
      request.onerror = () => reject(request.error)
    })
  }

  private async handleUpsert(store: IDBObjectStore, data: any): Promise<any[]> {
    this.ensurePrimaryKey(data)

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
