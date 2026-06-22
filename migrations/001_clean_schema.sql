-- Migration: Clean up schema for Next.js migration
-- Run this on your Plesk MySQL database BEFORE deploying the Next.js app
-- All data is preserved.

-- =============================================
-- 1. users table: remove legacy columns, add new
-- =============================================

-- Remove legacy session column (now handled by NextAuth JWT cookies)
ALTER TABLE users DROP COLUMN IF EXISTS session_token;

-- Remove legacy expiry column
ALTER TABLE users DROP COLUMN IF EXISTS token_expires_at;

-- Rename password_hash to password for cleaner naming
-- MySQL 8.0+ supports RENAME COLUMN
ALTER TABLE users CHANGE COLUMN password_hash password VARCHAR(255) NOT NULL;

-- Add provider column to distinguish auth methods
ALTER TABLE users ADD COLUMN IF NOT EXISTS provider VARCHAR(20) NOT NULL DEFAULT 'email' AFTER password;

-- Add email_verified_at for future email verification
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP NULL DEFAULT NULL AFTER provider;

-- Add updated_at timestamp with auto-update
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

-- Make theme and language NOT NULL with defaults
ALTER TABLE users MODIFY COLUMN theme VARCHAR(50) NOT NULL DEFAULT 'dark-gold';
ALTER TABLE users MODIFY COLUMN language VARCHAR(10) NOT NULL DEFAULT 'en';

-- Add index on email for faster lookups (already has UNIQUE, but explicit index helps)
ALTER TABLE users ADD INDEX IF NOT EXISTS idx_users_email (email);

-- =============================================
-- 2. sessions table: keep for API tokens, add updated_at
-- =============================================

ALTER TABLE sessions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER expires_at;

-- Index for session cleanup queries
ALTER TABLE sessions ADD INDEX IF NOT EXISTS idx_sessions_expires_at (expires_at);

-- =============================================
-- 3. dhikrs table: performance improvements
-- =============================================

-- Change total_count to BIGINT for future-proofing
ALTER TABLE dhikrs MODIFY COLUMN total_count BIGINT NOT NULL DEFAULT 0;

-- Add updated_at for audit trail
ALTER TABLE dhikrs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

-- Composite index for the daily reset query: UPDATE ... WHERE user_id = ? AND last_reset_date != ?
ALTER TABLE dhikrs ADD INDEX IF NOT EXISTS idx_dhikrs_user_reset (user_id, last_reset_date);

-- =============================================
-- Verify changes
-- =============================================

-- Run these SELECT statements to verify the migration:
-- DESCRIBE users;
-- DESCRIBE sessions;
-- DESCRIBE dhikrs;

-- =============================================
-- Rollback (if needed):
-- =============================================
-- ALTER TABLE users ADD COLUMN session_token VARCHAR(64) DEFAULT NULL;
-- ALTER TABLE users ADD COLUMN token_expires_at DATETIME DEFAULT NULL;
-- ALTER TABLE users CHANGE COLUMN password password_hash VARCHAR(255) NOT NULL;
-- ALTER TABLE users DROP COLUMN provider;
-- ALTER TABLE users DROP COLUMN email_verified_at;
-- ALTER TABLE users DROP COLUMN updated_at;
-- ALTER TABLE users MODIFY theme VARCHAR(50) DEFAULT NULL;
-- ALTER TABLE users MODIFY language VARCHAR(10) DEFAULT NULL;
-- ALTER TABLE sessions DROP COLUMN updated_at;
-- ALTER TABLE dhikrs MODIFY total_count INT NOT NULL DEFAULT 0;
-- ALTER TABLE dhikrs DROP COLUMN updated_at;
