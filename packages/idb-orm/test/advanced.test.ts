import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { type DatabaseSchema, IdbOrm } from '../src'

const advancedSchema = {
  products: {
    id: { type: 'string', primaryKey: true },
    name: { type: 'string', required: true },
    price: { type: 'number', required: true },
    category: { type: 'string', required: true },
    inStock: { type: 'boolean', required: true },
    tags: { type: 'array' },
    metadata: { type: 'object' },
  },
  orders: {
    id: { type: 'number', primaryKey: true, autoIncrement: true },
    customerId: { type: 'number', required: true },
    totalAmount: { type: 'number', required: true },
    status: { type: 'string', required: true },
    createdAt: { type: 'number', required: true },
  },
  orderItems: {
    id: { type: 'number', primaryKey: true, autoIncrement: true },
    orderId: { type: 'number', required: true },
    productId: { type: 'number', required: true },
    quantity: { type: 'number', required: true },
    price: { type: 'number', required: true },
  },
  customers: {
    id: { type: 'string', primaryKey: true },
    name: { type: 'string', required: true },
    email: { type: 'string', required: true },
    tier: { type: 'string', required: true },
    lastLoginAt: { type: 'number' },
  },
} satisfies DatabaseSchema

// type DB = Database<typeof advancedSchema>
// type Product = DB['products']
// type Order = DB['orders']
// type OrderItem = DB['orderItems']
// type Customer = DB['customers']

describe('advanced IDB ORM Tests', () => {
  let db: IdbOrm<typeof advancedSchema>

  beforeEach(async () => {
    db = new IdbOrm('advanced-test-db', 1, advancedSchema)
    await db.connect()

    await seedTestData(db)
  })

  afterEach(() => {
    db.disconnect()
    indexedDB.deleteDatabase('advanced-test-db')
  })

  it('handles complex filtering with multiple conditions', async () => {
    const results = await db
      .from('products')
      .select()
      .gte('price', 50)
      .eq('inStock', true)
      .eq('category', 'electronics')
      .get()

    expect(results.length).toBeGreaterThan(0)
    results.forEach((product) => {
      expect(product.price).toBeGreaterThanOrEqual(50)
      expect(product.inStock).toBe(true)
      expect(product.category).toBe('electronics')
    })
  })

  it('updates products with complex conditions', async () => {
    await db
      .from('products')
      .update({ inStock: false })
      .gte('price', 100)
      .eq('category', 'electronics')
      .eq('inStock', true)
      .get()

    const remaining = await db
      .from('products')
      .select()
      .gte('price', 100)
      .eq('category', 'electronics')
      .eq('inStock', true)
      .get()

    expect(remaining).toHaveLength(0)
  })

  it('handles array and object fields correctly', async () => {
    const product = await db
      .from('products')
      .insert({
        name: 'Special Product',
        price: 199.99,
        category: 'limited',
        inStock: true,
        tags: ['premium', 'limited-edition'],
        metadata: { edition: '2024', serialNumber: 'ABC123' },
      })
      .get()

    const retrieved = await db
      .from('products')
      .select()
      .eq('id', product[0].id)
      .single()

    expect(retrieved?.tags).toEqual(['premium', 'limited-edition'])
    expect(retrieved?.metadata).toEqual({ edition: '2024', serialNumber: 'ABC123' })
  })

  it('performs complex order aggregation', async () => {
    const customerOrders = await db
      .from('orders')
      .select()
      .gte('totalAmount', 1000)
      .order('totalAmount', 'desc')
      .get()

    expect(customerOrders).toHaveLength(2)
    expect(customerOrders[0].totalAmount).toBeGreaterThan(customerOrders[1].totalAmount)
  })

  it('handles pagination with offset and limit', async () => {
    const pageSize = 2
    const page1 = await db
      .from('products')
      .select()
      .order('price', 'desc')
      .limit(pageSize)
      .offset(0)
      .get()

    const page2 = await db
      .from('products')
      .select()
      .order('price', 'desc')
      .limit(pageSize)
      .offset(pageSize)
      .get()

    expect(page1).toHaveLength(pageSize)
    expect(page2).toHaveLength(pageSize)
    expect(page1[0].price).toBeGreaterThan(page2[0].price)
  })

  it('finds customers with recent orders', async () => {
    const now = Date.now()
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000

    const ordersLastWeek = await db
      .from('orders')
      .select()
      .gte('createdAt', oneWeekAgo)
      .get()

    const customerIds = new Set(ordersLastWeek.map(order => order.customerId))
    expect(customerIds.size).toBeGreaterThan(0)

    const activeCustomers = await db
      .from('customers')
      .select('name', 'tier')
      .gte('lastLoginAt', oneWeekAgo)
      .get()

    expect(activeCustomers.length).toBeGreaterThan(0)
    activeCustomers.forEach((customer) => {
      expect(customer).toHaveProperty('name')
      expect(customer).toHaveProperty('tier')
      expect(customer).not.toHaveProperty('email')
    })
  })

  it('handles bulk upsert operations', async () => {
    const products = await Promise.all([
      db.from('products')
        .upsert({ name: 'Updated Product 1', price: 199.99, category: 'electronics', inStock: true })
        .get(),
      db.from('products')
        .upsert({ name: 'New Product', price: 299.99, category: 'electronics', inStock: true })
        .get(),
    ])

    expect(products).toHaveLength(2)
    expect(products[0][0].name).toBe('Updated Product 1')
    expect(products[1][0].name).toBe('New Product')
  })
})

async function seedTestData(db: IdbOrm<typeof advancedSchema>) {
  await db.from('customers').insert({ name: 'John Doe', email: 'john@example.com', tier: 'gold', lastLoginAt: Date.now() }).get()
  await db.from('customers').insert({ name: 'Jane Smith', email: 'jane@example.com', tier: 'silver', lastLoginAt: Date.now() }).get()

  await db.from('products').insert({ name: 'Laptop', price: 999.99, category: 'electronics', inStock: true }).get()
  await db.from('products').insert({ name: 'Phone', price: 599.99, category: 'electronics', inStock: true }).get()
  await db.from('products').insert({ name: 'Headphones', price: 99.99, category: 'electronics', inStock: true }).get()
  await db.from('products').insert({ name: 'Book', price: 19.99, category: 'books', inStock: true }).get()

  await db.from('orders').insert({ customerId: 1, totalAmount: 1599.98, status: 'completed', createdAt: Date.now() }).get()
  await db.from('orders').insert({ customerId: 2, totalAmount: 1099.98, status: 'pending', createdAt: Date.now() }).get()
  await db.from('orders').insert({ customerId: 1, totalAmount: 19.99, status: 'completed', createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000 }).get()

  await db.from('orderItems').insert({ orderId: 1, productId: 1, quantity: 1, price: 999.99 }).get()
  await db.from('orderItems').insert({ orderId: 1, productId: 3, quantity: 1, price: 599.99 }).get()
  await db.from('orderItems').insert({ orderId: 2, productId: 2, quantity: 1, price: 599.99 }).get()
  await db.from('orderItems').insert({ orderId: 2, productId: 3, quantity: 5, price: 99.99 }).get()
  await db.from('orderItems').insert({ orderId: 3, productId: 4, quantity: 1, price: 19.99 }).get()
}
