-- Generate international player names for tier 1 teams
-- Create realistic international names based on different nationalities

-- Arrays of international first names by nationality
WITH international_names AS (
  SELECT 
    p.id,
    p.team_id,
    t.tier,
    -- Randomly assign nationality based on tier
    CASE 
      WHEN t.tier = 1 THEN
        CASE (RANDOM() * 10)::INTEGER
          WHEN 0 THEN 'english'
          WHEN 1 THEN 'brazilian' 
          WHEN 2 THEN 'spanish'
          WHEN 3 THEN 'french'
          WHEN 4 THEN 'dutch'
          WHEN 5 THEN 'argentinian'
          WHEN 6 THEN 'german'
          WHEN 7 THEN 'italian'
          WHEN 8 THEN 'portuguese'
          ELSE 'belgian'
        END
      WHEN t.tier = 2 THEN
        CASE (RANDOM() * 6)::INTEGER
          WHEN 0 THEN 'english'
          WHEN 1 THEN 'brazilian'
          WHEN 2 THEN 'spanish'
          WHEN 3 THEN 'french'
          WHEN 4 THEN 'dutch'
          ELSE 'german'
        END
      ELSE 'english'
    END as nationality
  FROM players p
  JOIN teams t ON p.team_id = t.id
)
UPDATE players 
SET name = (
  SELECT 
    CASE n.nationality
      -- English names
      WHEN 'english' THEN
        CASE (RANDOM() * 20)::INTEGER
          WHEN 0 THEN 'Harry Kane'
          WHEN 1 THEN 'Marcus Rashford'
          WHEN 2 THEN 'Raheem Sterling'
          WHEN 3 THEN 'Jack Grealish'
          WHEN 4 THEN 'Mason Mount'
          WHEN 5 THEN 'Declan Rice'
          WHEN 6 THEN 'Phil Foden'
          WHEN 7 THEN 'Bukayo Saka'
          WHEN 8 THEN 'Jude Bellingham'
          WHEN 9 THEN 'Jadon Sancho'
          WHEN 10 THEN 'James Maddison'
          WHEN 11 THEN 'Callum Wilson'
          WHEN 12 THEN 'Jordan Henderson'
          WHEN 13 THEN 'Kyle Walker'
          WHEN 14 THEN 'John Stones'
          WHEN 15 THEN 'Luke Shaw'
          WHEN 16 THEN 'Jordan Pickford'
          WHEN 17 THEN 'Conor Gallagher'
          WHEN 18 THEN 'Ivan Toney'
          ELSE 'Ollie Watkins'
        END
      
      -- Brazilian names  
      WHEN 'brazilian' THEN
        CASE (RANDOM() * 20)::INTEGER
          WHEN 0 THEN 'Vinicius Junior'
          WHEN 1 THEN 'Casemiro'
          WHEN 2 THEN 'Alisson Becker'
          WHEN 3 THEN 'Fabinho'
          WHEN 4 THEN 'Gabriel Jesus'
          WHEN 5 THEN 'Raphinha'
          WHEN 6 THEN 'Bruno Guimaraes'
          WHEN 7 THEN 'Antony'
          WHEN 8 THEN 'Gabriel Martinelli'
          WHEN 9 THEN 'Lucas Paqueta'
          WHEN 10 THEN 'Rodrygo'
          WHEN 11 THEN 'Eder Militao'
          WHEN 12 THEN 'Marquinhos'
          WHEN 13 THEN 'Thiago Silva'
          WHEN 14 THEN 'Douglas Luiz'
          WHEN 15 THEN 'Richarlison'
          WHEN 16 THEN 'Gabriel Magalhaes'
          WHEN 17 THEN 'Fred'
          WHEN 18 THEN 'Emerson Royal'
          ELSE 'Danilo'
        END
      
      -- Spanish names
      WHEN 'spanish' THEN
        CASE (RANDOM() * 20)::INTEGER
          WHEN 0 THEN 'Pedri'
          WHEN 1 THEN 'Gavi'
          WHEN 2 THEN 'Ferran Torres'
          WHEN 3 THEN 'Ansu Fati'
          WHEN 4 THEN 'Dani Olmo'
          WHEN 5 THEN 'Mikel Oyarzabal'
          WHEN 6 THEN 'Pau Torres'
          WHEN 7 THEN 'Unai Simon'
          WHEN 8 THEN 'Rodri'
          WHEN 9 THEN 'Alvaro Morata'
          WHEN 10 THEN 'Marco Asensio'
          WHEN 11 THEN 'Jose Gaya'
          WHEN 12 THEN 'Aymeric Laporte'
          WHEN 13 THEN 'Sergio Busquets'
          WHEN 14 THEN 'Jordi Alba'
          WHEN 15 THEN 'Gerard Moreno'
          WHEN 16 THEN 'Mikel Merino'
          WHEN 17 THEN 'Pablo Sarabia'
          WHEN 18 THEN 'Cesar Azpilicueta'
          ELSE 'Dani Carvajal'
        END
      
      -- French names
      WHEN 'french' THEN
        CASE (RANDOM() * 20)::INTEGER
          WHEN 0 THEN 'Kylian Mbappe'
          WHEN 1 THEN 'Antoine Griezmann'
          WHEN 2 THEN 'Karim Benzema'
          WHEN 3 THEN 'Ngolo Kante'
          WHEN 4 THEN 'Paul Pogba'
          WHEN 5 THEN 'Ousmane Dembele'
          WHEN 6 THEN 'Kingsley Coman'
          WHEN 7 THEN 'Aurelien Tchouameni'
          WHEN 8 THEN 'Jules Kounde'
          WHEN 9 THEN 'William Saliba'
          WHEN 10 THEN 'Dayot Upamecano'
          WHEN 11 THEN 'Theo Hernandez'
          WHEN 12 THEN 'Hugo Lloris'
          WHEN 13 THEN 'Adrien Rabiot'
          WHEN 14 THEN 'Youssouf Fofana'
          WHEN 15 THEN 'Christopher Nkunku'
          WHEN 16 THEN 'Moussa Diaby'
          WHEN 17 THEN 'Randal Kolo Muani'
          WHEN 18 THEN 'Benjamin Pavard'
          ELSE 'Olivier Giroud'
        END
      
      -- Dutch names
      WHEN 'dutch' THEN
        CASE (RANDOM() * 15)::INTEGER
          WHEN 0 THEN 'Virgil van Dijk'
          WHEN 1 THEN 'Frenkie de Jong'
          WHEN 2 THEN 'Memphis Depay'
          WHEN 3 THEN 'Cody Gakpo'
          WHEN 4 THEN 'Xavi Simons'
          WHEN 5 THEN 'Ryan Gravenberch'
          WHEN 6 THEN 'Jurrien Timber'
          WHEN 7 THEN 'Denzel Dumfries'
          WHEN 8 THEN 'Matthijs de Ligt'
          WHEN 9 THEN 'Wout Weghorst'
          WHEN 10 THEN 'Daley Blind'
          WHEN 11 THEN 'Steven Bergwijn'
          WHEN 12 THEN 'Teun Koopmeiners'
          WHEN 13 THEN 'Marten de Roon'
          ELSE 'Nathan Ake'
        END
      
      -- Argentinian names
      WHEN 'argentinian' THEN
        CASE (RANDOM() * 15)::INTEGER
          WHEN 0 THEN 'Lionel Messi'
          WHEN 1 THEN 'Angel Di Maria'
          WHEN 2 THEN 'Lautaro Martinez'
          WHEN 3 THEN 'Paulo Dybala'
          WHEN 4 THEN 'Rodrigo De Paul'
          WHEN 5 THEN 'Emiliano Martinez'
          WHEN 6 THEN 'Cristian Romero'
          WHEN 7 THEN 'Lisandro Martinez'
          WHEN 8 THEN 'Alexis Mac Allister'
          WHEN 9 THEN 'Enzo Fernandez'
          WHEN 10 THEN 'Julian Alvarez'
          WHEN 11 THEN 'Nicolas Otamendi'
          WHEN 12 THEN 'Leandro Paredes'
          WHEN 13 THEN 'Giovani Lo Celso'
          ELSE 'Marcos Acuna'
        END
      
      -- German names
      WHEN 'german' THEN
        CASE (RANDOM() * 15)::INTEGER
          WHEN 0 THEN 'Joshua Kimmich'
          WHEN 1 THEN 'Jamal Musiala'
          WHEN 2 THEN 'Florian Wirtz'
          WHEN 3 THEN 'Kai Havertz'
          WHEN 4 THEN 'Serge Gnabry'
          WHEN 5 THEN 'Leon Goretzka'
          WHEN 6 THEN 'Antonio Rudiger'
          WHEN 7 THEN 'Manuel Neuer'
          WHEN 8 THEN 'Ilkay Gundogan'
          WHEN 9 THEN 'Timo Werner'
          WHEN 10 THEN 'Niklas Sule'
          WHEN 11 THEN 'David Raum'
          WHEN 12 THEN 'Jonas Hofmann'
          WHEN 13 THEN 'Leroy Sane'
          ELSE 'Thomas Muller'
        END
      
      -- Italian names
      WHEN 'italian' THEN
        CASE (RANDOM() * 15)::INTEGER
          WHEN 0 THEN 'Federico Chiesa'
          WHEN 1 THEN 'Niccolo Barella'
          WHEN 2 THEN 'Lorenzo Insigne'
          WHEN 3 THEN 'Ciro Immobile'
          WHEN 4 THEN 'Marco Verratti'
          WHEN 5 THEN 'Alessandro Bastoni'
          WHEN 6 THEN 'Gianluigi Donnarumma'
          WHEN 7 THEN 'Lorenzo Pellegrini'
          WHEN 8 THEN 'Sandro Tonali'
          WHEN 9 THEN 'Moise Kean'
          WHEN 10 THEN 'Alessandro Florenzi'
          WHEN 11 THEN 'Matteo Politano'
          WHEN 12 THEN 'Davide Frattesi'
          WHEN 13 THEN 'Gianluca Scamacca'
          ELSE 'Federico Dimarco'
        END
      
      -- Portuguese names
      WHEN 'portuguese' THEN
        CASE (RANDOM() * 15)::INTEGER
          WHEN 0 THEN 'Cristiano Ronaldo'
          WHEN 1 THEN 'Bruno Fernandes'
          WHEN 2 THEN 'Joao Felix'
          WHEN 3 THEN 'Bernardo Silva'
          WHEN 4 THEN 'Ruben Dias'
          WHEN 5 THEN 'Diogo Jota'
          WHEN 6 THEN 'Rafael Leao'
          WHEN 7 THEN 'Joao Cancelo'
          WHEN 8 THEN 'Ruben Neves'
          WHEN 9 THEN 'Goncalo Ramos'
          WHEN 10 THEN 'Vitinha'
          WHEN 11 THEN 'Nuno Mendes'
          WHEN 12 THEN 'Diogo Costa'
          WHEN 13 THEN 'Otavio'
          ELSE 'Pedro Neto'
        END
      
      -- Belgian names
      WHEN 'belgian' THEN
        CASE (RANDOM() * 12)::INTEGER
          WHEN 0 THEN 'Kevin De Bruyne'
          WHEN 1 THEN 'Romelu Lukaku'
          WHEN 2 THEN 'Eden Hazard'
          WHEN 3 THEN 'Youri Tielemans'
          WHEN 4 THEN 'Jeremy Doku'
          WHEN 5 THEN 'Amadou Onana'
          WHEN 6 THEN 'Yannick Carrasco'
          WHEN 7 THEN 'Axel Witsel'
          WHEN 8 THEN 'Timothy Castagne'
          WHEN 9 THEN 'Leander Dendoncker'
          WHEN 10 THEN 'Thibaut Courtois'
          ELSE 'Charles De Ketelaere'
        END
      
      ELSE players.name -- Keep existing name as fallback
    END
  FROM international_names n
  WHERE n.id = players.id
)
WHERE id IN (SELECT id FROM international_names);