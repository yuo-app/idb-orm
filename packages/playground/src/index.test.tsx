import { fireEvent, render } from '@solidjs/testing-library'
import { describe, expect, it, vi } from 'vitest'
import App from './app'

// vi.mock('@orm/index', () => ({
//   IdbOrm: vi.fn().mockImplementation(() => ({
//     connect: vi.fn().mockResolvedValue(undefined),
//     table: vi.fn().mockReturnValue({
//       insert: vi.fn().mockResolvedValue(undefined),
//       get: vi.fn().mockResolvedValue([
//         { name: 'Test User', email: 'test@test.com', age: 25 },
//       ]),
//     }),
//   })),
// }))

describe('<App />', () => {
  it('works', () => {
    const { getByText } = render(() => <App />)

    expect(getByText('IndexedDB ORM Playground')).toBeInTheDocument()
    expect(getByText('Connect to DB')).toBeInTheDocument()
  })

  // it('renders the initial UI elements', () => {
  //   const { getByText, getByPlaceholderText } = render(() => <App />)

  //   expect(getByText('IndexedDB ORM Playground')).toBeInTheDocument()
  //   expect(getByText('Connect to DB')).toBeInTheDocument()
  //   expect(getByPlaceholderText('Name')).toBeInTheDocument()
  //   expect(getByPlaceholderText('Email')).toBeInTheDocument()
  //   expect(getByPlaceholderText('Age')).toBeInTheDocument()
  //   expect(getByText('Add User')).toBeInTheDocument()
  //   expect(getByText('Load Users')).toBeInTheDocument()
  // })

  // it('connects to database when clicking Connect button', async () => {
  //   const { getByText } = render(() => <App />)
  //   const connectButton = getByText('Connect to DB')

  //   fireEvent.click(connectButton)

  //   expect(connectButton).toBeInTheDocument()
  // })

  // it('adds a new user when form is submitted', async () => {
  //   const { getByText, getByPlaceholderText } = render(() => <App />)

  //   fireEvent.click(getByText('Connect to DB'))

  //   const nameInput = getByPlaceholderText('Name')
  //   const emailInput = getByPlaceholderText('Email')
  //   const ageInput = getByPlaceholderText('Age')

  //   fireEvent.input(nameInput, { target: { value: 'Test User' } })
  //   fireEvent.input(emailInput, { target: { value: 'test@test.com' } })
  //   fireEvent.input(ageInput, { target: { value: '25' } })

  //   fireEvent.click(getByText('Add User'))

  //   expect(nameInput).toHaveValue('')
  //   expect(emailInput).toHaveValue('')
  //   expect(ageInput).toHaveValue('')
  // })

  // it('loads users when clicking Load Users button', async () => {
  //   const { getByText, findByText } = render(() => <App />)

  //   fireEvent.click(getByText('Connect to DB'))

  //   fireEvent.click(getByText('Load Users'))

  //   const userElement = await findByText('Test User (test@test.com) 25 years old')
  //   expect(userElement).toBeInTheDocument()
  // })
})
