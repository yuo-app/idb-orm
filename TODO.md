# TODO

- TODO: fix filter function chain order
const user = await db
  .from('users')
  .select('name')
  .eq('name', 'John') // should be Correct

const user = await db
  .from('users')
  .eq('name', 'John') // should be Incorrect
  .select('name')

- TODO: only return inserted data, if we called select() on it
const user = await db
  .from('users')
  .upsert({ name: 'Me', email: 'asd', age: 30 })
  .select()

- TODO: select('field') should return only that field
const firstUser = await db
  .from('users')
  .limit(1)
  .select('name')
firstUser[0] // should be a string

- TODO: support select('field1', 'field2')
