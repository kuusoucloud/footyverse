-- Complete football database schema with teams, players, and all statistics
-- This creates the full ecosystem with proper relationships and data

-- Drop existing tables if they exist to recreate with proper structure
DROP TABLE IF EXISTS match_events CASCADE;
DROP TABLE IF EXISTS player_stats CASCADE;
DROP TABLE IF EXISTS team_stats CASCADE;
DROP TABLE IF EXISTS transfers CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS teams CASCADE;

-- Create teams table with all necessary fields
CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    tier INTEGER NOT NULL CHECK (tier BETWEEN 1 AND 5),
    elo_rating INTEGER DEFAULT 1500,
    transfer_budget BIGINT DEFAULT 0,
    wealth_category TEXT DEFAULT 'moderate',
    wins INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    goals_for INTEGER DEFAULT 0,
    goals_against INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    matches_played INTEGER DEFAULT 0,
    league_position INTEGER DEFAULT 0,
    form TEXT DEFAULT '',
    stadium_name TEXT,
    founded_year INTEGER,
    manager_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create players table with comprehensive stats
CREATE TABLE players (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,
    position TEXT NOT NULL CHECK (position IN ('GK', 'DEF', 'MID', 'FWD')),
    age INTEGER NOT NULL CHECK (age BETWEEN 16 AND 45),
    nationality TEXT DEFAULT 'England',
    overall_rating INTEGER DEFAULT 50 CHECK (overall_rating BETWEEN 1 AND 99),
    potential_rating INTEGER DEFAULT 50 CHECK (potential_rating BETWEEN 1 AND 99),
    market_value BIGINT DEFAULT 100000,
    wage INTEGER DEFAULT 1000,
    contract_end DATE,
    injury_status TEXT DEFAULT 'fit' CHECK (injury_status IN ('fit', 'injured', 'suspended')),
    form_rating INTEGER DEFAULT 5 CHECK (form_rating BETWEEN 1 AND 10),
    goals INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    yellow_cards INTEGER DEFAULT 0,
    red_cards INTEGER DEFAULT 0,
    matches_played INTEGER DEFAULT 0,
    minutes_played INTEGER DEFAULT 0,
    player_elo INTEGER DEFAULT 1200,
    preferred_foot TEXT DEFAULT 'right' CHECK (preferred_foot IN ('left', 'right', 'both')),
    height_cm INTEGER DEFAULT 180,
    weight_kg INTEGER DEFAULT 75,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create matches table
CREATE TABLE matches (
    id SERIAL PRIMARY KEY,
    home_team_id INTEGER REFERENCES teams(id),
    away_team_id INTEGER REFERENCES teams(id),
    home_team_name TEXT NOT NULL,
    away_team_name TEXT NOT NULL,
    home_score INTEGER DEFAULT 0,
    away_score INTEGER DEFAULT 0,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'completed', 'postponed')),
    minute INTEGER DEFAULT 0,
    match_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    competition_type TEXT DEFAULT 'league' CHECK (competition_type IN ('league', 'cup', 'playoff')),
    tier INTEGER DEFAULT 1,
    attendance INTEGER DEFAULT 0,
    referee TEXT,
    weather TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transfers table
