import { createSignal, onCleanup, onMount } from 'solid-js'

import { logging } from '~/shared/utils/logging'

/**
 * Hook for observing element visibility using Intersection Observer API.
 * @param options - Intersection observer options
 * @param callback - Optional callback function that receives the intersection entry
 * @returns Signal for visibility state, intersection ratio, and ref setter function
 */
export function useIntersectionObserver(
  options: {
    threshold?: number | number[]
    root?: Element | null
  } = {},
  callback?: (entry: IntersectionObserverEntry) => void,
) {
  const [isVisible, setIsVisible] = createSignal(false)
  const [intersectionRatio, setIntersectionRatio] = createSignal(0)

  let elementRef: Element | undefined
  let observer: IntersectionObserver | undefined

  const { threshold = 0.1, root = null } = options

  let pendingElements: (Element | undefined)[] = []

  onMount(() => {
    logging.debug('useIntersectionObserver: Mounting observer with options:', {
      threshold,
      root,
    })
    observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry) {
          const visible = entry.intersectionRatio > 0
          setIsVisible(visible)
          setIntersectionRatio(entry.intersectionRatio)

          if (callback) {
            callback(entry)
          }
        }
      },
      {
        threshold,
        root,
      },
    )

    // Após criar o observer, observe todos os elementos pendentes
    pendingElements.forEach((el) => {
      if (el) observer!.observe(el)
    })
    pendingElements = []
  })

  onCleanup(() => {
    observer?.disconnect()
  })

  const setRef = (element: Element | undefined) => {
    if (!observer) {
      pendingElements.push(element)
      return
    }

    if (element) {
      observer.observe(element)
    }
    if (elementRef && elementRef !== element) {
      observer.unobserve(elementRef)
    }
    elementRef = element
  }

  return {
    isVisible,
    intersectionRatio,
    setRef,
  }
}
