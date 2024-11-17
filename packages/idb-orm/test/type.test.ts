import type { Database, DatabaseSchema, Insert, Update } from '../src'
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
type UserUpdate = Update<typeof schema['users']>
type UserInsert = Insert<typeof schema['users']>
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

  it('should correctly handle type inference for fields with default values', () => {
    expectTypeOf<Post['published']>().toEqualTypeOf<boolean>()
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

// eslint-disable-next-line unused-imports/no-unused-vars
const extendedSchema = {
  users: {
    id: { type: 'string', primaryKey: true },
    username: { type: 'string', required: true },
    email: { type: 'string', default: 'example@example.com' },
    age: { type: 'number' },
    isActive: { type: 'boolean', default: true },
    profile: { type: 'object' },
  },
  articles: {
    id: { type: 'number', primaryKey: true, autoIncrement: true },
    title: { type: 'string', required: true },
    content: { type: 'string' },
    publishedAt: { type: 'number', default: Date.now() },
    tags: { type: 'array' },
  },
} satisfies DatabaseSchema

type ExtendedDB = Database<typeof extendedSchema>

type ExtendedUser = ExtendedDB['users']
type ExtendedUserInsert = Insert<typeof extendedSchema['users']>
type ExtendedUserUpdate = Update<typeof extendedSchema['users']>

type Article = ExtendedDB['articles']
type ArticleInsert = Insert<typeof extendedSchema['articles']>
type ArticleUpdate = Update<typeof extendedSchema['articles']>

describe('extended schema Types', () => {
  it('should infer correct ExtendedUser type', () => {
    expectTypeOf<ExtendedUser>().toMatchTypeOf<{
      id: string
      username: string
      email: string
      isActive: boolean
      age?: number
      profile?: object
    }>()
  })

  it('should infer correct ExtendedUserInsert type', () => {
    expectTypeOf<ExtendedUserInsert>().toMatchTypeOf<{
      id?: string
      username: string
      email?: string
      isActive?: boolean
      age?: number
      profile?: object
    }>()
  })

  it('should enforce required fields and defaults in ExtendedUserInsert', () => {
    // @ts-expect-error: 'username' is required
    // eslint-disable-next-line unused-imports/no-unused-vars
    const invalidInsert: ExtendedUserInsert = {
      email: 'test@example.com',
      isActive: false,
    }

    const validInsert: ExtendedUserInsert = {
      username: 'testuser',
      email: 'test@example.com',
      isActive: false,
    }
    expectTypeOf(validInsert).toMatchTypeOf<ExtendedUserInsert>()
  })

  it('should infer correct ExtendedUserUpdate type', () => {
    expectTypeOf<ExtendedUserUpdate>().toMatchTypeOf<{
      id?: string
      username?: string
      email?: string
      isActive?: boolean
      age?: number
      profile?: object
    }>()
  })

  it('should allow partial updates in ExtendedUserUpdate', () => {
    const partialUpdate: ExtendedUserUpdate = {
      email: 'newemail@example.com',
    }
    expectTypeOf(partialUpdate).toMatchTypeOf<ExtendedUserUpdate>()
  })

  it('should infer correct Article type', () => {
    expectTypeOf<Article>().toMatchTypeOf<{
      id: number
      title: string
      publishedAt: number
      content?: string
      tags?: any[]
    }>()
  })

  it('should infer correct ArticleInsert type', () => {
    expectTypeOf<ArticleInsert>().toMatchTypeOf<{
      id?: number
      title: string
      publishedAt?: number
      content?: string
      tags?: any[]
    }>()
  })

  it('should enforce required fields and defaults in ArticleInsert', () => {
    // @ts-expect-error: 'title' is required
    // eslint-disable-next-line unused-imports/no-unused-vars
    const invalidArticleInsert: ArticleInsert = {
      publishedAt: Date.now(),
    }

    const validArticleInsert: ArticleInsert = {
      title: 'Sample Article',
      publishedAt: Date.now(),
    }
    expectTypeOf(validArticleInsert).toMatchTypeOf<ArticleInsert>()
  })

  it('should infer correct ArticleUpdate type', () => {
    expectTypeOf<ArticleUpdate>().toMatchTypeOf<{
      id?: number
      title?: string
      publishedAt?: number
      content?: string
      tags?: any[]
    }>()
  })

  it('should handle optional fields with no defaults', () => {
    const userWithOptional: ExtendedUserInsert = {
      username: 'optionalUser',
      email: 'test@example.com',
      age: 25,
      isActive: false,
    }
    expectTypeOf(userWithOptional).toMatchTypeOf<ExtendedUserInsert>()
  })

  it('should treat fields with defaults as required in Insert', () => {
    // 'isActive' has a default and should be required
    expectTypeOf<ExtendedUserInsert>().toHaveProperty('isActive').not.toBeUndefined()
    // 'publishedAt' has a default and should be required
    expectTypeOf<ArticleInsert>().toHaveProperty('publishedAt').not.toBeUndefined()
  })

  it('should allow all fields to be optional in Update types', () => {
    const fullUserUpdate: ExtendedUserUpdate = {
      id: 'user-id',
      username: 'updatedUser',
      email: 'updated@example.com',
      isActive: false,
      age: 28,
      profile: { bio: 'Updated bio' },
    }
    expectTypeOf(fullUserUpdate).toMatchTypeOf<ExtendedUserUpdate>()

    const partialArticleUpdate: ArticleUpdate = {
      content: 'Updated content',
    }
    expectTypeOf(partialArticleUpdate).toMatchTypeOf<ArticleUpdate>()
  })

  it('should enforce field types in Insert and Update', () => {
    // eslint-disable-next-line unused-imports/no-unused-vars
    const invalidAgeInsert: ExtendedUserInsert = {
      username: 'invalidAgeUser',
      // @ts-expect-error: 'age' should be a number
      age: 'twenty-five',
    }

    // eslint-disable-next-line unused-imports/no-unused-vars
    const invalidTagsUpdate: ArticleUpdate = {
      // @ts-expect-error: 'tags' should be an array
      tags: 'typescript',
    }
  })
})
