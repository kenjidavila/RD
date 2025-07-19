import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LoginForm from '../login-form'

jest.mock('next/navigation', () => {
  const push = jest.fn()
  const refresh = jest.fn()
  return {
    useRouter: () => ({ push, refresh }),
    __esModule: true,
    push,
    refresh,
  }
})

const { push, refresh } = require('next/navigation')

const onShowRegister = jest.fn()

beforeEach(() => {
  onShowRegister.mockClear()
  push.mockClear()
  refresh.mockClear()
})

describe('LoginForm', () => {
  test('shows server error when result.error exists', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ error: 'bad' }),
    }) as any

    render(<LoginForm onShowRegister={onShowRegister} />)

    fireEvent.change(screen.getByLabelText(/correo/i), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByLabelText(/^contraseña$/i), { target: { value: 'pass' } })

    fireEvent.submit(screen.getByRole('button', { name: /iniciar sesión/i }))

    await screen.findByText('bad')
    expect(push).not.toHaveBeenCalled()
  })

  test('navigates to dashboard on success', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { user: { id: 1 } } }),
    }) as any

    render(<LoginForm onShowRegister={onShowRegister} />)

    fireEvent.change(screen.getByLabelText(/correo/i), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByLabelText(/^contraseña$/i), { target: { value: 'pass' } })

    fireEvent.submit(screen.getByRole('button', { name: /iniciar sesión/i }))

    await waitFor(() => expect(push).toHaveBeenCalledWith('/dashboard'))
  })
})
