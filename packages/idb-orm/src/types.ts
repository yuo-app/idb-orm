export type PrimitiveField = 'string' | 'number' | 'boolean'

export interface ArrayFieldSchema<T = any> {
  type: 'array'
  items: SchemaField
  required?: boolean
  default?: T[] | (() => T[])
}

export interface ObjectFieldSchema<T = any> {
  type: 'object'
  props: { [K in keyof T]: SchemaField }
  required?: boolean
  default?: T | (() => T)
}

export interface PrimitiveFieldSchema<T extends PrimitiveField> {
  type: T
  required?: boolean
  default?: TypeMap[T] | (() => TypeMap[T])
  primaryKey?: boolean
  autoIncrement?: boolean
}

export type SchemaField =
  | PrimitiveFieldSchema<PrimitiveField>
  | ArrayFieldSchema
  | ObjectFieldSchema

export interface TypeMap {
  string: string
  number: number
  boolean: boolean
}

type IsRequired<T extends SchemaField> = T extends { required: true }
  ? true
  : T extends { default: any }
    ? true
    : T extends { primaryKey: true }
      ? true
      : false

// Helper type to make properties optional based on whether they're required
type MakeOptional<T, Required extends boolean> = Required extends true ? T : T | undefined

// Make object properties optional when they're not required
type InferObjectProps<T extends ObjectFieldSchema> = {
  [K in keyof T['props'] as IsRequired<T['props'][K]> extends true ? K : never]: InferField<T['props'][K]>
} & {
  [K in keyof T['props'] as IsRequired<T['props'][K]> extends true ? never : K]?: InferField<T['props'][K]>
}

export type InferField<T extends SchemaField> = T extends PrimitiveFieldSchema<infer P>
  ? MakeOptional<TypeMap[P], IsRequired<T>>
  : T extends ArrayFieldSchema
    ? MakeOptional<InferField<T['items']>[], IsRequired<T>>
    : T extends ObjectFieldSchema
      ? MakeOptional<InferObjectProps<T>, IsRequired<T>>
      : never

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

export type InferValue<T extends SchemaField> = T extends PrimitiveFieldSchema<infer P>
  ? TypeMap[P]
  : T extends ArrayFieldSchema
    ? InferField<T['items']>[] | undefined
    : T extends ObjectFieldSchema
      ? { [K in keyof T['props']]: InferField<T['props'][K]> } | undefined
      : never

export type FieldType<T extends TableSchema, K extends keyof T> = InferValue<T[K]>

export type InferSchemaType<T extends TableSchema> = {
  [K in keyof T as T[K] extends { primaryKey: true }
    ? K
    : T[K] extends { required: true } | { default: any }
      ? K
      : never]: InferValue<T[K]>
} & {
  [K in keyof T as T[K] extends { primaryKey: true }
    ? never
    : T[K] extends { required: true } | { default: any }
      ? never
      : K]?: InferValue<T[K]>
}

type HasDefault<T extends SchemaField> = T extends { default: any } ? true : false

type RequiredKeys<T extends TableSchema> = {
  [K in keyof T]: T[K] extends { required: true }
    ? HasDefault<T[K]> extends true ? never : K
    : never
}[keyof T]

type OptionalKeys<T extends TableSchema> = {
  [K in keyof T]:
  T[K] extends { required: true }
    ? HasDefault<T[K]> extends true ? K : never
    : T[K] extends { primaryKey: true }
      ? K
      : K
}[keyof T]

export type TableInsert<T extends TableSchema> = {
  [K in RequiredKeys<T>]: InferValue<T[K]>
} & {
  [K in OptionalKeys<T>]?: InferValue<T[K]>
}

export type Database<T extends DatabaseSchema> = {
  [TableName in keyof T]: InferSchemaType<T[TableName]>
}

export type DatabaseResults<T extends DatabaseSchema> = {
  [TableName in keyof T]: InferSchemaType<T[TableName]>[]
}

export type Insert<T extends TableSchema> = TableInsert<T>
export type Update<T extends TableSchema> = Partial<TableInsert<T>>
