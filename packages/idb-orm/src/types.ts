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

export type PrimaryKeyField<T extends TableSchema> = {
  [K in keyof T]: T[K] extends { primaryKey: true } ? K : never
}[keyof T]

export interface DatabaseSchema {
  [tableName: string]: TableSchema
}

export type Operation =
  | { type: 'select', payload: string[] | undefined }
  | { type: 'insert', payload: any }
  | { type: 'update', payload: any }
  | { type: 'upsert', payload: any }
  | { type: 'delete', payload: null }
  | { type: 'filter', payload: FilterCondition }
  | { type: 'order', payload: { field: string, direction: 'asc' | 'desc' } }
  | { type: 'limit', payload: number }
  | { type: 'offset', payload: number }

export interface FilterCondition {
  field: string
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte'
  value: any
}

export type InferValue<T extends SchemaField> =
  T extends { type: 'string' } ? string :
    T extends { type: 'number' } ? number :
      T extends { type: 'boolean' } ? boolean :
        T extends { type: 'object' } ? object :
          T extends { type: 'array' } ? any[] :
            never

export type FieldType<T extends TableSchema, K extends keyof T> = InferValue<T[K]>

export type InferSchemaType<T extends TableSchema> = {
  id?: number
} & {
  [K in keyof T]: InferValue<T[K]>
}

export type Database<T extends DatabaseSchema> = {
  [TableName in keyof T]: InferSchemaType<T[TableName]>
}

type RequiredKeys<T extends TableSchema> = {
  [K in keyof T]: T[K] extends { required: true } ? K : never
}[keyof T]

type OptionalKeys<T extends TableSchema> = {
  [K in keyof T]: T[K] extends { required: true } ? never : K
}[keyof T]

export type TableInsert<T extends TableSchema> = {
  [K in RequiredKeys<T>]: InferValue<T[K]>
} & {
  [K in OptionalKeys<T> | PrimaryKeyField<T>]?: InferValue<T[K]>
}
