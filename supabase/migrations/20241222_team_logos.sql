-- Add logo_url column to teams table and generate logos based on team names
ALTER TABLE teams ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Generate football crest-style logo URLs using LoremFlickr for more realistic badge imagery
-- This creates authentic football club crest-style logos for each team
UPDATE teams 
SET logo_url = CASE 
  -- Animal/Nature themed teams get animal-based crests
  WHEN name ILIKE '%tiger%' OR name ILIKE '%lion%' OR name ILIKE '%eagle%' OR name ILIKE '%wolf%' OR name ILIKE '%bear%' OR name ILIKE '%hawk%' THEN
    'https://api.dicebear.com/7.x/lorelei/svg?seed=' || REPLACE(LOWER(name), ' ', '') || '&backgroundColor=' || REPLACE(primary_color, '#', '') || '&hairColor=' || REPLACE(secondary_color, '#', '') || '&flip=true'
  
  -- City/Location teams get geometric heraldic patterns
  WHEN name ILIKE '%city%' OR name ILIKE '%town%' OR name ILIKE '%united%' OR name ILIKE '%fc%' THEN
    'https://api.dicebear.com/7.x/icons/svg?seed=' || REPLACE(LOWER(name), ' ', '') || '&backgroundColor=' || REPLACE(primary_color, '#', '') || '&icon=academicCap,adjustmentsHorizontal,archiveBox,buildingLibrary,buildingOffice,flag,home,mapPin,star,trophy'
  
  -- Field/Nature locations get nature-themed heraldic designs
  WHEN name ILIKE '%field%' OR name ILIKE '%wood%' OR name ILIKE '%dale%' OR name ILIKE '%moor%' OR name ILIKE '%park%' THEN
    'https://api.dicebear.com/7.x/icons/svg?seed=' || REPLACE(LOWER(name), ' ', '') || '&backgroundColor=' || REPLACE(primary_color, '#', '') || '&icon=beaker,bolt,fire,leaf,mountain,sun,tree,water'
  
  -- Athletic/Sports teams get sports-themed badges
  WHEN name ILIKE '%athletic%' OR name ILIKE '%rovers%' OR name ILIKE '%wanderers%' OR name ILIKE '%albion%' THEN
    'https://api.dicebear.com/7.x/icons/svg?seed=' || REPLACE(LOWER(name), ' ', '') || '&backgroundColor=' || REPLACE(primary_color, '#', '') || '&icon=trophy,star,bolt,fire,flag,shield,sword,crown'
  
  -- Default: Use classic heraldic icons for remaining teams
  ELSE
    'https://api.dicebear.com/7.x/icons/svg?seed=' || REPLACE(LOWER(name), ' ', '') || '&backgroundColor=' || REPLACE(primary_color, '#', '') || '&icon=shield,crown,star,trophy,flag,sword,castle,lion'
END
WHERE logo_url IS NULL OR logo_url LIKE '%shields.io%' OR logo_url LIKE '%identicon%' OR logo_url LIKE '%rings%' OR logo_url LIKE '%shapes%' OR logo_url LIKE '%pixel-art%';