CREATE TABLE transfers (
    id SERIAL PRIMARY KEY,
    player_id INTEGER REFERENCES players(id),
    from_team_id INTEGER REFERENCES teams(id),
    to_team_id INTEGER REFERENCES teams(id),
    transfer_fee BIGINT DEFAULT 0,
    transfer_type TEXT DEFAULT 'permanent' CHECK (transfer_type IN ('permanent', 'loan', 'free')),
    contract_length INTEGER DEFAULT 3,
    wage_increase BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transfer windows table
CREATE TABLE transfer_windows (
    id SERIAL PRIMARY KEY,
    window_type TEXT NOT NULL CHECK (window_type IN ('summer', 'winter')),
    is_active BOOLEAN DEFAULT false,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create match events table for detailed match tracking
CREATE TABLE match_events (
    id SERIAL PRIMARY KEY,
    match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
    player_id INTEGER REFERENCES players(id),
    team_id INTEGER REFERENCES teams(id),
    event_type TEXT NOT NULL CHECK (event_type IN ('goal', 'assist', 'yellow_card', 'red_card', 'substitution')),
    minute INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert teams for all 5 tiers
INSERT INTO teams (name, tier, elo_rating, transfer_budget, wealth_category, stadium_name, founded_year, manager_name) VALUES
-- Tier 1 (Premier League equivalent) - 20 teams
('Manchester City', 1, 2100, 200000000, 'mega_rich', 'Etihad Stadium', 1880, 'Pep Guardiola'),
('Arsenal', 1, 2050, 150000000, 'mega_rich', 'Emirates Stadium', 1886, 'Mikel Arteta'),
('Liverpool', 1, 2080, 180000000, 'mega_rich', 'Anfield', 1892, 'Jurgen Klopp'),
('Chelsea', 1, 2020, 170000000, 'mega_rich', 'Stamford Bridge', 1905, 'Mauricio Pochettino'),
('Manchester United', 1, 1980, 160000000, 'rich', 'Old Trafford', 1878, 'Erik ten Hag'),
('Newcastle United', 1, 1950, 140000000, 'rich', 'St James Park', 1892, 'Eddie Howe'),
('Tottenham', 1, 1940, 130000000, 'rich', 'Tottenham Hotspur Stadium', 1882, 'Ange Postecoglou'),
('Brighton', 1, 1900, 80000000, 'moderate', 'Amex Stadium', 1901, 'Roberto De Zerbi'),
('Aston Villa', 1, 1920, 90000000, 'moderate', 'Villa Park', 1874, 'Unai Emery'),
('West Ham', 1, 1880, 70000000, 'moderate', 'London Stadium', 1895, 'David Moyes'),
('Crystal Palace', 1, 1850, 50000000, 'limited', 'Selhurst Park', 1905, 'Roy Hodgson'),
('Fulham', 1, 1840, 45000000, 'limited', 'Craven Cottage', 1879, 'Marco Silva'),
('Brentford', 1, 1830, 40000000, 'limited', 'Brentford Community Stadium', 1889, 'Thomas Frank'),
('Wolves', 1, 1820, 35000000, 'limited', 'Molineux Stadium', 1877, 'Gary ONeil'),
('Everton', 1, 1810, 30000000, 'poor', 'Goodison Park', 1878, 'Sean Dyche'),
('Nottingham Forest', 1, 1800, 25000000, 'poor', 'City Ground', 1865, 'Nuno Espirito Santo'),
('Bournemouth', 1, 1790, 20000000, 'poor', 'Vitality Stadium', 1899, 'Andoni Iraola'),
('Sheffield United', 1, 1780, 15000000, 'very_poor', 'Bramall Lane', 1889, 'Chris Wilder'),
('Burnley', 1, 1770, 12000000, 'very_poor', 'Turf Moor', 1882, 'Vincent Kompany'),
('Luton Town', 1, 1760, 10000000, 'very_poor', 'Kenilworth Road', 1885, 'Rob Edwards'),

-- Tier 2 (Championship equivalent) - 20 teams
('Leicester City', 2, 1750, 50000000, 'rich', 'King Power Stadium', 1884, 'Enzo Maresca'),
('Leeds United', 2, 1740, 45000000, 'moderate', 'Elland Road', 1919, 'Daniel Farke'),
('Southampton', 2, 1730, 40000000, 'moderate', 'St Marys Stadium', 1885, 'Russell Martin'),
('Ipswich Town', 2, 1720, 35000000, 'moderate', 'Portman Road', 1878, 'Kieran McKenna'),
('West Bromwich', 2, 1710, 30000000, 'limited', 'The Hawthorns', 1878, 'Carlos Corberan'),
('Middlesbrough', 2, 1700, 25000000, 'limited', 'Riverside Stadium', 1876, 'Michael Carrick'),
('Norwich City', 2, 1690, 22000000, 'limited', 'Carrow Road', 1902, 'David Wagner'),
('Coventry City', 2, 1680, 20000000, 'limited', 'Coventry Building Society Arena', 1883, 'Mark Robins'),
('Hull City', 2, 1670, 18000000, 'poor', 'MKM Stadium', 1904, 'Liam Rosenior'),
('Preston North End', 2, 1660, 16000000, 'poor', 'Deepdale', 1880, 'Ryan Lowe'),
('Swansea City', 2, 1650, 15000000, 'poor', 'Swansea.com Stadium', 1912, 'Michael Duff'),
('Cardiff City', 2, 1640, 14000000, 'poor', 'Cardiff City Stadium', 1899, 'Erol Bulut'),
('Millwall', 2, 1630, 12000000, 'very_poor', 'The Den', 1885, 'Gary Rowett'),
('Blackburn Rovers', 2, 1620, 11000000, 'very_poor', 'Ewood Park', 1875, 'Jon Dahl Tomasson'),
('Stoke City', 2, 1610, 10000000, 'very_poor', 'bet365 Stadium', 1863, 'Alex Neil'),
('Sheffield Wednesday', 2, 1600, 9000000, 'very_poor', 'Hillsborough Stadium', 1867, 'Danny Rohl'),
('Queens Park Rangers', 2, 1590, 8000000, 'very_poor', 'Loftus Road', 1882, 'Gareth Ainsworth'),
('Plymouth Argyle', 2, 1580, 7000000, 'very_poor', 'Home Park', 1886, 'Steven Schumacher'),
('Watford', 2, 1570, 6000000, 'very_poor', 'Vicarage Road', 1881, 'Valerien Ismael'),
('Rotherham United', 2, 1560, 5000000, 'very_poor', 'AESSEAL New York Stadium', 1925, 'Matt Taylor'),

-- Tier 3 (League One equivalent) - 20 teams
('Birmingham City', 3, 1550, 4000000, 'limited', 'St Andrews', 1875, 'John Eustace'),
('Wrexham', 3, 1540, 3500000, 'limited', 'Racecourse Ground', 1864, 'Phil Parkinson'),
('Bolton Wanderers', 3, 1530, 3000000, 'poor', 'Toughsheet Community Stadium', 1874, 'Ian Evatt'),
('Barnsley', 3, 1520, 2800000, 'poor', 'Oakwell', 1887, 'Neill Collins'),
('Stockport County', 3, 1510, 2500000, 'poor', 'Edgeley Park', 1883, 'Dave Challinor'),
('Wycombe Wanderers', 3, 1500, 2200000, 'poor', 'Adams Park', 1887, 'Matt Bloomfield'),
('Lincoln City', 3, 1490, 2000000, 'very_poor', 'LNER Stadium', 1884, 'Mark Kennedy'),
('Mansfield Town', 3, 1480, 1800000, 'very_poor', 'Field Mill', 1897, 'Nigel Clough'),
('Exeter City', 3, 1470, 1600000, 'very_poor', 'St James Park', 1904, 'Gary Caldwell'),
('Peterborough United', 3, 1460, 1500000, 'very_poor', 'Weston Homes Stadium', 1934, 'Darren Ferguson'),
('Charlton Athletic', 3, 1450, 1400000, 'very_poor', 'The Valley', 1905, 'Michael Appleton'),
('Reading', 3, 1440, 1300000, 'very_poor', 'Select Car Leasing Stadium', 1871, 'Ruben Selles'),
('Stevenage', 3, 1430, 1200000, 'very_poor', 'Lamex Stadium', 1976, 'Steve Evans'),
('Northampton Town', 3, 1420, 1100000, 'very_poor', 'Sixfields Stadium', 1897, 'Jon Brady'),
('Leyton Orient', 3, 1410, 1000000, 'very_poor', 'Brisbane Road', 1881, 'Richie Wellens'),
('Crawley Town', 3, 1400, 900000, 'very_poor', 'Broadfield Stadium', 1896, 'Kevin Betsy'),
('Bristol Rovers', 3, 1390, 800000, 'very_poor', 'Memorial Stadium', 1883, 'Matt Taylor'),
('Shrewsbury Town', 3, 1380, 700000, 'very_poor', 'New Meadow', 1886, 'Matt Taylor'),
('Cambridge United', 3, 1370, 600000, 'very_poor', 'Abbey Stadium', 1912, 'Mark Bonner'),
('Burton Albion', 3, 1360, 500000, 'very_poor', 'Pirelli Stadium', 1950, 'Dino Maamria'),

-- Tier 4 (League Two equivalent) - 20 teams
('Notts County', 4, 1350, 400000, 'very_poor', 'Meadow Lane', 1862, 'Luke Williams'),
('MK Dons', 4, 1340, 380000, 'very_poor', 'Stadium MK', 2004, 'Mark Jackson'),
('Doncaster Rovers', 4, 1330, 360000, 'very_poor', 'Eco-Power Stadium', 1879, 'Grant McCann'),
('Crewe Alexandra', 4, 1320, 340000, 'very_poor', 'Mornflake Stadium', 1877, 'Lee Bell'),
('AFC Wimbledon', 4, 1310, 320000, 'very_poor', 'Plough Lane', 2002, 'Johnnie Jackson'),
('Grimsby Town', 4, 1300, 300000, 'very_poor', 'Blundell Park', 1878, 'Paul Hurst'),
('Bradford City', 4, 1290, 280000, 'very_poor', 'Valley Parade', 1903, 'Mark Hughes'),
('Salford City', 4, 1280, 260000, 'very_poor', 'Peninsula Stadium', 1940, 'Neil Wood'),
('Tranmere Rovers', 4, 1270, 240000, 'very_poor', 'Prenton Park', 1884, 'Micky Mellon'),
('Harrogate Town', 4, 1260, 220000, 'very_poor', 'EnviroVent Stadium', 1914, 'Simon Weaver'),
('Colchester United', 4, 1250, 200000, 'very_poor', 'JobServe Community Stadium', 1937, 'Danny Cowley'),
('Swindon Town', 4, 1240, 180000, 'very_poor', 'County Ground', 1881, 'Mark Kennedy'),
('Walsall', 4, 1230, 160000, 'very_poor', 'Poundland Bescot Stadium', 1888, 'Michael Flynn'),
('Newport County', 4, 1220, 140000, 'very_poor', 'Rodney Parade', 1912, 'Graham Coughlan'),
('Gillingham', 4, 1210, 120000, 'very_poor', 'Priestfield Stadium', 1893, 'Neil Harris'),
('Accrington Stanley', 4, 1200, 100000, 'very_poor', 'Crown Ground', 1968, 'John Coleman'),
('Morecambe', 4, 1190, 90000, 'very_poor', 'Mazuma Stadium', 1920, 'Derek Adams'),
('Barrow', 4, 1180, 80000, 'very_poor', 'Holker Street', 1901, 'Pete Wild'),
('Fleetwood Town', 4, 1170, 70000, 'very_poor', 'Highbury Stadium', 1997, 'Charlie Adam'),
('Carlisle United', 4, 1160, 60000, 'very_poor', 'Brunton Park', 1904, 'Paul Simpson'),

-- Tier 5 (National League equivalent) - 20 teams
('Chesterfield', 5, 1150, 50000, 'very_poor', 'Technique Stadium', 1866, 'Paul Cook'),
('York City', 5, 1140, 45000, 'very_poor', 'LNER Community Stadium', 1922, 'John Askey'),
('Oldham Athletic', 5, 1130, 40000, 'very_poor', 'Boundary Park', 1895, 'Micky Mellon'),
('Solihull Moors', 5, 1120, 35000, 'very_poor', 'ARMCO Arena', 2007, 'Andy Whing'),
('Gateshead', 5, 1110, 30000, 'very_poor', 'Gateshead International Stadium', 1977, 'Rob Elliot'),
('Barnet', 5, 1100, 28000, 'very_poor', 'The Hive London', 1888, 'Dean Brennan'),
('Altrincham', 5, 1090, 26000, 'very_poor', 'Moss Lane', 1891, 'Phil Parkinson'),
('Eastleigh', 5, 1080, 24000, 'very_poor', 'Silverlake Stadium', 1946, 'Lee Bradbury'),
('Dagenham & Redbridge', 5, 1070, 22000, 'very_poor', 'Chigwell Construction Stadium', 1992, 'Daryl McMahon'),
('Southend United', 5, 1060, 20000, 'very_poor', 'Roots Hall', 1906, 'Kevin Maher'),
('Woking', 5, 1050, 18000, 'very_poor', 'Laithwaite Community Stadium', 1889, 'Michael Doyle'),
('Halifax Town', 5, 1040, 16000, 'very_poor', 'The Shay', 1911, 'Chris Millington'),
('Dorking Wanderers', 5, 1030, 14000, 'very_poor', 'Meadowbank', 1999, 'Marc White'),
('Ebbsfleet United', 5, 1020, 12000, 'very_poor', 'Stonebridge Road', 2007, 'Dennis Kutrieb'),
('Aldershot Town', 5, 1010, 10000, 'very_poor', 'EBB Stadium', 1992, 'Tommy Widdrington'),
('Maidenhead United', 5, 1000, 9000, 'very_poor', 'York Road', 1870, 'Alan Devonshire'),
('Wealdstone', 5, 990, 8000, 'very_poor', 'Grosvenor Vale', 1899, 'Stuart Maynard'),
('Boreham Wood', 5, 980, 7000, 'very_poor', 'Meadow Park', 1948, 'Luke Garrard'),
('Bromley', 5, 970, 6000, 'very_poor', 'Hayes Lane', 1892, 'Andy Woodman'),
('Fylde', 5, 960, 5000, 'very_poor', 'Mill Farm', 1988, 'Chris Beech');

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE teams;
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
ALTER PUBLICATION supabase_realtime ADD TABLE transfers;
ALTER PUBLICATION supabase_realtime ADD TABLE match_events;

-- Create indexes for better performance
CREATE INDEX idx_teams_tier ON teams(tier);
CREATE INDEX idx_teams_points ON teams(points DESC);
CREATE INDEX idx_players_team ON players(team_id);
CREATE INDEX idx_players_position ON players(position);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_date ON matches(match_date);
CREATE INDEX idx_transfers_date ON transfers(created_at);