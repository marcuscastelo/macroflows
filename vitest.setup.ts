import { vi } from 'vitest'

// Mock logging module to prevent console output during tests
vi.mock('~/shared/utils/logging', () => ({
  __esModule: true,
  logging: {
    debug: (_message: string, _data?: Record<string, unknown>) => {},
    info: (_message: string, _data?: Record<string, unknown>) => {},
    warn: (_message: string, _data?: Record<string, unknown>) => {},
    error: (
      _message: string,
      _error?: unknown,
      _data?: Record<string, unknown>,
    ) => {},
  },
}))

vi.mock('solid-toast', () => ({
  __esModule: true,
  default: {
    error: () => {},
  },
}))

// Mock supabase client for all tests to avoid env dependency
vi.mock('~/legacy/utils/supabase', () => ({
  __esModule: true,
  default: {
    from: () => ({
      select: () => ({ data: [], error: null }),
      insert: () => ({ data: [], error: null }),
      update: () => ({ data: [], error: null }),
      delete: () => ({ data: [], error: null }),
      eq: () => ({ data: [], error: null }),
      order: () => ({ data: [], error: null }),
      in: () => ({ data: [], error: null }),
      not: () => ({ data: [], error: null }),
      ilike: () => ({ data: [], error: null }),
      limit: () => ({ data: [], error: null }),
    }),
    channel: () => ({ on: () => ({ subscribe: () => {} }) }),
  },
  registerSubapabaseRealtimeCallback: vi.fn(),
}))

// Mock env for all tests to avoid required env variables
vi.mock('~/shared/config/env', () => ({
  __esModule: true,
  default: {
    VITE_NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-key',
    VITE_NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    VITE_EXTERNAL_API_FOOD_PARAMS: 'test',
    VITE_EXTERNAL_API_REFERER: 'test',
    VITE_EXTERNAL_API_HOST: 'test',
    VITE_EXTERNAL_API_AUTHORIZATION: 'test',
    VITE_EXTERNAL_API_FOOD_ENDPOINT: 'test',
    VITE_EXTERNAL_API_EAN_ENDPOINT: 'test',
    VITE_EXTERNAL_API_BASE_URL: 'test',
  },
}))

// Mock localStorage globally for all tests
const localStorageMock = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(() => {}),
  removeItem: vi.fn(() => {}),
  clear: vi.fn(() => {}),
}

vi.stubGlobal('localStorage', localStorageMock)

// Silence all console output during tests
vi.spyOn(console, 'log').mockImplementation(() => {})
vi.spyOn(console, 'info').mockImplementation(() => {})
vi.spyOn(console, 'warn').mockImplementation(() => {})
vi.spyOn(console, 'error').mockImplementation(() => {})
vi.spyOn(console, 'debug').mockImplementation(() => {})
