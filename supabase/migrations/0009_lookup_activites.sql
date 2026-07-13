-- Lot 4 — Vocabulaires contrôlés nécessaires au journal pédagogique.
-- Suit le même principe que roles_famille / statuts_appartenance_famille :
-- petites tables dédiées avec vraie intégrité référentielle (voir
-- Corrections-Schema-et-Lot1.md, A4), plutôt qu'une table générique.

create table if not exists contextes_activite (
  id      uuid primary key default gen_random_uuid(),
  code    text not null unique,
  libelle text not null,
  ordre   smallint,
  actif   boolean not null default true
);

insert into contextes_activite (code, libelle, ordre) values
  ('spontanee',   'Activité spontanée', 1),
  ('proposee',    'Activité proposée',  2),
  ('jeu_libre',   'Jeu libre',          3),
  ('quotidien',   'Vie quotidienne',    4),
  ('lecture',     'Lecture',            5),
  ('sortie',      'Sortie',             6),
  ('nature',      'Nature',             7),
  ('sport',       'Sport',              8),
  ('cuisine',     'Cuisine',            9),
  ('musique',     'Musique',           10),
  ('projet',      'Projet',            11),
  ('autre',       'Autre',             12)
on conflict (code) do nothing;

create table if not exists niveaux_autonomie (
  id      uuid primary key default gen_random_uuid(),
  code    text not null unique,
  libelle text not null,
  ordre   smallint,
  actif   boolean not null default true
);

insert into niveaux_autonomie (code, libelle, ordre) values
  ('observation_uniquement',   'Observation uniquement',                  1),
  ('accompagnement_important', 'Réalisé avec un accompagnement important', 2),
  ('avec_quelques_aides',      'Réalisé avec quelques aides',              3),
  ('a_partir_consigne',        'Réalisé à partir d''une consigne',         4),
  ('autonome',                 'Réalisé de manière autonome',              5),
  ('initie_spontanement',      'Initié spontanément par l''enfant',       6)
on conflict (code) do nothing;

create table if not exists statuts_activite (
  id      uuid primary key default gen_random_uuid(),
  code    text not null unique,   -- 'brouillon' | 'valide'
  libelle text not null,
  ordre   smallint,
  actif   boolean not null default true
);

insert into statuts_activite (code, libelle, ordre) values
  ('brouillon', 'Brouillon', 1),
  ('valide',    'Validé',    2)
on conflict (code) do nothing;

-- Référentiel technique commun : lecture ouverte à tout utilisateur
-- authentifié, aucune écriture depuis le client.
alter table contextes_activite enable row level security;
alter table niveaux_autonomie enable row level security;
alter table statuts_activite enable row level security;

create policy "Lecture contextes_activite pour utilisateurs authentifies"
  on contextes_activite for select
  to authenticated
  using (true);

create policy "Lecture niveaux_autonomie pour utilisateurs authentifies"
  on niveaux_autonomie for select
  to authenticated
  using (true);

create policy "Lecture statuts_activite pour utilisateurs authentifies"
  on statuts_activite for select
  to authenticated
  using (true);
