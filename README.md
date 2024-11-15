# idb-orm

A lightweight, type-safe ORM for IndexedDB that closely matches the supabase-js API.

## Install

```bash
npm i idb-orm
```

## Quick Start

```typescript
import { type Database, type DatabaseSchema, IdbOrm } from 'idb-orm'

// Define your database schema
const schema = {
  users: {
    id: { type: 'number', primaryKey: true },
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

Use `from()` to select a table, and `select()` to retrieve data.

```typescript
const allUsers = await db
  .from('users')
  .select()
```

`select(...fields)` can be used to select specific fields.

```typescript
const userIdsAndNames = await db
  .from('users')
  .select('id', 'name')
```

### Insert records

`insert()` will insert a new record and return the inserted data.

>[!TIP]
> It's recommended to use `upsert()` which directly inserts or updates a record.
>
> - use `insert()` only if you want it to fail when the record already exists
> - use `update()` only if you want it to fail when the record doesn't exist

```typescript
const user = await db
  .from('users')
  .insert({ name: 'Me', age: 30 })
```

### Update records

`update()` will update records that match the query and return the updated data.

```typescript
const user = await db
  .from('users')
  .eq('name', 'Me')
  .update({ age: 31 })
```

### Upsert records

`upsert()` will insert a new record or update an existing record and return the data.

```typescript
const user = await db
  .from('users')
  .upsert({ name: 'Me', age: 31 })
```

### Delete records

TODO

### Filter records

Use `eq()`, `neq()`, `gt()`, `gte()`, `lt()`, `lte()` to filter records.

```typescript
const adults = await db
  .from('users')
  .gte('age', 18)
  .select()
```

### Sort records

Sort records using `order()`.

TODO

### Limit records

Use `limit()` to return the first N records. Combine this with `sort()` to get the last N records.

```typescript
const firstUser = await db
  .from('users')
  .limit(3)
  .select()
```

### Retrieve one row of data

`single()` will return just one row of data, and not an array.

```typescript
const user = await db
  .from('users')
  .limit(1)
  .single()
```

### License

MIT
