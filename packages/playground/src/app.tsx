import type { Database, DatabaseSchema } from '@orm/index'
import type { Insert, Update } from '@orm/src/types'
import type { Component } from 'solid-js'
import { IdbOrm } from '@orm/index'
import { createSignal, For } from 'solid-js'
import { createStore, reconcile } from 'solid-js/store'

const schema = {
  users: {
    id: { type: 'string', primaryKey: true },
    name: { type: 'string', required: true },
    email: { type: 'string' },
    age: { type: 'number', required: true, default: 18 },
  },
  posts: {
    id: { type: 'number', primaryKey: true, autoIncrement: true },
    title: { type: 'string', required: true },
    content: { type: 'string', required: true },
    authorId: { type: 'string', required: true },
  },
} satisfies DatabaseSchema

type DB = Database<typeof schema>
type User = DB['users']
type Post = DB['posts']

const App: Component = () => {
  let db: IdbOrm<typeof schema> | undefined
  const [users, setUsers] = createStore<User[]>([])
  const [posts, setPosts] = createStore<Post[]>([])
  const [mode, setMode] = createSignal<'users' | 'posts'>('users')

  // User form states
  const [name, setName] = createSignal('')
  const [email, setEmail] = createSignal('')
  const [age, setAge] = createSignal('')

  // Post form states
  const [title, setTitle] = createSignal('')
  const [content, setContent] = createSignal('')
  const [authorId, setAuthorId] = createSignal('')

  async function connectDb() {
    db = new IdbOrm('playground', 2, schema)
    await db.connect()
  }

  async function addUser(e: Event) {
    e.preventDefault()
    if (!db)
      return

    await db
      .from('users')
      .insert({
        name: name(),
        email: email(),
        age: Number.parseInt(age()),
      })
      .get()

    loadUsers()
    setName('')
    setEmail('')
    setAge('')
  }

  async function loadUsers() {
    if (!db)
      return

    const results = await db
      .from('users')
      .select()
      .get()

    setUsers(reconcile(results))
  }

  async function addPost(e: Event) {
    e.preventDefault()
    if (!db)
      return

    await db
      .from('posts')
      .insert({
        title: title(),
        content: content(),
        authorId: authorId(),
      })
      .get()

    loadPosts()
    setTitle('')
    setContent('')
    setAuthorId('')
  }

  async function loadPosts() {
    if (!db)
      return
    const results = await db.from('posts').select().get()
    setPosts(reconcile(results))
  }

  async function loadAll() {
    if (!db)
      return

    const data = await db.getAll()
    setUsers(reconcile(data.users))
    setPosts(reconcile(data.posts))
  }

  return (
    <div class="container mx-auto p-4">
      <h1 class="text-2xl mb-4">IndexedDB ORM Playground</h1>

      <div class="space-x-2 mb-4">
        <button
          onClick={connectDb}
          class="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Connect to DB
        </button>
        <button
          onClick={loadAll}
          class="bg-green-500 text-white px-4 py-2 rounded"
        >
          Load All
        </button>
      </div>

      <div class="mb-4">
        <button
          onClick={() => setMode('users')}
          class={`px-4 py-2 rounded-l ${mode() === 'users' ? 'bg-purple-500 text-white' : 'bg-gray-200'}`}
        >
          Users
        </button>
        <button
          onClick={() => setMode('posts')}
          class={`px-4 py-2 rounded-r ${mode() === 'posts' ? 'bg-purple-500 text-white' : 'bg-gray-200'}`}
        >
          Posts
        </button>
      </div>

      {mode() === 'users'
        ? (
            <>
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
            </>
          )
        : (
            <>
              <form onSubmit={addPost} class="my-4">
                <input
                  value={title()}
                  onInput={e => setTitle(e.currentTarget.value)}
                  placeholder="Title"
                  class="border p-2 mr-2"
                />
                <input
                  value={content()}
                  onInput={e => setContent(e.currentTarget.value)}
                  placeholder="Content"
                  class="border p-2 mr-2"
                />
                <input
                  value={authorId()}
                  onInput={e => setAuthorId(e.currentTarget.value)}
                  placeholder="Author ID"
                  class="border p-2 mr-2"
                />
                <button
                  type="submit"
                  class="bg-green-500 text-white px-4 py-2 rounded"
                >
                  Add Post
                </button>
              </form>
              <button
                onClick={loadPosts}
                class="bg-purple-500 text-white px-4 py-2 rounded"
              >
                Load Posts
              </button>
              <div class="mt-4">
                <For each={posts}>
                  {post => (
                    <div class="border p-2 mb-2">
                      <div class="font-bold">{post.title}</div>
                      <div>{post.content}</div>
                      <div class="text-sm text-gray-500">Author ID: {post.authorId}</div>
                    </div>
                  )}
                </For>
              </div>
            </>
          )}
    </div>
  )
}

export default App
