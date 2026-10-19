export const AUTH_CONFIG = {
  /**
   * Set to true for test/demo mode (mock OTP '1234'), or false for production SMS endpoint.
   */
  MPIN_LENGTH: 4,
  DEMO_CREDENCIALS: {
    mobile: '9870032873',
    pass: '1234',
  },
  OTP_RESEND_TIMEOUT_SEC: 30,
  IS_OTP_DEMO_MODE: __DEV__ && true,
} as const;
