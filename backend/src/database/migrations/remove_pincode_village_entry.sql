-- Migration: remove_pincode_village_entry.sql
-- Removes erroneous postal PIN code '364145' ingested into villages master table.

DELETE FROM villages 
WHERE name = '364145' 
   OR id = '9b3b9461-dbad-4bad-a8c8-b6801dc82094';
