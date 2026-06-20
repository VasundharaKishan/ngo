-- V35: Add refund tracking fields to donations table
ALTER TABLE donations ADD COLUMN refunded_at TIMESTAMP;
ALTER TABLE donations ADD COLUMN refund_reason VARCHAR(500);
ALTER TABLE donations ADD COLUMN stripe_refund_id VARCHAR(255);
