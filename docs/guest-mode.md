# Guest Mode (Demo Mode)

## Overview

Guest mode allows users to explore the Macroflows app without creating an account. When in guest mode, all data is stored in an in-memory database with localStorage persistence, providing a fully functional demo experience.

## How It Works

### Entering Guest Mode

Users can enter guest mode by clicking "Continuar sem login" (Continue without login) on the login page. This:

1. Enables guest mode flag in the app state
2. Persists the guest mode state to localStorage
3. Navigates to the diet page
4. Loads seeded demo data

### Demo Data

Guest mode comes with pre-seeded realistic demo data:

- **User**: A demo user profile with basic settings
- **Foods**: 10 common Brazilian foods with accurate macros (rice, beans, chicken, eggs, etc.)
- **Day Diet**: Today's diet with 5 meals (Café da manhã, Almoço, Lanche, Janta, Pós janta)
- **Weight History**: 7 days of weight entries showing a gradual progression
- **Macro Profile**: A sample macro profile with typical cut diet settings

### Data Persistence

- Guest data is stored in localStorage under the key `macroflows_guest_db_v1`
- Data persists across page reloads and browser sessions
- Changes made in guest mode (adding foods, editing meals) are saved to localStorage

### Limitations

In guest mode:
- No data is sent to Supabase backend
- Data is not synced across devices
- Data will be lost if localStorage is cleared
- User cannot access features that require server-side authentication

## Exiting Guest Mode

Users can exit guest mode in two ways:

1. **Via Settings**: Navigate to Settings and click "Fazer login" (Login)
2. **Direct Login**: Sign in with Google from the login page

When exiting guest mode:
- Guest mode flag is disabled
- User is redirected to the login page
- Guest data remains in localStorage (can be manually reset)

## Resetting Demo Data

To reset the demo data to its initial seeded state:

1. Navigate to Settings
2. In the "Modo Demo" section, click "Resetar dados demo"
3. The page will reload with fresh demo data

This is useful for:
- Starting fresh with the demo
- Testing different scenarios
- Clearing any experimental data

## Technical Implementation

### Key Files

- `src/shared/guest/guestState.ts` - Guest mode state management
- `src/shared/guest/guestDatabase.ts` - In-memory database with seeding
- `src/shared/guest/guestConstants.ts` - Guest mode constants
- `src/modules/*/infrastructure/guest/*` - Guest gateway implementations

### Architecture

Guest mode uses the gateway pattern to switch between Supabase and in-memory implementations:

```
Repository
    ↓
Gateway Selector (checks guest mode)
    ↓
┌──────────────────────────────────────┐
│  If guest mode     If authenticated  │
│  ↓                 ↓                 │
│  Guest Gateway     Supabase Gateway  │
│  ↓                 ↓                 │
│  In-memory DB      Supabase DB       │
└──────────────────────────────────────┘
```

### Guest User ID

The guest user has a fixed UUID: `00000000-0000-0000-0000-000000000001`

This ensures consistency across all guest mode operations and data relationships.

## Development & Testing

### Running Tests

Guest mode has its own test suite:

```bash
pnpm vitest run src/shared/guest/tests/
```

### Debugging

To check if guest mode is active in the browser console:

```javascript
// Check guest mode state (requires access to module)
console.log(localStorage.getItem('macroflows_guest_mode'))

// View guest database
console.log(localStorage.getItem('macroflows_guest_db_v1'))
```

### Clearing Guest Data

To completely clear guest mode state:

```javascript
localStorage.removeItem('macroflows_guest_mode')
localStorage.removeItem('macroflows_guest_db_v1')
```

## Security Considerations

- Guest mode data never leaves the user's device
- No telemetry or analytics are sent in guest mode (when properly configured)
- Guest user ID is a fixed UUID that cannot conflict with real user IDs
- Guest data is isolated from authenticated user data
