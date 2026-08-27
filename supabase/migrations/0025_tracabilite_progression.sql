-- Etape 1 du chantier "progression automatique" : structure de donnees
-- et tracabilite uniquement. Pas de moteur d'estimation ni d'ecran a ce
-- stade -- juste les fondations sur lesquelles les etapes suivantes
-- s'appuieront.

-- ---------------------------------------------------------------------------
-- A. syntheses_progression : distinguer le statut applique (manuel ou
-- automatique) d'une eventuelle proposition en attente, jamais appliquee
-- tant qu'elle n'est pas confirmee. proposition_ignoree_jusqua_observation_le
-- evite qu'une proposition ignoree ne revienne sans donnee nouvelle.
-- ---------------------------------------------------------------------------
alter table syntheses_progression
  add column if not exists origine text not null default 'manuel',
  add column if not exists niveau_confiance text,
  add column if not exists statut_propose_id uuid references statuts_progression(id) on delete set null,
  add column if not exists justification_proposition text,
  add column if not exists propose_le timestamptz,
  add column if not exists derniere_prise_en_compte_le timestamptz,
  add column if not exists proposition_ignoree_le timestamptz,
  add column if not exists proposition_ignoree_jusqua_observation_le timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'origine_valide'
  ) then
    alter table syntheses_progression
      add constraint origine_valide check (origine in ('manuel', 'automatique'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'niveau_confiance_valide'
  ) then
    alter table syntheses_progression
      add constraint niveau_confiance_valide
      check (niveau_confiance is null or niveau_confiance in ('provisoire', 'confirme'));
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- B. historique_progression : distinguer les entrees automatiques des
-- manuelles. Toutes les entrees passees etaient manuelles (le mecanisme
-- automatique n'existait pas encore) : la valeur par defaut est donc
-- historiquement exacte.
-- ---------------------------------------------------------------------------
alter table historique_progression
  add column if not exists origine text not null default 'manuel';

-- ---------------------------------------------------------------------------
-- C. syntheses_progression_sources : instantane (pas une simple reference)
-- des observations ayant motive un changement de statut precis. Rattachee
-- a l'entree d'historique (pas seulement a la synthese courante) pour
-- pouvoir reconstituer, plus tard, pourquoi le statut etait tel a une date
-- donnee -- pas seulement pourquoi il est tel aujourd'hui.
--
-- Les colonnes snapshot_* survivent a la suppression de l'observation ou
-- de l'activite source (on delete set null sur les references, jamais de
-- cascade) : la justification historique ne disparait jamais.
-- ---------------------------------------------------------------------------
create table if not exists syntheses_progression_sources (
  id                        uuid primary key default gen_random_uuid(),
  historique_id             uuid not null references historique_progression(id) on delete cascade,
  synthese_id               uuid not null references syntheses_progression(id) on delete cascade,
  observation_id            uuid references observations_elements_programme(id) on delete set null,
  activite_id               uuid references activites(id) on delete set null,
  snapshot_activite_titre   text not null,
  snapshot_date_observation date not null,
  snapshot_niveau_autonomie text not null,
  snapshot_contexte         text,
  snapshot_justification    text,
  created_at                timestamptz not null default now()
);

create index if not exists idx_sps_historique on syntheses_progression_sources(historique_id);
create index if not exists idx_sps_synthese on syntheses_progression_sources(synthese_id);

-- ---------------------------------------------------------------------------
-- RLS - meme chaine d'appartenance que syntheses_progression
-- (parcours -> enfant -> famille). Contrairement a journal_audit, ces
-- donnees doivent rester consultables par la famille concernee : ce n'est
-- pas un journal cache.
-- ---------------------------------------------------------------------------
alter table syntheses_progression_sources enable row level security;

drop policy if exists "Lecture sources si membre actif de la famille" on syntheses_progression_sources;
create policy "Lecture sources si membre actif de la famille"
  on syntheses_progression_sources for select
  to authenticated
  using (
    est_membre_actif_famille(
      (select e.famille_id
       from syntheses_progression sp
       join parcours_scolaires ps on ps.id = sp.parcours_id
       join enfants e on e.id = ps.enfant_id
       where sp.id = syntheses_progression_sources.synthese_id)
    )
  );

drop policy if exists "Creation sources si membre actif de la famille" on syntheses_progression_sources;
create policy "Creation sources si membre actif de la famille"
  on syntheses_progression_sources for insert
  to authenticated
  with check (
    est_membre_actif_famille(
      (select e.famille_id
       from syntheses_progression sp
       join parcours_scolaires ps on ps.id = sp.parcours_id
       join enfants e on e.id = ps.enfant_id
       where sp.id = syntheses_progression_sources.synthese_id)
    )
  );
