-- Lot 1 — Tables de vocabulaire contrôlé nécessaires à familles / utilisateurs_familles.
-- Les autres tables de vocabulaire (contextes, autonomie, types de trace, etc.)
-- seront ajoutées dans les lots correspondants, pas ici.

create extension if not exists "pgcrypto"; -- pour gen_random_uuid()

create table if not exists roles_famille (
  id      uuid primary key default gen_random_uuid(),
  code    text not null unique,
  libelle text not null,
  ordre   smallint,
  actif   boolean not null default true
);

comment on table roles_famille is
  'Rôles possibles d''un utilisateur au sein d''un espace familial.';

insert into roles_famille (code, libelle, ordre) values
  ('parent', 'Parent', 1),
  ('intervenant', 'Intervenant', 2)
on conflict (code) do nothing;

create table if not exists statuts_appartenance_famille (
  id      uuid primary key default gen_random_uuid(),
  code    text not null unique,
  libelle text not null,
  actif   boolean not null default true
);

comment on table statuts_appartenance_famille is
  'Statut du lien entre un utilisateur et un espace familial.';

insert into statuts_appartenance_famille (code, libelle) values
  ('actif', 'Actif'),
  ('invite_en_attente', 'Invitation en attente')
on conflict (code) do nothing;

-- Ces tables sont un référentiel technique commun à toute l'application :
-- lecture ouverte à tout utilisateur authentifié, aucune écriture possible
-- depuis le client (RLS activée, aucune policy insert/update/delete).
alter table roles_famille enable row level security;
alter table statuts_appartenance_famille enable row level security;

create policy "Lecture roles_famille pour utilisateurs authentifies"
  on roles_famille for select
  to authenticated
  using (true);

create policy "Lecture statuts_appartenance_famille pour utilisateurs authentifies"
  on statuts_appartenance_famille for select
  to authenticated
  using (true);
