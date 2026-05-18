/**
 * OTP Utility - Generate and manage OTP (One-Time Password)
 */

/**
 * Generate a random 6-digit OTP
 * @returns 6-digit OTP as string
 */
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Get OTP expiration time (10 minutes from now)
 * @returns Date object representing expiration time
 */
export const getOTPExpirationTime = (): Date => {
  const now = new Date();
  return new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes
};

/**
 * Check if OTP has expired
 * @param expirationTime - OTP expiration datetime
 * @returns true if expired, false if still valid
 */
export const isOTPExpired = (expirationTime: Date | undefined): boolean => {
  if (!expirationTime) return true;
  return new Date() > expirationTime;
};
