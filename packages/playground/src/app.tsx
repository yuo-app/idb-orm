import type { Component } from 'solid-js'
import type { Database, DatabaseSchema } from './../../idb-orm'
import { createSignal, For } from 'solid-js'
import { createStore, reconcile } from 'solid-js/store'
import { IdbOrm } from './../../idb-orm'

const schema = {
  users: {
    id: { type: 'number', primaryKey: true, autoIncrement: true },
    name: { type: 'string', required: true },
    email: { type: 'string', required: true },
    age: { type: 'number', required: true },
  },
} satisfies DatabaseSchema

type DB = Database<typeof schema>
type User = DB['users']

const App: Component = () => {
  let db: IdbOrm<typeof schema> | undefined
  const [users, setUsers] = createStore<User[]>([])
  const [name, setName] = createSignal('')
  const [email, setEmail] = createSignal('')
  const [age, setAge] = createSignal('')

  async function connectDb() {
    db = new IdbOrm('playground', 1, schema)
    await db.connect()
  }

  async function addUser(e: Event) {
    e.preventDefault()
    if (!db)
      return

    const insertedUsers = await db.from('users').insert({
      name: name(),
      email: email(),
      age: Number.parseInt(age()),
    })

    console.log('Inserted users:', insertedUsers)

    loadUsers()
    setName('')
    setEmail('')
    setAge('')
  }

  async function loadUsers() {
    if (!db)
      return
    const results = await db.from('users').select()
    setUsers(reconcile(results))
  }

  return (
    <div class="container mx-auto p-4">
      <h1 class="text-2xl mb-4">IndexedDB ORM Playground</h1>

      <button
        onClick={connectDb}
        class="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Connect to DB
      </button>

      <form onSubmit={addUser} class="my-4">
        <input
          value={name()}
          onInput={e => setName(e.currentTarget.value)}
          placeholder="Name"
          class="border p-2 mr-2"
        />
        <input
          value={email()}
          onInput={e => setEmail(e.currentTarget.value)}
          placeholder="Email"
          class="border p-2 mr-2"
        />
        <input
          value={age()}
          onInput={e => setAge(e.currentTarget.value)}
          placeholder="Age"
          type="number"
          class="border p-2 mr-2"
        />
        <button
          type="submit"
          class="bg-green-500 text-white px-4 py-2 rounded"
        >
          Add User
        </button>
      </form>

      <button
        onClick={loadUsers}
        class="bg-purple-500 text-white px-4 py-2 rounded"
      >
        Load Users
      </button>

      <div class="mt-4">
        <For each={users}>
          {user => (
            <div class="border p-2 mb-2">
              {user.name} ({user.email}) {user.age} years old
            </div>
          )}
        </For>
      </div>
    </div>
  )
}

export default App
