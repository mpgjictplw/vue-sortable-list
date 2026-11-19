import type { SortableAxis } from './types'

export interface Slot {
  start: number
  end: number
  middle: number
}

/**
 * Reads one slot per index, in index order. Unregistered indices stay `null`
 * so `v-if` branches and conditional rendering do not shift the result.
 */
export function readSlots(
  elements: Map<number, HTMLElement>,
  size: number,
  axis: SortableAxis,
): Array<Slot | null> {
  const slots: Array<Slot | null> = Array.from({ length: size }, () => null)

  for (const [index, element] of elements) {
    if (index >= size) continue
    const box = element.getBoundingClientRect()
    const start = axis === 'vertical' ? box.top : box.left
    const end = axis === 'vertical' ? box.bottom : box.right
    slots[index] = { start, end, middle: (start + end) / 2 }
  }

  return slots
}

/**
 * First slot whose midpoint lies past the pointer wins. The dragged element is
 * still in the DOM, so an index beyond `from` shifts down by one to account for
 * its removal at the destination.
 */
export function resolveIndex(
  slots: Array<Slot | null>,
  coordinate: number,
  from: number,
): number | null {
  if (slots.length === 0) return null

  let target = slots.length - 1
  for (let index = 0; index < slots.length; index += 1) {
    const slot = slots[index]
    if (!slot) continue
    if (coordinate < slot.middle) {
      target = index
      break
    }
  }

  return target > from ? target - 1 : target
}
