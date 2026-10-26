import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CopyButton } from '@/components/ui/CopyButton'

const labels = {
  ariaLabel: "Copier l'adresse e-mail",
  copiedLabel: 'Adresse copiée',
  failedLabel: 'Copie impossible',
}

function stubClipboard(writeText: (value: string) => Promise<void>) {
  vi.stubGlobal('navigator', {
    ...navigator,
    clipboard: { writeText: vi.fn(writeText) },
    vibrate: vi.fn(),
  })
}

async function click() {
  // The click handler awaits the clipboard: flush it before asserting.
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: labels.ariaLabel }))
  })
}

describe('CopyButton', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('copies the value and announces it once, without renaming the button', async () => {
    stubClipboard(() => Promise.resolve())
    render(<CopyButton {...labels} value="zolan@example.com" />)

    await click()

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('zolan@example.com')
    expect(screen.getByRole('status').textContent).toBe(labels.copiedLabel)
    const button = screen.getByRole('button', { name: labels.ariaLabel })
    expect(button.getAttribute('data-status')).toBe('copied')
    expect(navigator.vibrate).toHaveBeenCalledWith(10)
  })

  it('says so when the clipboard refuses', async () => {
    stubClipboard(() => Promise.reject(new Error('denied')))
    render(<CopyButton {...labels} value="zolan@example.com" />)

    await click()

    expect(screen.getByRole('status').textContent).toBe(labels.failedLabel)
    expect(screen.getByRole('button').getAttribute('data-status')).toBe('failed')
    expect(navigator.vibrate).not.toHaveBeenCalled()
  })

  it('goes back to rest after a moment, and the live region empties', async () => {
    stubClipboard(() => Promise.resolve())
    render(<CopyButton {...labels} value="zolan@example.com" />)

    await click()
    act(() => vi.advanceTimersByTime(1800))

    expect(screen.getByRole('status').textContent).toBe('')
    expect(screen.getByRole('button').getAttribute('data-status')).toBe('idle')
  })

  it('restarts the countdown on a second click', async () => {
    stubClipboard(() => Promise.resolve())
    render(<CopyButton {...labels} value="zolan@example.com" />)

    await click()
    act(() => vi.advanceTimersByTime(1500))
    await click()
    act(() => vi.advanceTimersByTime(1500))

    expect(screen.getByRole('button').getAttribute('data-status')).toBe('copied')
  })

  it('keeps the live region mounted before any click, so it is announced later', () => {
    stubClipboard(() => Promise.resolve())
    render(<CopyButton {...labels} value="zolan@example.com" />)

    expect(screen.getByRole('status').textContent).toBe('')
  })
})
