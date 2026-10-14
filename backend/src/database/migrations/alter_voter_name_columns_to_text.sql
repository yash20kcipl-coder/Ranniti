-- Migration: alter_voter_name_columns_to_text.sql
-- Description: Expand voter name, address, and location columns from VARCHAR(150) to TEXT to accommodate long OCR, compound names, and extended addresses without truncation errors.

ALTER TABLE voters 
  ALTER COLUMN first_name TYPE TEXT,
  ALTER COLUMN eng_first_name TYPE TEXT,
  ALTER COLUMN middle_name TYPE TEXT,
  ALTER COLUMN eng_middle_name TYPE TEXT,
  ALTER COLUMN surname TYPE TEXT,
  ALTER COLUMN eng_surname TYPE TEXT,
  ALTER COLUMN guardian_name TYPE TEXT,
  ALTER COLUMN subcaste_name TYPE TEXT,
  ALTER COLUMN taluka TYPE TEXT,
  ALTER COLUMN village TYPE TEXT;
