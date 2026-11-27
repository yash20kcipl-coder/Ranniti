-- Migration: Create Profession Categories and Specific Professions Master Tables
-- Up Migration: Canonical Master Tables for Professions

-- 1. Profession Categories Master
CREATE TABLE IF NOT EXISTS profession_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Case-insensitive unique index for profession categories
CREATE UNIQUE INDEX IF NOT EXISTS uq_profession_categories_lower_name
ON profession_categories (LOWER(TRIM(name)));

-- 2. Specific Professions Master
CREATE TABLE IF NOT EXISTS professions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES profession_categories(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unq_profession_category_name UNIQUE (category_id, name)
);

-- Case-insensitive unique index for professions per category
CREATE UNIQUE INDEX IF NOT EXISTS uq_professions_category_lower_name
ON professions (category_id, LOWER(TRIM(name)));

-- Performance index for foreign key lookups
CREATE INDEX IF NOT EXISTS idx_professions_category_id ON professions(category_id);
