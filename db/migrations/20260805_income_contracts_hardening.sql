-- Income and contract hardening migration.

ALTER TABLE sellers
  ADD COLUMN IF NOT EXISTS commission_terms_accepted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS seller_contract_accepted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS commission_terms_accepted_at timestamp NULL,
  ADD COLUMN IF NOT EXISTS seller_contract_accepted_at timestamp NULL;

CREATE TABLE IF NOT EXISTS delivery_partners (
  id bigint unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY,
  full_name varchar(255) NOT NULL,
  phone varchar(32) NOT NULL,
  area varchar(128) NOT NULL,
  vehicle_type varchar(64) NOT NULL,
  payout_method varchar(32) NOT NULL,
  payout_number varchar(32) NOT NULL,
  contract_accepted boolean NOT NULL DEFAULT false,
  delivery_share_accepted boolean NOT NULL DEFAULT false,
  contract_accepted_at timestamp NULL,
  status enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS seller_ad_bookings (
  id bigint unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY,
  seller_id bigint unsigned NOT NULL,
  plan_type enum('weekly','monthly') NOT NULL,
  amount int NOT NULL,
  status enum('booked','paid','active','completed','cancelled') NOT NULL DEFAULT 'booked',
  notes varchar(255) NULL,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id bigint unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY,
  actor_tag varchar(32) NOT NULL,
  action varchar(64) NOT NULL,
  entity_type varchar(64) NOT NULL,
  entity_id varchar(64) NOT NULL,
  before_state text NULL,
  after_state text NULL,
  meta text NULL,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
