# ORM on top of unstorage

This project is an ORM (Object-Relational Mapping) library built on top of unstorage. It provides a simple and flexible API for interacting with various storage drivers using chaining functions similar to Drizzle.

## Features

- Basic CRUD operations (Create, Read, Update, Delete)
- Support for multiple storage drivers using unstorage's custom driver API
- Query builder for complex queries
- Schema management and validation
- Caching mechanism to improve performance

## Installation

To install the ORM, you can use npm or yarn:

```bash
npm install your-orm-package
# or
yarn add your-orm-package
```

## Usage

### Basic CRUD Operations

Here's an example of how to use the ORM for basic CRUD operations:

```typescript
import { MemoryDriver, ORM } from 'your-orm-package'

const driver = new MemoryDriver()
const orm = new ORM(driver)

// Create
await orm.from('users').insert({ id: 1, name: 'John Doe' })

// Read
const users = await orm.from('users').select({ id: 1 })
console.log(users)

// Update
await orm.from('users').update({ id: 1 }, { name: 'Jane Doe' })

// Delete
await orm.from('users').delete({ id: 1 })
```

### Using unstorage drivers

The ORM can now accept any unstorage driver without implementing custom ones. Here's an example of using an unstorage driver with the ORM:

```typescript
import { createStorage } from 'unstorage'
import { ORM } from 'your-orm-package'

const unstorageDriver = createStorage({
  driver: 'localstorage'
})

const orm = new ORM(unstorageDriver)

// Create
await orm.from('users').insert({ id: 1, name: 'John Doe' })

// Read
const users = await orm.from('users').select({ id: 1 })
console.log(users)

// Update
await orm.from('users').update({ id: 1 }, { name: 'Jane Doe' })

// Delete
await orm.from('users').delete({ id: 1 })
```

### Query Builder

The ORM also includes a query builder for more complex queries:

```typescript
import { MemoryDriver, ORM, QueryBuilder } from 'your-orm-package'

const driver = new MemoryDriver()
const orm = new ORM(driver)

const query = new QueryBuilder('users')
  .where('age', 30)
  .sortBy('name', 'asc')
  .limit(10)
  .skip(5)

const results = await query.execute(driver)
console.log(results)
```

### Schema Management and Validation

You can define and validate schemas using the ORM:

```typescript
import { Schema } from 'your-orm-package'

const userSchema = new Schema({
  id: { type: 'number', required: true },
  name: { type: 'string', required: true },
  age: { type: 'number', required: false }
})

const isValid = userSchema.validate({ id: 1, name: 'John Doe' })
console.log(isValid) // true
```

### Caching

The ORM includes a caching mechanism to improve performance:

```typescript
import { Cache } from 'your-orm-package'

const cache = new Cache()
cache.set('key', 'value')
const value = cache.get('key')
console.log(value) // 'value'
```

## License

This project is licensed under the MIT License.
