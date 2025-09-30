# TypeScript Patterns - Macroflows

## Critical Rules

### ❌ FORBIDDEN Patterns
- **No `implements` keyword**: Never use class implements interface
- **No `class` keyword**: Never use classes at all
- **No `interface` keyword**: Always use `type` instead

### ✅ Required Patterns

**Factory Functions with Object Returns:**
```typescript
// ✅ Good: Factory function returning object
export function createLocalStorageRepository(): StorageRepository {
  return {
    getCachedWeights: (userId: User['uuid']) => {
      // implementation
    },
    setCachedWeights: (userId: User['uuid'], weights: readonly unknown[]) => {
      // implementation  
    }
  }
}

// ❌ Forbidden: Classes
export class LocalStorageRepository implements StorageRepository {
  // NEVER DO THIS
}

// ❌ Forbidden: implements keyword
export class Repository implements Interface {
  // NEVER DO THIS
}
```

**Type Definitions:**
```typescript
// ✅ Always use `type`
export type StorageRepository = {
  getCachedWeights(userId: User['uuid']): readonly unknown[]
  setCachedWeights(userId: User['uuid'], weights: readonly unknown[]): void
}

// ❌ Never use interface
export interface StorageRepository {
  // NEVER DO THIS
}
```

## Architecture Principles
- **Pure functional patterns**
- **Factory functions only**
- **Object returns, not class instances**
- **Type contracts without inheritance**
- **Composition over any OOP patterns**