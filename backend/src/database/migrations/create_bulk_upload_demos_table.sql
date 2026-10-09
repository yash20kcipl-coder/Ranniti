-- Migration: create_bulk_upload_demos_table.sql
-- Description: Dedicated sandbox and benchmark test table for bulk upload runs in Super Admin

CREATE TABLE IF NOT EXISTS bulk_upload_demos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_batch_id VARCHAR(100) NOT NULL DEFAULT 'DEFAULT_TEST_BATCH',
    row_number INTEGER,
    epic_number VARCHAR(50),
    full_name VARCHAR(255) NOT NULL,
    relative_name VARCHAR(255),
    gender VARCHAR(20),
    age INTEGER,
    mobile_number VARCHAR(20),
    email VARCHAR(255),
    booth_number VARCHAR(50),
    section_name VARCHAR(255),
    address TEXT,
    status VARCHAR(50) DEFAULT 'active',
    raw_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unq_bulk_demos_batch_epic UNIQUE (test_batch_id, epic_number)
);

-- Indexes for high-throughput benchmarking, duplicate testing, and fast cleanup
CREATE INDEX IF NOT EXISTS idx_bulk_upload_demos_batch_id ON bulk_upload_demos(test_batch_id);
CREATE INDEX IF NOT EXISTS idx_bulk_upload_demos_epic ON bulk_upload_demos(test_batch_id, epic_number);
CREATE INDEX IF NOT EXISTS idx_bulk_upload_demos_mobile ON bulk_upload_demos(mobile_number);
CREATE INDEX IF NOT EXISTS idx_bulk_upload_demos_created_at ON bulk_upload_demos(created_at DESC);
