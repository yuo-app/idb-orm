# idb-orm

A lightweight, type-safe ORM for IndexedDB that closely matches the supabase-js API.

## Install

```bash
npm i @yuo/idb-orm
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

## Schema

### Ids

Use `primaryKey: true` to define a primary key.

- `type: 'number'` can be used to auto-increment the primary key combined with `autoIncrement: true`.
- `type: 'string'` generates a UUID

### Types

- `type: 'string'`
- `type: 'number'`
- `type: 'boolean'`
- `type: 'object'`
- `type: 'array'`

Use `required: true` to enforce a field to be non-nullable.
Use `defaultValue: any` to set a default value.

## API

>[!NOTE]
> idb-orm differs from supabase-js in one key way:
>
> - **you need to terminate chains with `get()` to execute them.**
> - `get()` will always return the modified data like when supabase's `select()` is called on insert methods.

### Query Data

Use `from()` to select a table, and `select()` to retrieve data.

```typescript
const allUsers = await db
  .from('users')
  .select()
  .get()
```

`select(...fields)` can be used to select specific fields.

```typescript
const userIdsAndNames = await db
  .from('users')
  .select('id', 'name')
  .get()
```

### Insert records

`insert()` will insert a new record and return the inserted data.

>[!TIP]
> It's recommended to use `upsert()` which directly inserts or updates a record.
>
> - use `insert()` only if you want it to fail when the record already exists
> - `update()` will not fail if the record does not exist, it will return an empty array

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
  .get()
```

### Upsert records

`upsert()` will insert a new record or update an existing record and return the data.

```typescript
const user = await db
  .from('users')
  .upsert({ name: 'Me', age: 31 })
  .get()
```

### Delete records

`delete()` will remove records that match the query.

```typescript
await db
  .from('users')
  .eq('name', 'Me')
  .delete()
  .get()
```

### Filter records

Use `eq()`, `neq()`, `gt()`, `gte()`, `lt()`, `lte()` to filter records.

```typescript
const adults = await db
  .from('users')
  .gte('age', 18)
  .select()
  .get()
```

### Sort records

Sort records using `order(field, direction)`. Use `asc` or `desc` for the direction.

```typescript
const sortedUsers = await db
  .from('users')
  .select()
  .order('age', 'asc')
  .get()
```

### Limit/offset records

Use `limit()` to return the first N records. Combine this with `sort()` to get the last N records.

```typescript
const firstUser = await db
  .from('users')
  .select()
  .limit(3)
  .get()
```

`offset()` can be used to skip the first N records.

### Retrieve one row of data

`single()` can be used instead of `get()` to return just one row of data, and not an array.

```typescript
const user = await db
  .from('users')
  .limit(1)
  .single()
```

### License

MIT
