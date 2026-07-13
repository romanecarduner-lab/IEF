-- Lot 3 — Structure du programme officiel, sans import réel.
--
-- Rappel (Corrections-Schema-et-Lot1.md, A5) : les textes officiels ne
-- suivent pas tous une hiérarchie uniforme cycle → domaine → sous-domaine
-- → objectif → compétence. On modélise donc une arborescence générique,
-- où chaque élément porte son propre type (domaine, compétence, attendu,
-- repère annuel, exemple de réussite, contenu d'enseignement...).
--
-- Aucune donnée officielle n'est importée dans cette migration : la
-- source doit être validée séparément avant tout import réel.

create table if not exists types_element_programme (
  id      uuid primary key default gen_random_uuid(),
  code    text not null unique,  -- 'domaine' | 'sous_domaine' | 'objectif' | 'competence'
                                   -- | 'attendu' | 'repere_annuel' | 'exemple_reussite'
                                   -- | 'contenu_enseignement'
  libelle text not null,
  ordre   smallint
);

insert into types_element_programme (code, libelle, ordre) values
  ('domaine',             'Domaine',              1),
  ('sous_domaine',        'Sous-domaine',         2),
  ('objectif',            'Objectif',             3),
  ('competence',          'Compétence',           4),
  ('attendu',             'Attendu de fin de cycle', 5),
  ('repere_annuel',       'Repère annuel ou de progression', 6),
  ('exemple_reussite',    'Exemple de réussite',  7),
  ('contenu_enseignement','Contenu d''enseignement', 8)
on conflict (code) do nothing;

create table if not exists elements_programme (
  id              uuid primary key default gen_random_uuid(),
  cycle_id        uuid not null references cycles(id) on delete restrict,
  parent_id       uuid references elements_programme(id) on delete restrict,
  type_element_id uuid not null references types_element_programme(id) on delete restrict,
  libelle         text not null,
  description     text,
  ordre           smallint,
  created_at      timestamptz not null default now()
);

-- Le référentiel se retrouve via cycle_id → cycles.referentiel_id : on ne
-- duplique pas referentiel_id ici, pour ne pas réintroduire la redondance
-- déjà corrigée sur syntheses_progression et dossiers_export (voir
-- Corrections-Schema-et-Lot1.md, A7).

create index if not exists idx_elements_programme_cycle on elements_programme(cycle_id);
create index if not exists idx_elements_programme_parent on elements_programme(parent_id);
create index if not exists idx_elements_programme_type on elements_programme(type_element_id);

-- ---------------------------------------------------------------------------
-- Cohérence : un élément enfant doit appartenir au même cycle que son
-- parent (on ne mélange jamais deux cycles dans une même branche).
-- ---------------------------------------------------------------------------
create or replace function verifier_coherence_element_programme()
returns trigger
language plpgsql
as $$
declare
  v_cycle_parent uuid;
begin
  if new.parent_id is not null then
    select cycle_id into v_cycle_parent from elements_programme where id = new.parent_id;

    if v_cycle_parent is null then
      raise exception 'Élément parent introuvable.';
    end if;

    if v_cycle_parent is distinct from new.cycle_id then
      raise exception 'Un élément du programme doit appartenir au même cycle que son parent.';
    end if;
  end if;

  return new;
end;
$$;

create trigger trg_coherence_element_programme
before insert or update on elements_programme
for each row execute function verifier_coherence_element_programme();

-- ---------------------------------------------------------------------------
-- RLS — référentiel technique commun : lecture ouverte à tout utilisateur
-- authentifié, aucune écriture depuis le client (réservée aux migrations
-- et à un futur outil d'administration du programme, hors périmètre ici).
-- ---------------------------------------------------------------------------
alter table types_element_programme enable row level security;
alter table elements_programme enable row level security;

create policy "Lecture types_element_programme pour utilisateurs authentifies"
  on types_element_programme for select
  to authenticated
  using (true);

create policy "Lecture elements_programme pour utilisateurs authentifies"
  on elements_programme for select
  to authenticated
  using (true);
