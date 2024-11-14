import type { DatabaseSchema } from '@orm/index'
import type { Component } from 'solid-js'
import { IdbOrm } from '@orm/index'
import { createSignal, For } from 'solid-js'

interface User {
  id?: number
  name: string
  email: string
  age: number
}

const schema = {
  users: {
    name: { type: 'string', required: true },
    email: { type: 'string', required: true },
    age: { type: 'number', required: true },
  },
} satisfies DatabaseSchema

const App: Component = () => {
  const [db, setDb] = createSignal<IdbOrm>()
  const [users, setUsers] = createSignal<User[]>([])
  const [name, setName] = createSignal('')
  const [email, setEmail] = createSignal('')
  const [age, setAge] = createSignal('')

  async function connectDb() {
    const idb = new IdbOrm('playground', 1, schema)
    await idb.connect()
    setDb(idb)
  }

  async function addUser(e: Event) {
    e.preventDefault()
    if (!db())
      return

    await db()!.table<User>('users').insert({
      name: name(),
      email: email(),
      age: Number.parseInt(age()),
    })

    loadUsers()
    setName('')
    setEmail('')
    setAge('')
  }

  async function loadUsers() {
    if (!db())
      return
    const results = await db()!.table<User>('users').get()
    setUsers(results)
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
        <For each={users()}>
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