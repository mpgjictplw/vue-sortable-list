# vue-sortable-list

A small, dependency-free composable for pointer-driven sortable lists in Vue 3.

Native HTML5 drag events are awkward: `dragover` fires at a rate nobody controls, the
payload is a string, and touch support is close to zero. This composable uses pointer
events instead, resolves the insertion slot from element midpoints, and hands the final
`from`/`to` pair to *your* handler. The list itself stays owned by the caller, so the
composable never mutates arrays behind your back.

## Install

```bash
npm install vue-sortable-list
```

Requires Vue 3.3+ and a DOM. The package ships ESM only.

## Usage

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useSortable } from 'vue-sortable-list'

const cards = ref(['Draft', 'Review', 'Ship'])

function reorder(from: number, to: number) {
  const [moved] = cards.value.splice(from, 1)
  cards.value.splice(to, 0, moved)
}

const { itemAttrs, registerItem, draggingIndex, overIndex } = useSortable({
  items: cards,
  axis: 'vertical',
  onReorder: reorder,
})
</script>

<template>
  <ul class="board">
    <li
      v-for="(card, index) in cards"
      :key="card"
      v-bind="itemAttrs(index)"
      :ref="(el) => registerItem(index, el as HTMLElement | null)"
      :class="{ dragging: draggingIndex === index, target: overIndex === index }"
    >
      {{ card }}
    </li>
  </ul>
</template>

<style scoped>
.board li.dragging { opacity: 0.5; }
.board li.target { outline: 2px dashed #6b6b6b; }
</style>
```

### Options

| Option      | Type                              | Default      | Description                                                |
| ----------- | --------------------------------- | ------------ | ---------------------------------------------------------- |
| `items`     | `MaybeRefOrGetter<T[]>`           | —            | The rendered list; used for bounds only.                   |
| `axis`      | `'vertical' \| 'horizontal'`      | `'vertical'` | Which pointer coordinate decides the insertion slot.       |
| `handle`    | `string`                          | —            | CSS selector; drag starts only from a matching descendant. |
| `onStart`   | `(index: number) => void`         | —            | Called once the pointer goes down on a valid item.         |
| `onReorder` | `(from: number, to: number) => void` | —         | Called on release when the slot changed.                   |
| `onEnd`     | `() => void`                      | —            | Called on every release or cancel, even without a move.    |

### Returned values

| Name            | Type                                          | Description                                 |
| --------------- | --------------------------------------------- | ------------------------------------------- |
| `itemAttrs`     | `(index: number) => Record<string, unknown>`  | Aria/drag attributes plus the pointer handler; `v-bind` it. |
| `registerItem`  | `(index: number, el: HTMLElement \| null) => void` | Template ref callback.                 |
| `draggingIndex` | `Ref<number \| null>`                         | Index currently held by the pointer.        |
| `overIndex`     | `Ref<number \| null>`                         | Slot the item would land in on release.     |
| `cancel`        | `() => void`                                  | Aborts the current drag; `onReorder` is skipped. |

Slot content is entirely up to you: the composable renders nothing and reads no markup
beyond `getBoundingClientRect()` and an optional handle.

## Layout

```
src/types.ts        option and axis types
src/pointer.ts      slot geometry and insertion resolution
src/useSortable.ts  the composable
src/index.ts        public entry
```

## Gotchas

- Elements must be registered before a drag starts; `registerItem` runs on mount.
- Hidden or unmounted slots are skipped during resolution, so `v-if` lists are safe.
- A drop cancels on `pointercancel` (browser gesture takeover, touch scroll).

## License

MIT
