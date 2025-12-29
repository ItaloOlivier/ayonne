import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useCopyToClipboard } from './useCopyToClipboard'

describe('useCopyToClipboard', () => {
  const originalClipboard = navigator.clipboard
  const originalExecCommand = document.execCommand

  beforeEach(() => {
    vi.useFakeTimers()
    // Reset clipboard mock
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    })
    // Reset window.isSecureContext
    Object.defineProperty(window, 'isSecureContext', {
      value: true,
      writable: true,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    Object.assign(navigator, { clipboard: originalClipboard })
    document.execCommand = originalExecCommand
  })

  it('initializes with copied = false', () => {
    const { result } = renderHook(() => useCopyToClipboard())
    expect(result.current.copied).toBe(false)
  })

  it('copies text using clipboard API', async () => {
    const { result } = renderHook(() => useCopyToClipboard())

    let success: boolean
    await act(async () => {
      success = await result.current.copy('test text')
    })

    expect(success!).toBe(true)
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test text')
    expect(result.current.copied).toBe(true)
  })

  it('resets copied state after timeout', async () => {
    const { result } = renderHook(() => useCopyToClipboard(1000))

    await act(async () => {
      await result.current.copy('test text')
    })

    expect(result.current.copied).toBe(true)

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(result.current.copied).toBe(false)
  })

  it('returns false for empty text', async () => {
    const { result } = renderHook(() => useCopyToClipboard())

    let success: boolean
    await act(async () => {
      success = await result.current.copy('')
    })

    expect(success!).toBe(false)
    expect(result.current.copied).toBe(false)
  })

  it('reset function clears copied state', async () => {
    const { result } = renderHook(() => useCopyToClipboard())

    await act(async () => {
      await result.current.copy('test')
    })

    expect(result.current.copied).toBe(true)

    act(() => {
      result.current.reset()
    })

    expect(result.current.copied).toBe(false)
  })

  it('falls back to execCommand when clipboard API unavailable', async () => {
    // Simulate clipboard API failure
    Object.assign(navigator, {
      clipboard: undefined,
    })
    Object.defineProperty(window, 'isSecureContext', {
      value: false,
      writable: true,
    })

    // Mock execCommand
    const mockExecCommand = vi.fn().mockReturnValue(true)
    document.execCommand = mockExecCommand

    const { result } = renderHook(() => useCopyToClipboard())

    let success: boolean
    await act(async () => {
      success = await result.current.copy('fallback text')
    })

    expect(success!).toBe(true)
    expect(mockExecCommand).toHaveBeenCalledWith('copy')
    expect(result.current.copied).toBe(true)
  })

  it('returns false when copy fails', async () => {
    (navigator.clipboard.writeText as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Copy failed')
    )

    const { result } = renderHook(() => useCopyToClipboard())

    let success: boolean
    await act(async () => {
      success = await result.current.copy('test')
    })

    expect(success!).toBe(false)
    expect(result.current.copied).toBe(false)
  })
})
