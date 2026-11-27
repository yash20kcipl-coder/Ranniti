-- Migration: standardize_gariyadhar_labels.sql
-- Standardizes all references of Gariadhar / Gariyadhar to canonical 'Gariyadhar'
-- and merges duplicate talukas in Master and Tenant databases.

-- 1. Standardize Assembly Constituency (AC 101)
UPDATE assembly_constituencies 
SET name = 'Gariyadhar', updated_at = NOW() 
WHERE ac_number = 101 OR LOWER(name) IN ('gariadhar', 'gariyadhar');

-- 2. Consolidate and Deduplicate Talukas
DO $$
DECLARE
  v_canonical_taluka_id UUID;
  v_duplicate_taluka_id UUID;
BEGIN
  -- Prefer the taluka already named Gariyadhar or the oldest created
  SELECT id INTO v_canonical_taluka_id 
  FROM talukas 
  WHERE LOWER(name) = 'gariyadhar' 
  ORDER BY created_at ASC 
  LIMIT 1;

  IF v_canonical_taluka_id IS NULL THEN
    SELECT id INTO v_canonical_taluka_id 
    FROM talukas 
    WHERE LOWER(name) = 'gariadhar' 
    ORDER BY created_at ASC 
    LIMIT 1;
  END IF;

  IF v_canonical_taluka_id IS NOT NULL THEN
    -- Update canonical taluka name to 'Gariyadhar'
    UPDATE talukas 
    SET name = 'Gariyadhar', updated_at = NOW() 
    WHERE id = v_canonical_taluka_id;

    -- Re-link any villages pointing to any duplicate talukas
    FOR v_duplicate_taluka_id IN 
      SELECT id FROM talukas 
      WHERE (LOWER(name) IN ('gariadhar', 'gariyadhar')) AND id <> v_canonical_taluka_id
    LOOP
      UPDATE villages 
      SET taluka_id = v_canonical_taluka_id, updated_at = NOW() 
      WHERE taluka_id = v_duplicate_taluka_id;

      DELETE FROM talukas WHERE id = v_duplicate_taluka_id;
    END LOOP;
  END IF;
END $$;

-- 3. Standardize Villages with Gariadhar spelling
UPDATE villages 
SET name = REPLACE(name, 'Gariadhar', 'Gariyadhar'), updated_at = NOW() 
WHERE name ILIKE '%gariadhar%';

-- 4. Standardize Wards
UPDATE wards 
SET name = REPLACE(name, 'Gariadhar', 'Gariyadhar'), updated_at = NOW() 
WHERE name ILIKE '%gariadhar%';

-- 5. Standardize Voters table (taluka and village text columns)
UPDATE voters 
SET taluka = 'Gariyadhar', updated_at = NOW() 
WHERE LOWER(taluka) = 'gariadhar';

UPDATE voters 
SET village = REPLACE(village, 'Gariadhar', 'Gariyadhar'), updated_at = NOW() 
WHERE village ILIKE '%gariadhar%';
