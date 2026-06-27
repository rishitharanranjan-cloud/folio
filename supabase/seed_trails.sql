-- Folio trail seeds — run once in Supabase SQL Editor after schema.sql

-- Trails
insert into public.trails (id, title, description, tag, stop_count, follower_count) values
(
  'a1000000-0000-0000-0000-000000000001',
  'Wong Kar-wai Universe',
  'The complete cinematic world of WKW — films, their soundtracks, and the novels that inspired them.',
  'filmmaker',
  6,
  0
),
(
  'a1000000-0000-0000-0000-000000000002',
  'The New Wave Gateway',
  'Five essential films that define French New Wave cinema. A perfect starting point.',
  'movement',
  5,
  0
),
(
  'a1000000-0000-0000-0000-000000000003',
  'Afrobeat Origins',
  'From Fela Kuti to the artists he inspired — trace the roots and reach of Afrobeat.',
  'genre',
  6,
  0
),
(
  'a1000000-0000-0000-0000-000000000004',
  'Toni Morrison Essential',
  'The five novels that define Morrison''s vision of Black American life, in reading order.',
  'author',
  5,
  0
),
(
  'a1000000-0000-0000-0000-000000000005',
  'Radiohead: The Arc',
  'Pablo Honey to A Moon Shaped Pool — the complete studio discography as a journey.',
  'artist',
  9,
  0
),
(
  'a1000000-0000-0000-0000-000000000006',
  'Magical Realism Foundations',
  'The novels that built the genre — García Márquez, Allende, Rushdie, Borges.',
  'genre',
  6,
  0
);

-- Trail stops — Wong Kar-wai Universe
insert into public.trail_stops (trail_id, position, media_type, title, creator, cover_colour, external_id) values
('a1000000-0000-0000-0000-000000000001', 1, 'film',  'Chungking Express',       'Wong Kar-wai', '#c84820', '11622'),
('a1000000-0000-0000-0000-000000000001', 2, 'film',  'In the Mood for Love',    'Wong Kar-wai', '#c83c14', '843'),
('a1000000-0000-0000-0000-000000000001', 3, 'film',  '2046',                    'Wong Kar-wai', '#8b1a10', '11476'),
('a1000000-0000-0000-0000-000000000001', 4, 'album', 'Days of Being Wild OST',  'Various',      '#6b4a2a', null),
('a1000000-0000-0000-0000-000000000001', 5, 'book',  'Days of Being Wild',      'Liu Yi-chang', '#4a6b8b', null),
('a1000000-0000-0000-0000-000000000001', 6, 'film',  'Happy Together',          'Wong Kar-wai', '#2a4a6b', '11480');

-- Trail stops — New Wave Gateway
insert into public.trail_stops (trail_id, position, media_type, title, creator, cover_colour, external_id) values
('a1000000-0000-0000-0000-000000000002', 1, 'film', 'Breathless',               'Jean-Luc Godard',   '#1a2a3a', '949'),
('a1000000-0000-0000-0000-000000000002', 2, 'film', 'The 400 Blows',            'François Truffaut', '#3a2a1a', '1949'),
('a1000000-0000-0000-0000-000000000002', 3, 'film', 'Hiroshima Mon Amour',      'Alain Resnais',     '#2a3a2a', '6972'),
('a1000000-0000-0000-0000-000000000002', 4, 'film', 'Jules and Jim',            'François Truffaut', '#4a3a2a', '4517'),
('a1000000-0000-0000-0000-000000000002', 5, 'film', 'Vivre Sa Vie',             'Jean-Luc Godard',   '#1a3a4a', '7085');

-- Trail stops — Toni Morrison Essential
insert into public.trail_stops (trail_id, position, media_type, title, creator, cover_colour, external_id) values
('a1000000-0000-0000-0000-000000000004', 1, 'book', 'The Bluest Eye',  'Toni Morrison', '#5a3a2a', null),
('a1000000-0000-0000-0000-000000000004', 2, 'book', 'Sula',            'Toni Morrison', '#3a5a4a', null),
('a1000000-0000-0000-0000-000000000004', 3, 'book', 'Song of Solomon', 'Toni Morrison', '#4a3a5a', null),
('a1000000-0000-0000-0000-000000000004', 4, 'book', 'Beloved',         'Toni Morrison', '#6a2a2a', null),
('a1000000-0000-0000-0000-000000000004', 5, 'book', 'Jazz',            'Toni Morrison', '#2a4a6a', null);

-- Trail stops — Radiohead Arc
insert into public.trail_stops (trail_id, position, media_type, title, creator, cover_colour, external_id) values
('a1000000-0000-0000-0000-000000000005', 1, 'album', 'Pablo Honey',       'Radiohead', '#5a7a9a', null),
('a1000000-0000-0000-0000-000000000005', 2, 'album', 'The Bends',         'Radiohead', '#3a5a7a', null),
('a1000000-0000-0000-0000-000000000005', 3, 'album', 'OK Computer',       'Radiohead', '#2a4a6a', null),
('a1000000-0000-0000-0000-000000000005', 4, 'album', 'Kid A',             'Radiohead', '#1a3a5a', null),
('a1000000-0000-0000-0000-000000000005', 5, 'album', 'Amnesiac',          'Radiohead', '#2a3a4a', null),
('a1000000-0000-0000-0000-000000000005', 6, 'album', 'Hail to the Thief', 'Radiohead', '#3a4a5a', null),
('a1000000-0000-0000-0000-000000000005', 7, 'album', 'In Rainbows',       'Radiohead', '#4a5a6a', null),
('a1000000-0000-0000-0000-000000000005', 8, 'album', 'The King of Limbs', 'Radiohead', '#5a6a7a', null),
('a1000000-0000-0000-0000-000000000005', 9, 'album', 'A Moon Shaped Pool','Radiohead', '#6a7a8a', null);
