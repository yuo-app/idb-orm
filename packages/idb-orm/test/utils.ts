import { type DatabaseSchema, IdbOrm } from '../src/orm'

export const testSchema = {
  users: {
    id: { type: 'number', primaryKey: true, autoIncrement: true },
    name: { type: 'string', required: true },
    admin: { type: 'boolean' },
    age: { type: 'number', required: true },
  },
} satisfies DatabaseSchema

export function createTestDb() {
  return new IdbOrm('test-db', 1, testSchema)
}
