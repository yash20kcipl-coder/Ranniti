-- Migration: Create Religions and Castes Master Tables

-- 1. Religions Master Table
CREATE TABLE IF NOT EXISTS religions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Castes & Subcastes Master Table
CREATE TABLE IF NOT EXISTS castes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(20) NOT NULL CHECK (category IN ('General', 'OBC', 'SC', 'ST', 'Other')),
    religion_id UUID REFERENCES religions(id) ON DELETE SET NULL,
    parent_caste_id UUID REFERENCES castes(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_castes_religion_id ON castes(religion_id);
CREATE INDEX IF NOT EXISTS idx_castes_parent_caste_id ON castes(parent_caste_id);
