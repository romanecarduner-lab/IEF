-- Refonte du dossier pedagogique : il couvre desormais TOUTES les
-- competences du cycle (statut cumulatif reel), pas une selection
-- curatee d'activites par domaine. Cette table stocke, par dossier et
-- par competence, le brouillon de formulation pedagogique (genere en
-- lot, puis relu et modifiable par le parent avant la generation du
-- document) ainsi que les activites retenues comme exemples.
--
-- Le statut affiche n'est JAMAIS stocke ici : il est toujours relu en
-- direct depuis v_synthese_cumulee_cycle au moment de l'affichage et de
-- la generation du document, pour ne jamais se desynchroniser d'un
-- changement fait depuis Progression entre-temps.

create table if not exists dossiers_export_formulations (
  id                  uuid primary key default gen_random_uuid(),
  dossier_id          uuid not null references dossiers_export(id) on delete cascade,
  element_programme_id uuid not null references elements_programme(id) on delete cascade,
  texte               text,
  exemple_activite_ids uuid[] not null default '{}',
  genere_le           timestamptz,
  modifie_par_parent  boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (dossier_id, element_programme_id)
);

create index if not exists idx_formulations_dossier on dossiers_export_formulations(dossier_id);

alter table dossiers_export_formulations enable row level security;

drop policy if exists "Lecture formulation si membre actif de la famille" on dossiers_export_formulations;
create policy "Lecture formulation si membre actif de la famille"
  on dossiers_export_formulations for select
  to authenticated
  using (
    est_membre_actif_famille(
      (select e.famille_id from dossiers_export d
       join parcours_scolaires ps on ps.id = d.parcours_id
       join enfants e on e.id = ps.enfant_id
       where d.id = dossier_id)
    )
  );

drop policy if exists "Ecriture formulation si membre actif de la famille" on dossiers_export_formulations;
create policy "Ecriture formulation si membre actif de la famille"
  on dossiers_export_formulations for all
  to authenticated
  using (
    est_membre_actif_famille(
      (select e.famille_id from dossiers_export d
       join parcours_scolaires ps on ps.id = d.parcours_id
       join enfants e on e.id = ps.enfant_id
       where d.id = dossier_id)
    )
  )
  with check (
    est_membre_actif_famille(
      (select e.famille_id from dossiers_export d
       join parcours_scolaires ps on ps.id = d.parcours_id
       join enfants e on e.id = ps.enfant_id
       where d.id = dossier_id)
    )
  );
