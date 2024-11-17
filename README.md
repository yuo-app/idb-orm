# idb-orm

A lightweight, type-safe ORM for IndexedDB that closely matches the supabase-js API.

## Install

```bash
npm i @yuo-app/idb-orm
```

## Quick Start

```typescript
import { type Database, type DatabaseSchema, IdbOrm } from '@yuo-app/idb-orm'

// Define your database schema
const schema = {
  users: {
    id: { type: 'number', primaryKey: true },
    name: { type: 'string', required: true },
    age: { type: 'number' },
  }
} satisfies DatabaseSchema

// Types are automatically inferred from schema
type DB = Database<typeof schema>
type User = DB['users'] // { id: number, name: string, age?: number }

// Initialize and connect
const db = new IdbOrm('database', 1, schema)
await db.connect()
```

Don't forget to increment the database version when you change the schema!

## Schema

### Ids

Use `primaryKey: true` to define a primary key.

- `type: 'number'` can be used to auto-increment the primary key combined with `autoIncrement: true`.
- `type: 'string'` generates a UUID

### Types

`string`, `number`, `boolean`, `array`, `object`

Use `required: true` to enforce a field to be non-nullable.
Use `default` to set a default value.

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

### Retrieve all data

`getAll()` can be used to get the entire database.

```typescript
const allData = await db.getAll()
```

### Insert records

`insert()` will insert a new record and return the inserted data.

>[!TIP]
> It's recommended to use `upsert()` which directly inserts or updates a record.
>
> - use `insert()` only if you want it to fail when the record already exists
> - `update()` will not fail if the record does not exist, it will return an empty array

```typescript
await db
  .from('users')
  .insert({ name: 'Me', age: 30 })
  .get()
```

Use the `Insert` and `Update` helper types to create your actions.

```typescript
type UserInsert = Insert<typeof schema['users']> // id is optional, fields with default values are optional
type UserUpdate = Update<typeof schema['users']> // all fields are optional (Partial<> also works)
```

### Update records

`update()` will update records that match the query and return the updated data.

```typescript
await db
  .from('users')
  .update({ age: 31 })
  .eq('name', 'Me')
  .get()
```

### Upsert records

`upsert()` will insert a new record or update an existing record and return the data.

```typescript
await db
  .from('users')
  .upsert({ name: 'Me', age: 31 })
  .get()
```

### Delete records

`delete()` will remove records that match the query.

```typescript
await db
  .from('users')
  .delete()
  .eq('name', 'Me')
  .get()
```

### Filter records

Use `eq()`, `neq()`, `gt()`, `gte()`, `lt()`, `lte()` to filter records.

```typescript
const adults = await db
  .from('users')
  .select()
  .gte('age', 18)
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

### Get table names

Use `getTableNames()` to get a list of table names.

```typescript
const tableNames = await db.getTableNames() // ['users']
```

### Delete all data

`clearAll()` will remove all data but keep the tables.
`deleteAll()` will remove all data and tables.

```typescript
await db.clearAll()
await db.deleteAll()
```

### License

MIT
