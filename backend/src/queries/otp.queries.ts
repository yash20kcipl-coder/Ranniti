import { query } from './dbPool';

export interface OtpRecord {
  id: string;
  mobile: string;
  otpCode: string;
  attempts: number;
  isVerified: boolean;
  expiresAt: Date;
  createdAt: Date;
}

export class OtpQueries {
  /**
   * Save a new OTP record into otp_verifications table
   */
  static async saveOtp(mobile: string, otpCode: string, expiryMinutes = 5): Promise<OtpRecord> {
    // Invalidate prior unverified OTPs for this mobile number
    await query(
      `UPDATE otp_verifications 
       SET is_verified = FALSE, expires_at = NOW() 
       WHERE mobile = $1 AND is_verified = FALSE AND expires_at > NOW()`,
      [mobile]
    );

    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
    const res = await query(
      `INSERT INTO otp_verifications (mobile, otp_code, attempts, is_verified, expires_at)
       VALUES ($1, $2, 0, FALSE, $3)
       RETURNING id, mobile, otp_code AS "otpCode", attempts, is_verified AS "isVerified", expires_at AS "expiresAt", created_at AS "createdAt"`,
      [mobile, otpCode, expiresAt]
    );
    return res.rows[0];
  }

  /**
   * Get active, unexpired, unverified OTP record for mobile
   */
  static async getActiveOtp(mobile: string): Promise<OtpRecord | null> {
    const res = await query(
      `SELECT id, mobile, otp_code AS "otpCode", attempts, is_verified AS "isVerified", expires_at AS "expiresAt", created_at AS "createdAt"
       FROM otp_verifications
       WHERE mobile = $1 AND is_verified = FALSE AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 1`,
      [mobile]
    );
    return res.rows[0] || null;
  }

  /**
   * Increment attempt counter for an OTP
   */
  static async incrementAttempts(otpId: string): Promise<number> {
    const res = await query(
      `UPDATE otp_verifications
       SET attempts = attempts + 1
       WHERE id = $1
       RETURNING attempts`,
      [otpId]
    );
    return res.rows[0]?.attempts || 0;
  }

  /**
   * Mark OTP as verified
   */
  static async markVerified(otpId: string): Promise<void> {
    await query(
      `UPDATE otp_verifications
       SET is_verified = TRUE
       WHERE id = $1`,
      [otpId]
    );
  }

  /**
   * Invalidate OTP when attempts limit is reached
   */
  static async invalidateOtp(otpId: string): Promise<void> {
    await query(
      `UPDATE otp_verifications
       SET expires_at = NOW()
       WHERE id = $1`,
      [otpId]
    );
  }

  /**
   * Count OTP send requests in the last X minutes (Rate Limiter check)
   */
  static async countRecentOtpRequests(mobile: string, windowMinutes = 10): Promise<number> {
    const res = await query(
      `SELECT COUNT(*)::int AS count
       FROM otp_verifications
       WHERE mobile = $1 AND created_at > NOW() - INTERVAL '${windowMinutes} minutes'`,
      [mobile]
    );
    return res.rows[0]?.count || 0;
  }
}
