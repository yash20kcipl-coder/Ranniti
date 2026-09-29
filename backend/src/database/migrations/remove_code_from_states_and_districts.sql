-- Migration: Remove code column from states and districts tables

ALTER TABLE states DROP COLUMN IF EXISTS code;
ALTER TABLE districts DROP COLUMN IF EXISTS code;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unq_state_name'
    ) THEN
        ALTER TABLE states ADD CONSTRAINT unq_state_name UNIQUE (name);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unq_district_state_name'
    ) THEN
        ALTER TABLE districts ADD CONSTRAINT unq_district_state_name UNIQUE (state_id, name);
    END IF;
END $$;
