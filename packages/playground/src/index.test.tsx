import { fireEvent, render } from '@solidjs/testing-library'
import { describe, expect, it, vi } from 'vitest'
import App from './app'

vi.mock('@orm/index', () => ({
  IdbOrm: vi.fn().mockImplementation(() => ({
    connect: vi.fn().mockResolvedValue(undefined),
    table: vi.fn().mockReturnValue({
      insert: vi.fn().mockResolvedValue(undefined),
      get: vi.fn().mockResolvedValue([
        { name: 'Test User', email: 'test@test.com', age: 25 },
      ]),
    }),
  })),
}))

describe('<App />', () => {
  it('renders the initial UI elements', () => {
    const { getByText, getByPlaceholderText } = render(() => <App />)

    expect(getByText('IndexedDB ORM Playground')).toBeInTheDocument()
    expect(getByText('Connect to DB')).toBeInTheDocument()
    expect(getByPlaceholderText('Name')).toBeInTheDocument()
    expect(getByPlaceholderText('Email')).toBeInTheDocument()
    expect(getByPlaceholderText('Age')).toBeInTheDocument()
    expect(getByText('Add User')).toBeInTheDocument()
    expect(getByText('Load Users')).toBeInTheDocument()
  })

  it('connects to database when clicking Connect button', async () => {
    const { getByText } = render(() => <App />)
    const connectButton = getByText('Connect to DB')

    await fireEvent.click(connectButton)

    expect(connectButton).toBeInTheDocument()
  })

  it('adds a new user when form is submitted', async () => {
    const { getByText, getByPlaceholderText } = render(() => <App />)

    // Connect to DB first
    await fireEvent.click(getByText('Connect to DB'))

    // Fill form
    const nameInput = getByPlaceholderText('Name')
    const emailInput = getByPlaceholderText('Email')
    const ageInput = getByPlaceholderText('Age')

    await fireEvent.input(nameInput, { target: { value: 'Test User' } })
    await fireEvent.input(emailInput, { target: { value: 'test@test.com' } })
    await fireEvent.input(ageInput, { target: { value: '25' } })

    // Submit form
    await fireEvent.click(getByText('Add User'))

    // Check if inputs are cleared
    expect(nameInput).toHaveValue('')
    expect(emailInput).toHaveValue('')
    expect(ageInput).toHaveValue('')
  })

  it('loads users when clicking Load Users button', async () => {
    const { getByText, findByText } = render(() => <App />)

    // Connect to DB first
    await fireEvent.click(getByText('Connect to DB'))

    // Click load users
    await fireEvent.click(getByText('Load Users'))

    // Check if mock data is displayed
    const userElement = await findByText('Test User (test@test.com) 25 years old')
    expect(userElement).toBeInTheDocument()
  })
})
