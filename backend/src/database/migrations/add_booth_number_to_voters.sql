-- Migration: Add denormalized booth_number to voters for fast index-backed booth_number + serial_no sorting
-- Description: Eliminates cross-table JOIN + full-table sort in voter list pagination queries.

SET statement_timeout = 600000;

ALTER TABLE voters ADD COLUMN IF NOT EXISTS booth_number INTEGER;

-- Backfill booth_number from booths where missing or out of sync
UPDATE voters v
SET booth_number = b.booth_number
FROM booths b
WHERE v.booth_id = b.id
  AND v.booth_number IS DISTINCT FROM b.booth_number;

-- Keep voters.booth_number automatically synced on voter insert/update
CREATE OR REPLACE FUNCTION sync_voter_booth_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.booth_id IS NULL THEN
    NEW.booth_number := NULL;
  ELSIF TG_OP = 'INSERT' AND NEW.booth_number IS NULL THEN
    SELECT booth_number INTO NEW.booth_number FROM booths WHERE id = NEW.booth_id;
  ELSIF TG_OP = 'UPDATE' AND (NEW.booth_id IS DISTINCT FROM OLD.booth_id OR NEW.booth_number IS NULL) THEN
    SELECT booth_number INTO NEW.booth_number FROM booths WHERE id = NEW.booth_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_voters_sync_booth_number ON voters;
CREATE TRIGGER trg_voters_sync_booth_number
BEFORE INSERT OR UPDATE OF booth_id ON voters
FOR EACH ROW
EXECUTE FUNCTION sync_voter_booth_number();

-- Propagate booth_number changes from booths to voters
CREATE OR REPLACE FUNCTION propagate_booth_number_to_voters()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.booth_number IS DISTINCT FROM OLD.booth_number THEN
    UPDATE voters
    SET booth_number = NEW.booth_number
    WHERE booth_id = NEW.id
      AND booth_number IS DISTINCT FROM NEW.booth_number;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_booths_propagate_booth_number ON booths;
CREATE TRIGGER trg_booths_propagate_booth_number
AFTER UPDATE OF booth_number ON booths
FOR EACH ROW
EXECUTE FUNCTION propagate_booth_number_to_voters();

-- Composite indexes for index-ordered LIMIT/OFFSET pagination without sorting
CREATE INDEX IF NOT EXISTS idx_voters_booth_num_serial_id
  ON voters (booth_number ASC NULLS LAST, serial_no ASC NULLS LAST, id ASC);

CREATE INDEX IF NOT EXISTS idx_voters_ac_booth_num_serial_id
  ON voters (ac_id, booth_number ASC NULLS LAST, serial_no ASC NULLS LAST, id ASC);

CREATE INDEX IF NOT EXISTS idx_voters_booth_serial_id
  ON voters (booth_id, serial_no ASC NULLS LAST, id ASC);

ANALYZE voters;

RESET statement_timeout;
