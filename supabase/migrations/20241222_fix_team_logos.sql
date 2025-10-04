-- Fix team logos with more reliable badge-style URLs
-- Using a simpler, more reliable approach for football crest-style logos

UPDATE teams 
SET logo_url = CASE 
  -- Animal/Nature themed teams get shield-style badges
  WHEN name ILIKE '%tiger%' OR name ILIKE '%lion%' OR name ILIKE '%eagle%' OR name ILIKE '%wolf%' OR name ILIKE '%bear%' OR name ILIKE '%hawk%' THEN
    'https://api.dicebear.com/7.x/identicon/svg?seed=' || REPLACE(LOWER(name), ' ', '') || '&backgroundColor=' || REPLACE(primary_color, '#', '') || '&foregroundColor=' || REPLACE(secondary_color, '#', '')
  
  -- City/Location teams get geometric badge patterns
  WHEN name ILIKE '%city%' OR name ILIKE '%town%' OR name ILIKE '%united%' OR name ILIKE '%fc%' THEN
    'https://api.dicebear.com/7.x/shapes/svg?seed=' || REPLACE(LOWER(name), ' ', '') || '&backgroundColor=' || REPLACE(primary_color, '#', '') || '&primaryColor=' || REPLACE(secondary_color, '#', '')
  
  -- Field/Nature locations get ring-style badges
  WHEN name ILIKE '%field%' OR name ILIKE '%wood%' OR name ILIKE '%dale%' OR name ILIKE '%moor%' OR name ILIKE '%park%' THEN
    'https://api.dicebear.com/7.x/rings/svg?seed=' || REPLACE(LOWER(name), ' ', '') || '&backgroundColor=' || REPLACE(primary_color, '#', '') || '&ringColor=' || REPLACE(secondary_color, '#', '')
  
  -- Athletic/Sports teams get pixel-art badge style
  WHEN name ILIKE '%athletic%' OR name ILIKE '%rovers%' OR name ILIKE '%wanderers%' OR name ILIKE '%albion%' THEN
    'https://api.dicebear.com/7.x/pixel-art/svg?seed=' || REPLACE(LOWER(name), ' ', '') || '&backgroundColor=' || REPLACE(primary_color, '#', '') || '&primaryColor=' || REPLACE(secondary_color, '#', '')
  
  -- Default: Use identicon style for remaining teams (most badge-like)
  ELSE
    'https://api.dicebear.com/7.x/identicon/svg?seed=' || REPLACE(LOWER(name), ' ', '') || '&backgroundColor=' || REPLACE(primary_color, '#', '') || '&foregroundColor=' || REPLACE(secondary_color, '#', '')
END;