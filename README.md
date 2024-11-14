# idb-orm

A lightweight, type-safe ORM for IndexedDB that closely matches the supabase-js API.

## Install

```bash
npm i idb-orm
```

## Quick Start

```typescript
import { IdbOrm } from 'idb-orm'

// Define your database schema
const schema = {
  users: {
    id: { type: 'number' },
    name: { type: 'string', required: true },
    age: { type: 'number', required: true },
  }
} satisfies DatabaseSchema

// Types are automatically inferred from schema
type DB = Database<typeof schema>
type User = DB['users'] // { id?: number, name: string, age: number }

// Initialize and connect
const db = new IdbOrm('myDatabase', 1, schema)
await db.connect()
```

## API

### Query Data

```typescript
const allUsers = await db
  .from('users')
  .select()
```

### Insert records

```typescript
const user = await db
  .from('users')
  .insert({ name: 'Me', age: 30 })
```

### Update records

TODO

### Upsert records

```typescript
const user = await db
  .from('users')
  .upsert({ name: 'Me', age: 30 })
```

### Delete records

TODO

### Filter records

```typescript
const adults = await db
  .from('users')
  .gte('age', 18)
  .select()
```

### Sort records

TODO

### Limit records

```typescript
const firstUser = await db
  .from('users')
  .limit(3)
  .select()
```

### Retrieve one row of data

```typescript
const user = await db
  .from('users')
  .limit(1)
  .single()
```

### License

MIT
