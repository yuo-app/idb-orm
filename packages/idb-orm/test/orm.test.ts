import type { Database } from '../src/orm'
import type { testSchema } from './utils'
import { afterEach, beforeEach, describe, expect, expectTypeOf, it } from 'vitest'
import { createTestDb } from './utils'

type TestDb = Database<typeof testSchema>
type User = TestDb['users']

describe('idbOrm', () => {
  let db: ReturnType<typeof createTestDb>

  beforeEach(async () => {
    db = createTestDb()
    await db.connect()
  })

  afterEach(async () => {
    if (db)
      db.disconnect()

    indexedDB.deleteDatabase('test-db')
  })

  it('connects to database', async () => {
    expect(db).toBeDefined()
  })

  it('inserts a record', async () => {
    const user = await db.from('users').insert({
      name: 'Test User',
      age: 25,
    })

    expect(user.id).toBeDefined()
    expect(user.name).toBe('Test User')
  })

  it('selects records', async () => {
    await db.from('users').insert({
      name: 'Test User',
      admin: true,
      age: 25,
    })

    const users = await db.from('users').select()
    expect(users).toHaveLength(1)
    expect(users[0].name).toBe('Test User')
  })

  it('filters with eq', async () => {
    await db.from('users').insert({
      name: 'User 1',
      age: 20,
    })
    await db.from('users').insert({
      name: 'User 2',
      age: 30,
    })

    const users = await db.from('users').eq('age', 20).select()
    expect(users).toHaveLength(1)
    expect(users[0].name).toBe('User 1')
  })

  it('updates a record', async () => {
    const user = await db.from('users').insert({
      name: 'Old Name',
      age: 25,
    })

    const updated = await db.from('users').update({
      id: user.id,
      name: 'New Name',
    })

    expect(updated.name).toBe('New Name')
  })

  it('upserts a record', async () => {
    const user = await db.from('users').upsert({
      name: 'Test User',
      age: 25,
    })

    const upserted = await db.from('users').upsert({
      id: user.id,
      name: 'Updated User',
      age: 25,
    })

    expect(upserted.name).toBe('Updated User')
  })

  it('selects specific fields', async () => {
    await db.from('users').insert({
      name: 'Test User',
      age: 25,
    })

    const users = await db.from('users').select('name', 'age')
    expect(users[0]).toEqual({
      name: 'Test User',
      age: 25,
    })
  })

  it('limits results', async () => {
    await db.from('users').insert({
      name: 'User 1',
      age: 20,
    })
    await db.from('users').insert({
      name: 'User 2',
      age: 30,
    })

    const users = await db.from('users').limit(1).select()
    expect(users).toHaveLength(1)
    expectTypeOf(users).toEqualTypeOf<User[]>()
  })

  it('returns single record', async () => {
    await db.from('users').insert({
      name: 'Test User',
      age: 25,
    })

    const user = await db.from('users').single()
    expect(user).toBeDefined()
    expect(user?.name).toBe('Test User')
    expectTypeOf(user).toEqualTypeOf<User | null>()
  })

  it('comparison operators', async () => {
    await db.from('users').insert({
      name: 'Young User',
      age: 20,
    })
    await db.from('users').insert({
      name: 'Old User',
      age: 30,
    })

    const young = await db.from('users').lt('age', 25).select()
    expect(young).toHaveLength(1)
    expect(young[0].name).toBe('Young User')

    const old = await db.from('users').gte('age', 30).select()
    expect(old).toHaveLength(1)
    expect(old[0].name).toBe('Old User')
  })

  it('deletes records', async () => {
    await db.from('users').insert({
      name: 'User 1',
      age: 20,
    })
    await db.from('users').insert({
      name: 'User 2',
      age: 30,
    })

    await (await db.from('users').eq('name', 'User 1')).delete()

    const remaining = await db.from('users').select()
    expect(remaining).toHaveLength(1)
    expect(remaining[0].name).toBe('User 2')
  })

  it('deletes all records when no filter', async () => {
    await db.from('users').insert({
      name: 'User 1',
      age: 20,
    })
    await db.from('users').insert({

      name: 'User 2',
      age: 30,
    })

    await db.from('users').delete()

    const remaining = await db.from('users').select()
    expect(remaining).toHaveLength(0)
  })
})
