export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  VERIFY_EMAIL: '/verify-email',
  CHAT: '/chat',
  TEST: '/test',
  API_DEBUG: '/api-debug',
} as const;

export const PUBLIC_ROUTES = [
  ROUTES.LOGIN,
  ROUTES.REGISTER,
  ROUTES.FORGOT_PASSWORD,
  ROUTES.RESET_PASSWORD,
  ROUTES.VERIFY_EMAIL,
] as const;

export const PROTECTED_ROUTES = [
  ROUTES.CHAT,
  ROUTES.TEST,
  ROUTES.API_DEBUG,
] as const; 