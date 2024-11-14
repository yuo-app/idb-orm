# idb-orm

A lightweight, type-safe ORM for IndexedDB with a simple query builder interface inspired by drizzle and supabase-js.

## install

```bash
npm i idb-orm
```

## quick start

```typescript
import { IdbOrm } from 'idb-orm'

// Define your database schema
const schema = {
  users: {
    name: { type: 'string', required: true },
    email: { type: 'string', required: true },
    age: { type: 'number', required: true },
  }
} satisfies DatabaseSchema

// Types are automatically inferred from schema
type DB = Database<typeof schema>
type User = DB['users'] // { id?: number, name: string, email: string, age: number }

// Initialize and connect
const db = new IdbOrm('myDatabase', 1, schema)
await db.connect()
```

## query operations

These can be chained!

### get all records

```typescript
const allUsers = await db.table('users').get()
```

### filter records

```typescript
const adults = await db.table('users')
  .where('age', '>=', 18)
  .get()
```

### select fields

```typescript
const names = await db.table('users')
  .select('name', 'email')
  .get()
```

### insert records

```typescript
await db.table('users').insert({
  name: 'John Doe',
  email: 'john@example.com',
  age: 30
})
```

### License

MIT
