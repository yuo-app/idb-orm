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
    const user = await db
      .from('users')
      .insert({
        name: 'Test User',
        age: 25,
      })
      .get()

    expect(user[0].id).toBeDefined()
    expect(user[0].name).toBe('Test User')
  })

  it('selects records', async () => {
    await db
      .from('users')
      .insert({
        name: 'Test User',
        admin: true,
        age: 25,
      })
      .get()

    const users = await db
      .from('users')
      .select()
      .get()

    expect(users).toHaveLength(1)
    expect(users[0].name).toBe('Test User')
  })

  it('filters with eq', async () => {
    await db
      .from('users')
      .insert({ name: 'User 1', age: 20 })
      .get()
    await db
      .from('users')
      .insert({ name: 'User 2', age: 30 })
      .get()

    const users = await db
      .from('users')
      .select()
      .eq('age', 20)
      .get()

    expect(users).toHaveLength(1)
    expect(users[0].name).toBe('User 1')
  })

  it('updates a record', async () => {
    const user = await db
      .from('users')
      .insert({ name: 'Old Name', age: 25 })
      .get()

    const updated = await db
      .from('users')
      .update({ id: user[0].id, name: 'New Name' })
      .get()

    expect(updated).toHaveLength(1)
    expect(updated[0].name).toBe('New Name')
  })

  it('upserts a record', async () => {
    const user = await db
      .from('users')
      .upsert({ name: 'Test User', age: 25 })
      .get()

    const upserted = await db
      .from('users')
      .upsert({ id: user[0].id, name: 'Updated User', age: 25 })
      .get()

    expect(upserted).toHaveLength(1)
    expect(upserted[0].name).toBe('Updated User')
  })

  it('selects specific fields', async () => {
    await db
      .from('users')
      .insert({ name: 'Test User', age: 25 })
      .get()

    const users = await db
      .from('users')
      .select('name', 'age')
      .get()

    expect(users[0]).toEqual({ name: 'Test User', age: 25 })
  })

  it('limits results', async () => {
    await db
      .from('users')
      .insert({ name: 'User 1', age: 20 })
      .get()
    await db
      .from('users')
      .insert({ name: 'User 2', age: 30 })
      .get()

    const users = await db
      .from('users')
      .select()
      .limit(1)
      .get()

    expect(users).toHaveLength(1)
    expect(users[0].name).toBe('User 1')
    expectTypeOf(users).toEqualTypeOf<User[]>()
  })

  it('offsets results', async () => {
    await db
      .from('users')
      .insert({ name: 'User 1', age: 20 })
      .get()
    await db
      .from('users')
      .insert({ name: 'User 2', age: 30 })
      .get()

    const users = await db
      .from('users')
      .select()
      .offset(1)
      .get()

    expect(users).toHaveLength(1)
    expect(users[0].name).toBe('User 2')
  })

  it('returns single record', async () => {
    await db
      .from('users')
      .insert({ name: 'Test User', age: 25 })
      .get()

    const user = await db
      .from('users')
      .select()
      .single()

    expect(user).toBeDefined()
    expect(user?.name).toBe('Test User')
    expectTypeOf(user).toEqualTypeOf<User | null>()
  })

  it('comparison operators', async () => {
    await db
      .from('users')
      .insert({ name: 'Young User', age: 20 })
      .get()
    await db
      .from('users')
      .insert({ name: 'Old User', age: 30 })
      .get()

    const young = await db
      .from('users')
      .select()
      .lt('age', 25)
      .get()

    expect(young).toHaveLength(1)
    expect(young[0].name).toBe('Young User')

    const old = await db
      .from('users')
      .select()
      .gte('age', 30)
      .get()

    expect(old).toHaveLength(1)
    expect(old[0].name).toBe('Old User')
  })

  it('deletes records', async () => {
    await db
      .from('users')
      .insert({ name: 'User 1', age: 20 })
      .get()
    await db
      .from('users')
      .insert({ name: 'User 2', age: 30 })
      .get()

    await db
      .from('users')
      .delete()
      .eq('name', 'User 1')
      .get()

    const remaining = await db
      .from('users')
      .select()
      .get()

    expect(remaining).toHaveLength(1)
    expect(remaining[0].name).toBe('User 2')
  })

  it('deletes all records when no filter', async () => {
    await db
      .from('users')
      .insert({ name: 'User 1', age: 20 })
      .get()
    await db
      .from('users')
      .insert({ name: 'User 2', age: 30 })
      .get()

    await db
      .from('users')
      .delete()
      .get()

    const remaining = await db
      .from('users')
      .select()
      .get()

    expect(remaining).toHaveLength(0)
  })

  it('returns an empty array when deleting non-existing records', async () => {
    const deleted = await db
      .from('users')
      .delete()
      .eq('name', 'User 1')
      .get()

    expect(deleted).toHaveLength(0)
  })

  it('returns an empty array when updating non-existing records', async () => {
    const updated = await db
      .from('users')
      .update({ id: 1, name: 'User 1' })
      .get()

    expect(updated).toHaveLength(0)
  })

  it('throws error when inserting already existing id', async () => {
    await db
      .from('users')
      .insert({ id: 1, name: 'User 1', age: 20 })
      .get()

    await expect(
      db.from('users')
        .insert({ id: 1, name: 'User 2', age: 30 })
        .get(),
    ).rejects.toThrowError()
  })
})
