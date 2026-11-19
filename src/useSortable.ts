import { computed, onScopeDispose, ref, toValue } from 'vue'
import { readSlots, resolveIndex } from './pointer'
import type { SortableOptions } from './types'

export function useSortable<T>(options: SortableOptions<T>) {
  const items = computed(() => toValue(options.items))
  const axis = computed(() => options.axis ?? 'vertical')
  const draggingIndex = ref<number | null>(null)
  const overIndex = ref<number | null>(null)

  const elements = new Map<number, HTMLElement>()

  function registerItem(index: number, element: HTMLElement | null) {
    if (element) elements.set(index, element)
    else elements.delete(index)
  }

  function onPointerDown(event: PointerEvent, index: number) {
    if (event.button !== 0) return

    const selector = options.handle
    if (selector) {
      const origin = event.target as Element | null
      const handle = origin?.closest(selector)
      if (!handle || !elements.get(index)?.contains(handle)) return
    }

    draggingIndex.value = index
    overIndex.value = index
    options.onStart?.(index)

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerCancel)
  }

  function onPointerMove(event: PointerEvent) {
    const from = draggingIndex.value
    if (from === null) return

    const coordinate = axis.value === 'vertical' ? event.clientY : event.clientX
    const next = resolveIndex(readSlots(elements, items.value.length, axis.value), coordinate, from)
    if (next !== null) overIndex.value = next
  }

  function onPointerUp() {
    const from = draggingIndex.value
    const to = overIndex.value
    stop()
    if (from !== null && to !== null && from !== to) options.onReorder?.(from, to)
    options.onEnd?.()
  }

  function onPointerCancel() {
    cancel()
  }

  function stop() {
    draggingIndex.value = null
    overIndex.value = null
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
    window.removeEventListener('pointercancel', onPointerCancel)
  }

  function cancel() {
    if (draggingIndex.value === null) return
    stop()
    options.onEnd?.()
  }

  function itemAttrs(index: number) {
    return {
      'data-sortable-index': index,
      'aria-grabbed': draggingIndex.value === index ? 'true' : 'false',
      onPointerdown: (event: PointerEvent) => onPointerDown(event, index),
    }
  }

  onScopeDispose(stop)

  return { draggingIndex, overIndex, registerItem, itemAttrs, cancel }
}
