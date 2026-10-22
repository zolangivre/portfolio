import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useTypewriter } from '@/hooks/useTypewriter'

// jsdom has no matchMedia: answer the one query the hook asks.
function stubReducedMotion(reduce: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: reduce && query === '(prefers-reduced-motion: reduce)',
  }))
}

describe('useTypewriter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    stubReducedMotion(false)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('shows nothing until the delay, then one more character per tick', () => {
    const { result } = renderHook(() => useTypewriter('Zolan', 50, 500))

    expect(result.current).toBe(0)

    act(() => vi.advanceTimersByTime(499))
    expect(result.current).toBe(0)

    act(() => vi.advanceTimersByTime(1 + 50))
    expect(result.current).toBe(1)

    act(() => vi.advanceTimersByTime(50 * 2))
    expect(result.current).toBe(3)
  })

  it('stops at the full text and leaves no timer running', () => {
    const { result } = renderHook(() => useTypewriter('Zolan', 50, 500))

    act(() => vi.advanceTimersByTime(500 + 50 * 20))

    expect(result.current).toBe(5)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('skips straight to the full text for prefers-reduced-motion', () => {
    stubReducedMotion(true)
    const { result } = renderHook(() => useTypewriter('Zolan', 50, 500))

    act(() => vi.advanceTimersByTime(0))

    expect(result.current).toBe(5)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('types a new text from the start', () => {
    const { result, rerender } = renderHook(({ text }) => useTypewriter(text, 50, 500), {
      initialProps: { text: 'Zolan' },
    })
    act(() => vi.advanceTimersByTime(500 + 50 * 5))
    expect(result.current).toBe(5)

    rerender({ text: 'Givre' })
    act(() => vi.advanceTimersByTime(500 + 50 * 2))

    expect(result.current).toBe(2)
  })

  it('handles an empty text without starting an interval', () => {
    const { result } = renderHook(() => useTypewriter('', 50, 500))

    act(() => vi.advanceTimersByTime(500))

    expect(result.current).toBe(0)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('clears its timers when unmounted mid-typing', () => {
    const { unmount } = renderHook(() => useTypewriter('Zolan', 50, 500))
    act(() => vi.advanceTimersByTime(500 + 50))

    unmount()

    expect(vi.getTimerCount()).toBe(0)
  })
})
