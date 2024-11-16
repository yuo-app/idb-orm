export type Field = 'string' | 'number' | 'boolean' | 'object' | 'array'

export interface TypeMap {
  string: string
  number: number
  boolean: boolean
  object: object
  array: any[]
}

export type SchemaField = {
  [T in Field]: {
    type: T
    required?: boolean
    default?: TypeMap[T]
    primaryKey?: boolean
    autoIncrement?: boolean
  }
}[Field]

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

export type InferValue<T extends SchemaField> = TypeMap[T['type']]

export type FieldType<T extends TableSchema, K extends keyof T> = InferValue<T[K]>

export type InferSchemaType<T extends TableSchema> = {
  [K in keyof T as T[K] extends { primaryKey: true } | { required: true } ? K : never]: InferValue<T[K]>
} & {
  [K in keyof T as T[K] extends { primaryKey: true } | { required: true } ? never : K]?: InferValue<T[K]>
}

type RequiredKeys<T extends TableSchema> = {
  [K in keyof T]: T[K] extends { required: true } ? K : never
}[keyof T]

type OptionalKeys<T extends TableSchema> = {
  [K in keyof T]: T[K] extends { required: true } | { primaryKey: true } ? never : K
}[keyof T]

export type TableInsert<T extends TableSchema> = {
  [K in RequiredKeys<T>]: InferValue<T[K]>
} & {
  [K in OptionalKeys<T> | PrimaryKeyField<T>]?: InferValue<T[K]>
}

export type Database<T extends DatabaseSchema> = {
  [TableName in keyof T]: InferSchemaType<T[TableName]>
}

export type DatabaseResults<T extends DatabaseSchema> = {
  [TableName in keyof T]: InferSchemaType<T[TableName]>[]
}
