# Repository Pattern - Macroflows

## Architecture Standard

### ✅ Correct Repository Pattern

**Structure:**
1. **Standalone functions** - Each repository operation as separate function
2. **Factory function** - Returns object with function references
3. **No inline implementations** - Functions defined outside the factory

**Example:**
```typescript
// ✅ Good: Standalone functions + factory
function fetchUserWeights(userId: number) {
  // implementation
}

function insertWeight(newWeight: NewWeight) {
  // implementation  
}

export function createSupabaseWeightRepository(): WeightRepository {
  return {
    fetchUserWeights,    // Reference to function
    insertWeight,        // Reference to function
  }
}
```

**❌ Wrong Pattern:**
```typescript
// ❌ Bad: Inline implementations in factory
export function createRepository(): Repository {
  return {
    fetchData(id: number) {  // Inline implementation - WRONG
      // lots of code here
    },
    insertData(data: Data) { // Inline implementation - WRONG  
      // lots of code here
    }
  }
}
```

### Key Rules
- **Separate concerns**: Functions are standalone, factory just composes
- **Reusability**: Functions can be used independently if needed
- **Clean factory**: Factory should be small and only return references
- **No class/implements**: Pure functional approach
- **Consistent naming**: Function names match repository contract