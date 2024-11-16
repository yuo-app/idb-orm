import type { Database, DatabaseSchema, TableInsert } from '../src'
import { describe, expectTypeOf, it } from 'vitest'

// eslint-disable-next-line unused-imports/no-unused-vars
const schema = {
  users: {
    id: { type: 'string', primaryKey: true },
    name: { type: 'string', required: true },
    email: { type: 'string' },
    age: { type: 'number', required: true },
    meta: { type: 'object' },
  },
  posts: {
    id: { type: 'number', primaryKey: true, autoIncrement: true },
    title: { type: 'string', required: true },
    published: { type: 'boolean', default: false },
    tags: { type: 'array' },
  },
} satisfies DatabaseSchema

type DB = Database<typeof schema>

type User = DB['users']
type UserUpdate = Partial<TableInsert<(typeof schema)['users']>>
type UserInsert = TableInsert<(typeof schema)['users']>
type UserNameOnly = Pick<DB['users'], 'name'>
type UserWithoutMeta = Omit<DB['users'], 'meta'>
type RequiredUserFields = Required<DB['users']>

type Post = DB['posts']

describe('schema Types', () => {
  it('should infer correct table types from schema definition', () => {
    expectTypeOf<User>().toMatchTypeOf<{
      id: string
      name: string
      email?: string
      age: number
      meta?: object
    }>()

    expectTypeOf<Post>().toMatchTypeOf<{
      id: number
      title: string
      published?: boolean
      tags?: any[]
    }>()
  })

  it('should make primary key optional in insert types', () => {
    expectTypeOf<UserInsert>().toMatchTypeOf<{
      id?: string
      name: string
      email?: string
      age: number
      meta?: object
    }>()
  })

  it('should enforce required fields in insert types', () => {
    // @ts-expect-error name is required
    // eslint-disable-next-line unused-imports/no-unused-vars
    const invalid: UserInsert = { age: 25 }

    const valid: UserInsert = {
      name: 'Test',
      age: 25,
    }
    expectTypeOf(valid).toMatchTypeOf<UserInsert>()
  })

  it('should preserve correct primary key types for each table', () => {
    expectTypeOf<User['id']>().toBeString()
    expectTypeOf<Post['id']>().toBeNumber()
  })

  it('should return correct type when selecting specific fields', () => {
    expectTypeOf<UserNameOnly>().toMatchTypeOf<{
      name: string
    }>()
  })

  it('should allow partial fields in update operations', () => {
    expectTypeOf<UserUpdate>().toMatchTypeOf<{
      name?: string
      email?: string
      age?: number
      meta?: object
    }>()
  })

  it('should handle array and object field types correctly', () => {
    expectTypeOf<Post['tags']>().toEqualTypeOf<any[] | undefined>()
    expectTypeOf<DB['users']['meta']>().toEqualTypeOf<object | undefined>()
  })

  it('should not modify types based on default values', () => {
    expectTypeOf<Post['published']>().toEqualTypeOf<boolean | undefined>()
  })

  it('should support TypeScript utility types on table definitions', () => {
    expectTypeOf<UserWithoutMeta>().toMatchTypeOf<{
      id: string
      name: string
      email?: string
      age: number
    }>()

    expectTypeOf<RequiredUserFields>().toMatchTypeOf<{
      id: string
      name: string
      email: string
      age: number
      meta: object
    }>()
  })
})
