-- Generate generic international player names to keep it original
-- Create realistic but fictional names based on different nationalities

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
          WHEN 0 THEN 'James Mitchell'
          WHEN 1 THEN 'Oliver Thompson'
          WHEN 2 THEN 'Charlie Williams'
          WHEN 3 THEN 'Jack Harrison'
          WHEN 4 THEN 'Mason Clarke'
          WHEN 5 THEN 'Daniel Roberts'
          WHEN 6 THEN 'Philip Davies'
          WHEN 7 THEN 'Benjamin Parker'
          WHEN 8 THEN 'Joshua Edwards'
          WHEN 9 THEN 'Jacob Turner'
          WHEN 10 THEN 'Samuel Cooper'
          WHEN 11 THEN 'Callum Bailey'
          WHEN 12 THEN 'Jordan Hughes'
          WHEN 13 THEN 'Kyle Watson'
          WHEN 14 THEN 'John Stevens'
          WHEN 15 THEN 'Luke Morris'
          WHEN 16 THEN 'Jordan Foster'
          WHEN 17 THEN 'Connor Gray'
          WHEN 18 THEN 'Ivan Brooks'
          ELSE 'Oliver Ward'
        END
      
      -- Brazilian names  
      WHEN 'brazilian' THEN
        CASE (RANDOM() * 20)::INTEGER
          WHEN 0 THEN 'Vinicius Santos'
          WHEN 1 THEN 'Carlos Silva'
          WHEN 2 THEN 'Alexandre Oliveira'
          WHEN 3 THEN 'Fernando Costa'
          WHEN 4 THEN 'Gabriel Pereira'
          WHEN 5 THEN 'Rafael Lima'
          WHEN 6 THEN 'Bruno Alves'
          WHEN 7 THEN 'Antonio Ribeiro'
          WHEN 8 THEN 'Gabriel Martins'
          WHEN 9 THEN 'Lucas Ferreira'
          WHEN 10 THEN 'Rodrigo Souza'
          WHEN 11 THEN 'Eduardo Barbosa'
          WHEN 12 THEN 'Marcos Rocha'
          WHEN 13 THEN 'Thiago Mendes'
          WHEN 14 THEN 'Douglas Carvalho'
          WHEN 15 THEN 'Ricardo Gomes'
          WHEN 16 THEN 'Gabriel Nascimento'
          WHEN 17 THEN 'Felipe Araujo'
          WHEN 18 THEN 'Emerson Dias'
          ELSE 'Daniel Moreira'
        END
      
      -- Spanish names
      WHEN 'spanish' THEN
        CASE (RANDOM() * 20)::INTEGER
          WHEN 0 THEN 'Pedro Martinez'
          WHEN 1 THEN 'Gabriel Lopez'
          WHEN 2 THEN 'Fernando Garcia'
          WHEN 3 THEN 'Antonio Rodriguez'
          WHEN 4 THEN 'Daniel Gonzalez'
          WHEN 5 THEN 'Miguel Hernandez'
          WHEN 6 THEN 'Pablo Jimenez'
          WHEN 7 THEN 'Unai Morales'
          WHEN 8 THEN 'Roberto Ruiz'
          WHEN 9 THEN 'Alvaro Sanchez'
          WHEN 10 THEN 'Marco Diaz'
          WHEN 11 THEN 'Jose Vargas'
          WHEN 12 THEN 'Adrian Castro'
          WHEN 13 THEN 'Sergio Ramos'
          WHEN 14 THEN 'Jorge Vega'
          WHEN 15 THEN 'Gerard Moreno'
          WHEN 16 THEN 'Miguel Torres'
          WHEN 17 THEN 'Pablo Navarro'
          WHEN 18 THEN 'Cesar Blanco'
          ELSE 'David Herrera'
        END
      
      -- French names
      WHEN 'french' THEN
        CASE (RANDOM() * 20)::INTEGER
          WHEN 0 THEN 'Kevin Dubois'
          WHEN 1 THEN 'Antoine Martin'
          WHEN 2 THEN 'Karim Bernard'
          WHEN 3 THEN 'Nicolas Petit'
          WHEN 4 THEN 'Paul Durand'
          WHEN 5 THEN 'Olivier Moreau'
          WHEN 6 THEN 'Kingsley Laurent'
          WHEN 7 THEN 'Aurelien Simon'
          WHEN 8 THEN 'Jules Michel'
          WHEN 9 THEN 'William Leroy'
          WHEN 10 THEN 'David Roux'
          WHEN 11 THEN 'Theo Fournier'
          WHEN 12 THEN 'Hugo Girard'
          WHEN 13 THEN 'Adrien Bonnet'
          WHEN 14 THEN 'Youssouf Dupont'
          WHEN 15 THEN 'Christopher Lambert'
          WHEN 16 THEN 'Moussa Blanc'
          WHEN 17 THEN 'Randal Mercier'
          WHEN 18 THEN 'Benjamin Garnier'
          ELSE 'Olivier Rousseau'
        END
      
      -- Dutch names
      WHEN 'dutch' THEN
        CASE (RANDOM() * 15)::INTEGER
          WHEN 0 THEN 'Virgil van Berg'
          WHEN 1 THEN 'Frenkie de Vries'
          WHEN 2 THEN 'Memphis van der Berg'
          WHEN 3 THEN 'Cody Janssen'
          WHEN 4 THEN 'Xavi de Boer'
          WHEN 5 THEN 'Ryan van Dijk'
          WHEN 6 THEN 'Jurrien Bakker'
          WHEN 7 THEN 'Denzel Visser'
          WHEN 8 THEN 'Matthijs Smit'
          WHEN 9 THEN 'Wout van Leeuwen'
          WHEN 10 THEN 'Daley Mulder'
          WHEN 11 THEN 'Steven de Wit'
          WHEN 12 THEN 'Teun Bos'
          WHEN 13 THEN 'Marten Peters'
          ELSE 'Nathan van der Meer'
        END
      
      -- Argentinian names
      WHEN 'argentinian' THEN
        CASE (RANDOM() * 15)::INTEGER
          WHEN 0 THEN 'Lionel Gutierrez'
          WHEN 1 THEN 'Angel Fernandez'
          WHEN 2 THEN 'Lautaro Rodriguez'
          WHEN 3 THEN 'Paulo Morales'
          WHEN 4 THEN 'Rodrigo Herrera'
          WHEN 5 THEN 'Emiliano Vargas'
          WHEN 6 THEN 'Cristian Silva'
          WHEN 7 THEN 'Lisandro Perez'
          WHEN 8 THEN 'Alexis Gonzalez'
          WHEN 9 THEN 'Enzo Martinez'
          WHEN 10 THEN 'Julian Lopez'
          WHEN 11 THEN 'Nicolas Sanchez'
          WHEN 12 THEN 'Leandro Castro'
          WHEN 13 THEN 'Giovani Diaz'
          ELSE 'Marcos Torres'
        END
      
      -- German names
      WHEN 'german' THEN
        CASE (RANDOM() * 15)::INTEGER
          WHEN 0 THEN 'Joshua Mueller'
          WHEN 1 THEN 'Jamal Schmidt'
          WHEN 2 THEN 'Florian Weber'
          WHEN 3 THEN 'Kai Wagner'
          WHEN 4 THEN 'Serge Becker'
          WHEN 5 THEN 'Leon Schulz'
          WHEN 6 THEN 'Antonio Fischer'
          WHEN 7 THEN 'Manuel Hoffmann'
          WHEN 8 THEN 'Ilkay Richter'
          WHEN 9 THEN 'Timo Klein'
          WHEN 10 THEN 'Niklas Wolf'
          WHEN 11 THEN 'David Neumann'
          WHEN 12 THEN 'Jonas Schwarz'
          WHEN 13 THEN 'Leroy Zimmermann'
          ELSE 'Thomas Braun'
        END
      
      -- Italian names
      WHEN 'italian' THEN
        CASE (RANDOM() * 15)::INTEGER
          WHEN 0 THEN 'Federico Rossi'
          WHEN 1 THEN 'Niccolo Bianchi'
          WHEN 2 THEN 'Lorenzo Ferrari'
          WHEN 3 THEN 'Ciro Romano'
          WHEN 4 THEN 'Marco Colombo'
          WHEN 5 THEN 'Alessandro Ricci'
          WHEN 6 THEN 'Gianluigi Marino'
          WHEN 7 THEN 'Lorenzo Greco'
          WHEN 8 THEN 'Sandro Bruno'
          WHEN 9 THEN 'Moise Gallo'
          WHEN 10 THEN 'Alessandro Conti'
          WHEN 11 THEN 'Matteo De Luca'
          WHEN 12 THEN 'Davide Mancini'
          WHEN 13 THEN 'Gianluca Costa'
          ELSE 'Federico Giordano'
        END
      
      -- Portuguese names
      WHEN 'portuguese' THEN
        CASE (RANDOM() * 15)::INTEGER
          WHEN 0 THEN 'Cristiano Silva'
          WHEN 1 THEN 'Bruno Santos'
          WHEN 2 THEN 'Joao Pereira'
          WHEN 3 THEN 'Bernardo Costa'
          WHEN 4 THEN 'Ruben Oliveira'
          WHEN 5 THEN 'Diogo Ferreira'
          WHEN 6 THEN 'Rafael Rodrigues'
          WHEN 7 THEN 'Joao Almeida'
          WHEN 8 THEN 'Ruben Carvalho'
          WHEN 9 THEN 'Goncalo Sousa'
          WHEN 10 THEN 'Vitor Martins'
          WHEN 11 THEN 'Nuno Ribeiro'
          WHEN 12 THEN 'Diogo Lopes'
          WHEN 13 THEN 'Otavio Gomes'
          ELSE 'Pedro Dias'
        END
      
      -- Belgian names
      WHEN 'belgian' THEN
        CASE (RANDOM() * 12)::INTEGER
          WHEN 0 THEN 'Kevin Janssens'
          WHEN 1 THEN 'Romelu Peeters'
          WHEN 2 THEN 'Eden Claes'
          WHEN 3 THEN 'Youri Goossens'
          WHEN 4 THEN 'Jeremy Mertens'
          WHEN 5 THEN 'Amadou Willems'
          WHEN 6 THEN 'Yannick Jacobs'
          WHEN 7 THEN 'Axel Wouters'
          WHEN 8 THEN 'Timothy Maes'
          WHEN 9 THEN 'Leander Dubois'
          WHEN 10 THEN 'Thibaut Laurent'
          ELSE 'Charles Vermeulen'
        END
      
      ELSE players.name -- Keep existing name as fallback
    END
  FROM international_names n
  WHERE n.id = players.id
)
WHERE id IN (SELECT id FROM international_names);