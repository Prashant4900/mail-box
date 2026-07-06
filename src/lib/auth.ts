/**
 * Authentication Configuration Constants
 *
 * This file acts as the single source of truth for all authentication-related
 * configuration rules, timeouts, and security settings to ensure that security
 * practices are applied consistently across the application.
 */

export const AUTH_CONFIG = {
  // Session Configuration
  session: {
    durationDays: 30, // How long a user remains logged in
    durationMs: 30 * 24 * 60 * 60 * 1000,
    cookieName: "auth_session",
  },

  // Tokens (Email Verification, Password Reset, etc.)
  tokens: {
    verificationExpiresInHours: 24, // How long an email verification link is valid
    resetPasswordExpiresInHours: 1, // How long a forgot password link is valid
  },

  // Security Policies
  security: {
    bcryptSaltRounds: 12, // Optimal balance between security and performance for password hashing
    maxLoginAttempts: 5, // Number of failed logins before lockout
    lockoutDurationMinutes: 15, // Lockout duration
  },

  // Role Based Access Control
  roles: {
    hierarchy: ["MEMBER", "ADMIN", "OWNER"] as const,
    default: "MEMBER",
  },
} as const;
