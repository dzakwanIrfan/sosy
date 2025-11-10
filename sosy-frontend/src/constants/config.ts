export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  API_VERSION: '/api/v1',
  ENDPOINTS: {
    LOGIN: '/auth/login',
    TEST_TOKEN: '/auth/test-token',
    USERS: '/users',
    WP_USERS: '/wp-users',
    DAYLIGHT_TEST: '/daylight/test',
    DAYLIGHT_TEST_ME: '/daylight/test/me',
    DAYLIGHT_TESTS: '/daylight/tests',
    DAYLIGHT_MATCHING: '/daylight/matching',
  },
} as const;

export const APP_CONFIG = {
  APP_NAME: 'SOSY Dashboard',
  TOKEN_KEY: 'sosy_access_token',
  REFRESH_TOKEN_KEY: 'sosy_refresh_token',
} as const;