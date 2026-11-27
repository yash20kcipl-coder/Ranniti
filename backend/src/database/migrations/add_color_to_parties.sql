-- Migration: add_color_to_parties.sql
-- Description: Add color column to parties table for political party branding, theme color, and chart visualizations.

ALTER TABLE parties 
  ADD COLUMN IF NOT EXISTS color VARCHAR(50);
