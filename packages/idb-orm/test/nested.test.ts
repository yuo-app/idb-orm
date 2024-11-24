import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { type Database, type DatabaseSchema, IdbOrm } from '../src'

const nestedSchema = {
  items: {
    id: { type: 'string', primaryKey: true },
    name: { type: 'string', required: true },
    metadata: {
      type: 'object',
      props: {
        createdBy: { type: 'string' },
        version: { type: 'number' },
        nested: {
          type: 'object',
          props: {
            deep: {
              type: 'object',
              props: {
                value: { type: 'boolean' },
              },
            },
          },
        },
      },
      default: {},
    },
    tags: {
      type: 'array',
      items: { type: 'string' },
      default: [],
    },
    attributes: {
      type: 'object',
      props: {
        color: { type: 'string' },
        size: { type: 'string' },
        material: { type: 'string' },
      },
      default: {
        color: 'default',
        size: 'medium',
      },
    },
    variants: {
      type: 'array',
      items: {
        type: 'object',
        props: {
          name: { type: 'string' },
          stock: { type: 'number' },
        },
      },
      default: () => [{
        name: 'default',
        stock: 0,
      }],
    },
  },
} satisfies DatabaseSchema

type DB = Database<typeof nestedSchema>
type Item = DB['items']

describe('nested fields', () => {
  let db: IdbOrm<typeof nestedSchema>

  beforeEach(async () => {
    db = new IdbOrm('nested-test-db', 1, nestedSchema)
    await db.connect()
  })

  afterEach(() => {
    db.disconnect()
    indexedDB.deleteDatabase('nested-test-db')
  })

  it('handles nested object fields', async () => {
    const item = await db.from('items')
      .insert({
        name: 'Test Item',
        metadata: {
          createdBy: 'test',
          version: 1,
          nested: {
            deep: {
              value: true,
            },
          },
        },
      })
      .single()

    expect(item).toBeDefined()
    expect(item?.metadata.createdBy).toBe('test')
    expect(item?.metadata.nested.deep.value).toBe(true)
  })

  it('handles nested array fields', async () => {
    const item = await db.from('items')
      .insert({
        name: 'Test Item',
        tags: ['test', 'nested'],
        variants: [
          { name: 'small', stock: 5 },
          { name: 'large', stock: 3 },
        ],
      })
      .single()

    expect(item).toBeDefined()
    expect(item?.tags).toHaveLength(2)
    expect(item?.variants).toHaveLength(2)
    expect(item?.variants[0].stock).toBe(5)
  })

  it('updates nested fields', async () => {
    const original = await db.from('items')
      .insert({
        name: 'Update Test',
        metadata: { version: 1 },
        variants: [{ name: 'test', stock: 1 }],
      })
      .single()

    expect(original).toBeDefined()

    if (!original)
      return

    const updated = await db.from('items')
      .update({
        metadata: {
          version: 2,
          updated: true,
        },
        variants: [
          { name: 'test', stock: 2 },
        ],
      })
      .eq('id', original.id)
      .single()

    expect(updated).toBeDefined()
    expect(updated?.metadata.version).toBe(2)
    expect(updated?.metadata.updated).toBe(true)
    expect(updated?.variants[0].stock).toBe(2)
  })

  it('preserves default values for nested fields', async () => {
    const item = await db.from('items')
      .insert({
        name: 'Default Test',
      })
      .single()

    expect(item).toBeDefined()
    expect(item?.metadata).toEqual({})
    expect(item?.tags).toEqual([])
    expect(item?.attributes).toEqual({
      color: 'default',
      size: 'medium',
    })
    expect(item?.variants).toHaveLength(1)
    expect(item?.variants[0]).toEqual({
      name: 'default',
      stock: 0,
    })
  })

  it('handles partial updates of nested fields', async () => {
    const original = await db.from('items')
      .insert({
        name: 'Partial Update Test',
        metadata: {
          version: 1,
          config: {
            setting1: true,
            setting2: false,
          },
        },
        attributes: {
          color: 'red',
          size: 'large',
          material: 'cotton',
        },
      })
      .single()

    expect(original).toBeDefined()
    if (!original)
      return

    // Partial update of nested fields
    const updated = await db.from('items')
      .update({
        metadata: {
          ...original.metadata,
          version: 2,
          config: {
            ...original.metadata.config,
            setting2: true,
          },
        },
        attributes: {
          ...original.attributes,
          color: 'blue',
        },
      })
      .eq('id', original.id)
      .single()

    expect(updated).toBeDefined()
    expect(updated?.metadata.version).toBe(2)
    expect(updated?.metadata.config.setting1).toBe(true)
    expect(updated?.metadata.config.setting2).toBe(true)
    expect(updated?.attributes.color).toBe('blue')
    expect(updated?.attributes.material).toBe('cotton')
  })
})

const optionalNestedSchema = {
  items: {
    id: { type: 'string', primaryKey: true },
    name: { type: 'string', required: true },
    details: {
      type: 'object',
      props: {
        description: { type: 'string', required: true },
        category: { type: 'string' }, // optional
        metadata: {
          type: 'object',
          props: {
            created: { type: 'number', required: true },
            modified: { type: 'number' }, // optional
          },
        },
      },
    },
    // Optional array
    tags: {
      type: 'array',
      items: { type: 'string' },
    },
  },
} satisfies DatabaseSchema

type OptionalDB = Database<typeof optionalNestedSchema>
type OPItem = OptionalDB['items']

describe('optional nested fields', () => {
  let db: IdbOrm<typeof optionalNestedSchema>

  beforeEach(async () => {
    db = new IdbOrm('optional-nested-test-db', 1, optionalNestedSchema)
    await db.connect()
  })

  afterEach(() => {
    db.disconnect()
    indexedDB.deleteDatabase('optional-nested-test-db')
  })

  it('allows omitting optional nested fields', async () => {
    const item = await db.from('items')
      .insert({
        name: 'Test Item',
        // details and tags are optional and can be omitted
      })
      .single()

    expect(item).toBeDefined()
    expect(item?.details).toBeUndefined()
    expect(item?.tags).toBeUndefined()
  })

  it('validates required nested fields when parent is provided', async () => {
    await db.from('items').insert({
      name: 'Test Item',
      // @ts-expect-error - description is required when details is provided
      details: {
        category: 'test', // missing required description
      },
    }).single()

    await db.from('items').insert({
      name: 'Test Item',
      details: {
        description: 'test',
        // @ts-expect-error - created is required when metadata is provided
        metadata: {
          modified: Date.now(), // missing required created
        },
      },
    }).single()

    // This should work:
    const item = await db.from('items').insert({
      name: 'Test Item',
      details: {
        description: 'test',
        category: 'test', // optional
        metadata: {
          created: Date.now(),
          modified: Date.now(), // optional
        },
      },
      tags: ['test'], // optional
    }).single()

    expect(item?.details?.description).toBe('test')
    expect(item?.details?.metadata?.created).toBeDefined()
    expect(item?.tags?.[0]).toBe('test')
  })

  it('preserves undefined vs null in nested fields', async () => {
    const item = await db.from('items')
      .insert({
        name: 'Test Item',
        details: {
          description: 'test',
          category: undefined,
          metadata: {
            created: Date.now(),
            modified: undefined,
          },
        },
      })
      .single()

    expect(item?.details?.category).toBeUndefined()
    expect(item?.details?.metadata?.modified).toBeUndefined()
    // Not null:
    expect(item?.details?.category).not.toBeNull()
    expect(item?.details?.metadata?.modified).not.toBeNull()
  })
})
