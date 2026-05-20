import { useRef, useEffect, useCallback } from 'react'

/**
 * Returns a debounced version of the callback.
 * The returned function has a stable reference (via useCallback).
 */
export function useDebounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  return useCallback(
    (...args: Parameters<T>) => {
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => fn(...args), delay)
    },
    [fn, delay]
  )
}
