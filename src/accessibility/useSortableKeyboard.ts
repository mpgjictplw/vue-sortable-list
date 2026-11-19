import { computed, ref, toValue } from 'vue'
import type { MaybeRefOrGetter } from 'vue'

export interface SortableKeyboardOptions<T> {
  items: MaybeRefOrGetter<T[]>
  /** Arrows matching the visual direction move the preview. */
  orientation?: 'vertical' | 'horizontal'
  /** Human-readable item name used in announcements. */
  label?: (item: T, index: number) => string
  onReorder: (from: number, to: number) => void
  onAnnounce?: (message: string) => void
}

const TEXT_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT'])

/**
 * Keyboard counterpart to `useSortable`: Space or Enter picks an item up, the
 * arrows move the preview, Space or Enter drops it and Escape restores it.
 * Every step is announced through `onAnnounce` so a live region can relay it.
 */
export function useSortableKeyboard<T>(options: SortableKeyboardOptions<T>) {
  const items = computed(() => toValue(options.items))
  const orientation = computed(() => options.orientation ?? 'vertical')
  const pickedIndex = ref<number | null>(null)
  const previewIndex = ref<number | null>(null)

  function describe(index: number) {
    const item = items.value[index]
    const name = item !== undefined ? (options.label?.(item, index) ?? `item ${index + 1}`) : `item ${index + 1}`
    return name
  }

  function announce(message: string) {
    options.onAnnounce?.(message)
  }

  function release(picked: number) {
    pickedIndex.value = null
    previewIndex.value = null
    return picked
  }

  function step(delta: number) {
    const from = pickedIndex.value
    const current = previewIndex.value
    if (from === null || current === null) return

    const next = Math.min(items.value.length - 1, Math.max(0, current + delta))
    if (next === current) return

    previewIndex.value = next
    announce(`${describe(from)} moved to position ${next + 1} of ${items.value.length}.`)
  }

  function jump(to: 'start' | 'end') {
    const from = pickedIndex.value
    if (from === null) return

    const next = to === 'start' ? 0 : items.value.length - 1
    if (next === previewIndex.value) return

    previewIndex.value = next
    announce(`${describe(from)} moved to position ${next + 1} of ${items.value.length}.`)
  }

  function drop() {
    const from = pickedIndex.value
    const to = previewIndex.value
    if (from === null) return

    const name = describe(from)
    release(from)
    if (to === null || to === from) {
      announce(`${name} dropped in place.`)
      return
    }

    options.onReorder(from, to)
    announce(`${name} dropped at position ${to + 1} of ${items.value.length}.`)
  }

  function onKeydown(event: KeyboardEvent, index: number) {
    const target = event.target as HTMLElement | null
    if (target && (TEXT_TAGS.has(target.tagName) || target.isContentEditable)) return

    if (pickedIndex.value === null) {
      if (event.key !== ' ' && event.key !== 'Enter') return
      event.preventDefault()
      pickedIndex.value = index
      previewIndex.value = index
      announce(`Picked up ${describe(index)}. Use arrow keys to move, Space to drop, Escape to cancel.`)
      return
    }

    const [back, forward] = orientation.value === 'vertical'
      ? ['ArrowUp', 'ArrowDown']
      : ['ArrowLeft', 'ArrowRight']

    switch (event.key) {
      case back:
      case forward:
        event.preventDefault()
        step(event.key === back ? -1 : 1)
        break
      case 'Home':
        event.preventDefault()
        jump('start')
        break
      case 'End':
        event.preventDefault()
        jump('end')
        break
      case ' ':
      case 'Enter':
        event.preventDefault()
        drop()
        break
      case 'Escape': {
        event.preventDefault()
        const name = describe(index)
        release(index)
        announce(`Reorder cancelled, ${name} stays in place.`)
        break
      }
    }
  }

  function itemAttrs(index: number) {
    const picked = pickedIndex.value === index
    return {
      tabindex: 0,
      'aria-roledescription': 'sortable item',
      'aria-pressed': picked ? 'true' : 'false',
      'aria-posinset': index + 1,
      'aria-setsize': items.value.length,
      'data-sortable-preview': previewIndex.value === index ? 'true' : undefined,
      onKeydown: (event: KeyboardEvent) => onKeydown(event, index),
    }
  }

  return { pickedIndex, previewIndex, itemAttrs }
}
