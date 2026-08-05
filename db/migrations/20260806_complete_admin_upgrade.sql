-- Migration: Complete Admin Upgrade (Payouts, Delivery, Buyers, Settings, Commissions)
-- Created: 2026-08-06

-- ============================================
-- 1. PAYOUTS TABLE (tracks all seller payouts)
-- ============================================
CREATE TABLE IF NOT EXISTS payouts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  seller_id BIGINT UNSIGNED NOT NULL,
  order_codes JSON NOT NULL,
  amount INT NOT NULL,
  payout_method VARCHAR(32) NOT NULL,
  payout_number VARCHAR(32) NOT NULL,
  status ENUM('pending', 'processing', 'completed', 'failed', 'rolled_back') NOT NULL DEFAULT 'pending',
  reference VARCHAR(128) NOT NULL UNIQUE,
  flutterwave_response JSON,
  processed_at TIMESTAMP NULL,
  failed_reason TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_seller_id (seller_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. ADD delivery_partner_id TO ORDERS
-- ============================================
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS delivery_partner_id BIGINT UNSIGNED NULL AFTER payment_ref,
  ADD COLUMN IF NOT EXISTS delivery_assigned_at TIMESTAMP NULL AFTER delivery_partner_id,
  ADD COLUMN IF NOT EXISTS delivery_notes TEXT NULL AFTER delivery_assigned_at,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP NULL AFTER delivery_notes,
  ADD INDEX idx_delivery_partner (delivery_partner_id),
  ADD INDEX idx_delivered_at (delivered_at);

-- ============================================
-- 3. ADD platform_settings TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS platform_settings (
  id INT PRIMARY KEY DEFAULT 1,
  commission_rate DECIMAL(5,4) NOT NULL DEFAULT 0.0700,
  delivery_fee_base INT NOT NULL DEFAULT 3000,
  delivery_fee_per_km INT NOT NULL DEFAULT 500,
  platform_name VARCHAR(128) NOT NULL DEFAULT 'UG Souq',
  platform_email VARCHAR(255) DEFAULT 'support@ugsouq.com',
  enable_cash_on_delivery BOOLEAN NOT NULL DEFAULT TRUE,
  enable_mtn_momo BOOLEAN NOT NULL DEFAULT TRUE,
  enable_airtel_money BOOLEAN NOT NULL DEFAULT TRUE,
  min_order_amount INT NOT NULL DEFAULT 5000,
  free_delivery_threshold INT NOT NULL DEFAULT 100000,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_single_row CHECK (id = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO platform_settings (id) VALUES (1) ON DUPLICATE KEY UPDATE id = id;

-- ============================================
-- 4. ADD seller_contracts TABLE (for tracking contract versions)
-- ============================================
CREATE TABLE IF NOT EXISTS seller_contracts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  seller_id BIGINT UNSIGNED NOT NULL,
  contract_type ENUM('seller_agreement', 'commission_terms', 'delivery_terms') NOT NULL,
  version VARCHAR(16) NOT NULL DEFAULT '1.0',
  accepted BOOLEAN NOT NULL DEFAULT FALSE,
  accepted_at TIMESTAMP NULL,
  accepted_by ENUM('seller', 'admin') NOT NULL DEFAULT 'seller',
  admin_key_hash VARCHAR(64) NULL,
  ip_address VARCHAR(45) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_seller_id (seller_id),
  INDEX idx_contract_type (contract_type),
  UNIQUE KEY uk_seller_contract (seller_id, contract_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5. ADD notifications TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  type ENUM('new_order', 'payment_received', 'seller_registered', 'delivery_partner_registered', 'payout_completed', 'payout_failed', 'listing_pending', 'order_cancelled', 'low_stock') NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  entity_type VARCHAR(64) NULL,
  entity_id VARCHAR(64) NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_type (type),
  INDEX idx_is_read (is_read),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 6. ADD returns TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS returns (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  order_code VARCHAR(16) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(32) NOT NULL,
  reason TEXT NOT NULL,
  status ENUM('requested', 'approved', 'rejected', 'picked_up', 'refunded', 'closed') NOT NULL DEFAULT 'requested',
  refund_amount INT NOT NULL DEFAULT 0,
  admin_notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL,
  INDEX idx_order_id (order_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 7. ADD INDEXES for performance
-- ============================================
ALTER TABLE orders ADD INDEX IF NOT EXISTS idx_payment_status (payment_status);
ALTER TABLE orders ADD INDEX IF NOT EXISTS idx_status_created (status, created_at);
ALTER TABLE sellers ADD INDEX IF NOT EXISTS idx_status (status);
ALTER TABLE sellers ADD INDEX IF NOT EXISTS idx_verified (verified);
ALTER TABLE listings ADD INDEX IF NOT EXISTS idx_status (status);
ALTER TABLE products ADD INDEX IF NOT EXISTS idx_seller_category (seller_id, category);
