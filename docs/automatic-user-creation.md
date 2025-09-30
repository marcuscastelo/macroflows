# Automatic Profile Creation for New OAuth Users

## Overview
This implementation adds automatic profile creation for users who log in via OAuth (Google) but don't have a corresponding entry in the `public.users` table.

## Problem Solved
Previously, when a new user logged in via OAuth:
1. An entry was created in `auth.users` 
2. No corresponding entry was created in `public.users`
3. The system would show an error and sign the user out

Now, the system automatically creates a complete user profile with sensible defaults.

## Implementation Details

### Files Created
1. **`src/modules/user/application/userCreationHelper.ts`**
   - Helper function to create default user data from OAuth session
   - Extracts user information from OAuth metadata (full_name, name, or email prefix)
   - Returns a properly typed `NewUser` object with all required fields

2. **`src/modules/user/application/tests/userCreationHelper.test.ts`**
   - Unit tests for user creation helper
   - Tests various scenarios: full_name, name, email prefix, and fallback cases
   - Validates birthdate format

3. **`src/modules/auth/tests/authUserCreation.test.ts`**
   - Integration test for auth flow with automatic user creation
   - Ensures the auth service initializes correctly
   - Validates error handling

### Files Modified
1. **`src/modules/auth/application/services/authService.ts`**
   - Updated `initializeAuth` function to automatically create user profile when missing
   - Added imports for `insertUserSilently` and `createDefaultUserFromAuthSession`
   - Changed logic from "sign out on missing user" to "create user profile"

2. **`src/modules/user/application/user.ts`**
   - Added `insertUserSilently` function for background user creation
   - This function doesn't show toast notifications (unlike `insertUser`)
   - Returns the created user or null on error

## Default User Values
When creating a new user profile automatically:
- **uuid**: From `auth.user.id`
- **name**: From OAuth metadata (`full_name` > `name` > email prefix > "User")
- **favorite_foods**: Empty array `[]`
- **diet**: `'normo'` (normal diet)
- **birthdate**: Current date in ISO format
- **gender**: `'male'` (default)
- **desired_weight**: `70` kg (default)

## Data Integrity
- **Only INSERT operations** are performed (no UPDATE or DELETE)
- All required fields are properly initialized
- User profile is fully functional upon creation
- Silent operation without UI notifications for background automatic creation

## Testing
- All existing tests pass (359 tests)
- Added 5 new tests for user creation helper
- Added 2 new integration tests for auth flow
- Total: 366 tests passing
- All checks (lint, type-check, test) pass successfully

## Usage Flow
1. User signs in with OAuth (Google)
2. System receives OAuth session with user data
3. System fetches all users from `public.users`
4. If user with matching UUID not found:
   - Create default user data from OAuth session
   - Silently insert into `public.users`
   - Set as current user
5. If creation fails:
   - Show error message
   - Sign user out

## Benefits
- Seamless onboarding for new OAuth users
- No manual user creation required
- Consistent initial state for all users
- Error handling for edge cases
- Fully tested implementation
