import type { MaybeRefOrGetter } from 'vue'

export type SortableAxis = 'vertical' | 'horizontal'

export interface SortableOptions<T> {
  /** Rendered list. Only its length is read; the caller owns mutation. */
  items: MaybeRefOrGetter<T[]>
  /** Coordinate used to resolve the insertion slot. */
  axis?: SortableAxis
  /** CSS selector restricting where a drag may start. */
  handle?: string
  onStart?: (index: number) => void
  onReorder?: (from: number, to: number) => void
  onEnd?: () => void
}
