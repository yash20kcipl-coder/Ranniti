export const AUTH_CONFIG = {
  /**
   * Set to true for test/demo mode (mock OTP '1234'), or false for production SMS endpoint.
   */
  IS_OTP_DEMO_MODE: true,
  DEMO_OTP: '1234',
  OTP_RESEND_TIMEOUT_SEC: 30,
  MPIN_LENGTH: 4,
} as const;
