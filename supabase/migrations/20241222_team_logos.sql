-- Add logo_url column to teams table and generate logos based on team names
ALTER TABLE teams ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Generate logo URLs using DiceBear API based on team names
-- This creates unique, consistent logos for each team based on their name
UPDATE teams 
SET logo_url = CASE 
  -- Animal/Nature themed teams get animal avatars
  WHEN name ILIKE '%tiger%' OR name ILIKE '%lion%' OR name ILIKE '%eagle%' OR name ILIKE '%wolf%' OR name ILIKE '%bear%' OR name ILIKE '%hawk%' THEN
    'https://api.dicebear.com/7.x/bottts/svg?seed=' || REPLACE(LOWER(name), ' ', '') || '&backgroundColor=' || REPLACE(primary_color, '#', '') || '&primaryColor=' || REPLACE(secondary_color, '#', '')
  
  -- City/Location teams get geometric patterns
  WHEN name ILIKE '%city%' OR name ILIKE '%town%' OR name ILIKE '%united%' OR name ILIKE '%fc%' THEN
    'https://api.dicebear.com/7.x/shapes/svg?seed=' || REPLACE(LOWER(name), ' ', '') || '&backgroundColor=' || REPLACE(primary_color, '#', '') || '&primaryColor=' || REPLACE(secondary_color, '#', '')
  
  -- Field/Nature locations get initials style
  WHEN name ILIKE '%field%' OR name ILIKE '%wood%' OR name ILIKE '%dale%' OR name ILIKE '%moor%' OR name ILIKE '%park%' THEN
    'https://api.dicebear.com/7.x/initials/svg?seed=' || REPLACE(LOWER(name), ' ', '') || '&backgroundColor=' || REPLACE(primary_color, '#', '') || '&textColor=' || REPLACE(secondary_color, '#', '')
  
  -- Athletic/Sports teams get fun avatars
  WHEN name ILIKE '%athletic%' OR name ILIKE '%rovers%' OR name ILIKE '%wanderers%' OR name ILIKE '%albion%' THEN
    'https://api.dicebear.com/7.x/fun-emoji/svg?seed=' || REPLACE(LOWER(name), ' ', '') || '&backgroundColor=' || REPLACE(primary_color, '#', '')
  
  -- Default: Use thumbs style for remaining teams
  ELSE
    'https://api.dicebear.com/7.x/thumbs/svg?seed=' || REPLACE(LOWER(name), ' ', '') || '&backgroundColor=' || REPLACE(primary_color, '#', '') || '&shapeColor=' || REPLACE(secondary_color, '#', '')
END
WHERE logo_url IS NULL;