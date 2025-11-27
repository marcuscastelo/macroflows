# Clipboard Module

An in-application clipboard store for holding copied UnifiedItem(s), Meals, and Recipes.

## Features

- **RAM-only by default**: No data persists between sessions unless explicitly enabled
- **Optional persistence**: LocalStorage backend with TTL support (7 days default)
- **Privacy-first**: Persistence is opt-in and clear-on-logout can be configured
- **Pin entries**: Keep important entries from expiring
- **Type-safe**: Discriminated union for clipboard payloads
- **Reactive**: Subscribe to clipboard changes via SolidJS hooks

## Usage

### Basic Usage

```typescript
import { clipboardUseCases } from '~/modules/clipboard/application/clipboardUseCases'

// Copy to clipboard
const item = createUnifiedItem(...)
clipboardUseCases.copy(item)

// Read from clipboard
const latest = clipboardUseCases.read()
const all = clipboardUseCases.readAll()

// Clear clipboard
clipboardUseCases.clear() // Clears all unpinned entries
```

### Using in Components

```typescript
import { useClipboardStore } from '~/modules/clipboard/application/useClipboardStore'

function MyComponent() {
  const clipboard = useClipboardStore()
  
  return (
    <div>
      <button onClick={() => clipboard.copy(payload)}>Copy</button>
      <For each={clipboard.entries()}>
        {(entry) => <div>{entry.payload.value.name}</div>}
      </For>
    </div>
  )
}
```

### UI Components

```typescript
import { ClipboardPanel } from '~/sections/clipboard/components/ClipboardPanel'
import { ClipboardToggleButton } from '~/sections/clipboard/components/ClipboardToggleButton'

function App() {
  const [isPanelOpen, setIsPanelOpen] = createSignal(false)
  
  return (
    <>
      <ClipboardToggleButton onClick={() => setIsPanelOpen(true)} />
      <ClipboardPanel 
        isOpen={isPanelOpen()} 
        onClose={() => setIsPanelOpen(false)}
        onPaste={(entry) => console.log('Pasted:', entry)}
      />
    </>
  )
}
```

## Persistence

By default, the clipboard store uses RAM-only mode (NoOpPersistence). To enable persistence:

```typescript
import { createLocalStoragePersistence } from '~/modules/clipboard/infrastructure/clipboardPersistence'
import { createClipboardStore } from '~/modules/clipboard/application/clipboardStore'

const store = createClipboardStore({
  maxEntries: 20,
  persistence: createLocalStoragePersistence(7 * 24 * 60 * 60 * 1000) // 7 days TTL
})
```

**Privacy Notes:**
- Persistence is disabled by default
- When enabled, entries are stored in browser localStorage
- Entries expire after TTL (default: 7 days)
- Pinned entries never expire
- Clear-on-logout should be implemented in auth logout handlers
- Users should be informed about what data is persisted

## API Reference

### ClipboardStore

- `copy(payload: ClipboardPayload): void` - Copy a payload to the clipboard
- `read(): ClipboardEntry | null` - Read the most recent entry
- `readAll(): ClipboardEntry[]` - Read all entries
- `clear(): void` - Clear all unpinned entries
- `remove(id: string): void` - Remove a specific entry
- `togglePin(id: string): void` - Toggle pin status of an entry
- Reactivity: Use the `entries` signal for reactive updates in SolidJS components (see usage examples above)
- `cleanExpired(): void` - Clean expired entries (automatic if persistence enabled)

### ClipboardPayload Types

- `{ __type: 'UnifiedItem', ...itemFields }`
- `{ __type: 'Meal', ...mealFields }`
- `{ __type: 'Recipe', ...recipeFields }`

### ClipboardEntry

```typescript
{
  id: string           // Unique identifier
  payload: ClipboardPayload
  createdAt: number    // Unix timestamp
  pinned: boolean      // Whether entry is pinned
}
```

## Testing

The module includes comprehensive unit tests:
- ClipboardStore operations (20 tests)
- Persistence layer (13 tests)
- All edge cases and error handling

Run tests:
```bash
pnpm test src/modules/clipboard
```
