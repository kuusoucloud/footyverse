-- Clean up player names to remove team names and numbers
-- Extract just the player's actual name from the full name field

UPDATE players 
SET name = TRIM(
  REGEXP_REPLACE(
    REGEXP_REPLACE(name, '^[^A-Za-z]*', ''), -- Remove leading non-letters (numbers, spaces)
    '^[A-Za-z\s]+ (FC|United|City|Athletic|Rovers|Town|Borough|County|Wanderers|Albion|Park|Moor|Field|Dale|Wood|Shire|Mere)\s+', -- Remove team name patterns
    '', 
    'g'
  )
)
WHERE name ~ '^[^A-Za-z]*[A-Za-z\s]+ (FC|United|City|Athletic|Rovers|Town|Borough|County|Wanderers|Albion|Park|Moor|Field|Dale|Wood|Shire|Mere)\s+';

-- For names that still have numbers at the end, remove them
UPDATE players 
SET name = TRIM(REGEXP_REPLACE(name, '\s+\d+$', ''))
WHERE name ~ '\s+\d+$';

-- For names that have team names at the beginning, remove them
UPDATE players 
SET name = TRIM(
  REGEXP_REPLACE(name, '^(Thornfield|Millbrook|Riverside|Bluewater|Redbridge|Blackmoor|Whitehaven|Seaside|Oakwood|Ironbridge|Crystaldale|Honeywood|Goldenvale|Bluehill|Greenwood|Cherryfield|Steelport|Moorland|Hatfield|Foxborough|Whitegate|Southport|Portfield|Westmoor|Middleton|Goldfield|Skybridge|Tigertown|Northgate|Swanmere|Millfield|Blackwater|Clayfield|Owlswood|Royalpark|Pilgrimstown|Hornbeam|Milltown|Bluefield|Dragonmere|Boltwood|Redfield|Stockbridge|Wychwood|Lincolnshire|Stagmoor|Exmoor|Peterfield|Charlwood|Readingdale|Stevendale|Northfield|Leytonstone|Crawfield|Bristolmere|Shrewdale|Cambridgeshire|Burtonwood|Nottshire|Miltondale|Doncasterfield|Crewmoor|Wimbledale|Grimfield|Bradfield|Saltonmere|Tranmere|Harrogate|Colchesterfield|Swindonmere|Walsingham|Newportdale|Gillingham|Accringdale|Morecambe|Barrowfield|Fleetwood|Carlisle|Chesterfield|Yorkdale|Oldhamshire|Solihullmere|Gateshead|Barnetfield|Altrincham|Eastleigh|Dagenham|Southendmere|Wokingdale|Halifaxshire|Dorkingmere|Ebbsfleet|Aldershotfield|Maidenhead|Wealdstone|Borehamwood|Bromleydale|Fyldemere)\s+', '')
)
WHERE name ~ '^(Thornfield|Millbrook|Riverside|Bluewater|Redbridge|Blackmoor|Whitehaven|Seaside|Oakwood|Ironbridge|Crystaldale|Honeywood|Goldenvale|Bluehill|Greenwood|Cherryfield|Steelport|Moorland|Hatfield|Foxborough|Whitegate|Southport|Portfield|Westmoor|Middleton|Goldfield|Skybridge|Tigertown|Northgate|Swanmere|Millfield|Blackwater|Clayfield|Owlswood|Royalpark|Pilgrimstown|Hornbeam|Milltown|Bluefield|Dragonmere|Boltwood|Redfield|Stockbridge|Wychwood|Lincolnshire|Stagmoor|Exmoor|Peterfield|Charlwood|Readingdale|Stevendale|Northfield|Leytonstone|Crawfield|Bristolmere|Shrewdale|Cambridgeshire|Burtonwood|Nottshire|Miltondale|Doncasterfield|Crewmoor|Wimbledale|Grimfield|Bradfield|Saltonmere|Tranmere|Harrogate|Colchesterfield|Swindonmere|Walsingham|Newportdale|Gillingham|Accringdale|Morecambe|Barrowfield|Fleetwood|Carlisle|Chesterfield|Yorkdale|Oldhamshire|Solihullmere|Gateshead|Barnetfield|Altrincham|Eastleigh|Dagenham|Southendmere|Wokingdale|Halifaxshire|Dorkingmere|Ebbsfleet|Aldershotfield|Maidenhead|Wealdstone|Borehamwood|Bromleydale|Fyldemere)\s+';

-- Add shirt_number column if it doesn't exist
ALTER TABLE players ADD COLUMN IF NOT EXISTS shirt_number INTEGER;

-- Add shirt numbers using a CTE approach
WITH numbered_players AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY team_id ORDER BY 
      CASE position 
        WHEN 'GK' THEN 1 
        WHEN 'DF' THEN 2 
        WHEN 'MF' THEN 3 
        WHEN 'FW' THEN 4 
      END, 
      name
    ) as new_shirt_number
  FROM players
)
UPDATE players 
SET shirt_number = numbered_players.new_shirt_number
FROM numbered_players
WHERE players.id = numbered_players.id;