-- Lot 10 - Dossiers d'export (dossier pedagogique annuel).
--
-- Un dossier reste "dynamique" (lit les activites/traces en direct) tant
-- qu'il est en brouillon. A la finalisation, un instantane (snapshot) est
-- copie dans dossiers_export_elements et un PDF est genere et stocke :
-- les deux mecanismes combines, comme convenu (voir
-- Corrections-Schema-et-Lot1.md, A9).

create table if not exists dossiers_export (
  id                       uuid primary key default gen_random_uuid(),
  parcours_id              uuid not null references parcours_scolaires(id) on delete cascade,
  titre                    text not null,
  statut                   text not null default 'brouillon', -- 'brouillon' | 'finalise'
  pdf_final_storage_path   text,
  created_par              uuid references auth.users(id) on delete set null,
  created_par_nom_affiche  text not null,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists idx_dossiers_parcours on dossiers_export(parcours_id);

create table if not exists dossiers_export_elements (
  id                          uuid primary key default gen_random_uuid(),
  dossier_id                  uuid not null references dossiers_export(id) on delete cascade,
  type_element                text not null, -- 'activite' | 'trace'
  activite_id                 uuid references activites(id) on delete set null,
  trace_id                    uuid references traces(id) on delete set null,
  ordre                       integer not null default 0,
  legende_modifiee            text,
  texte_synthese_modifie      text,
  masquer_infos_perso         boolean not null default false,
  snapshot_titre              text,
  snapshot_texte               text,
  snapshot_legende            text,
  snapshot_date                date,
  snapshot_chemin_fichier      text,
  snapshot_ordre               integer,
  constraint type_coherent check (
    (type_element = 'activite' and (activite_id is not null or snapshot_titre is not null))
    or
    (type_element = 'trace' and (trace_id is not null or snapshot_chemin_fichier is not null or snapshot_texte is not null))
  )
);

create index if not exists idx_dossier_elements_dossier on dossiers_export_elements(dossier_id);

-- ---------------------------------------------------------------------------
-- RLS - dossiers_export : appartenance via parcours -> enfant -> famille.
-- ---------------------------------------------------------------------------
alter table dossiers_export enable row level security;

drop policy if exists "Lecture dossier si membre actif de la famille" on dossiers_export;
create policy "Lecture dossier si membre actif de la famille"
  on dossiers_export for select
  to authenticated
  using (
    est_membre_actif_famille(
      (select e.famille_id from parcours_scolaires ps
       join enfants e on e.id = ps.enfant_id
       where ps.id = dossiers_export.parcours_id)
    )
  );

drop policy if exists "Creation dossier si membre actif de la famille" on dossiers_export;
create policy "Creation dossier si membre actif de la famille"
  on dossiers_export for insert
  to authenticated
  with check (
    est_membre_actif_famille(
      (select e.famille_id from parcours_scolaires ps
       join enfants e on e.id = ps.enfant_id
       where ps.id = dossiers_export.parcours_id)
    )
  );

drop policy if exists "Modification dossier si membre actif de la famille" on dossiers_export;
create policy "Modification dossier si membre actif de la famille"
  on dossiers_export for update
  to authenticated
  using (
    est_membre_actif_famille(
      (select e.famille_id from parcours_scolaires ps
       join enfants e on e.id = ps.enfant_id
       where ps.id = dossiers_export.parcours_id)
    )
  )
  with check (
    est_membre_actif_famille(
      (select e.famille_id from parcours_scolaires ps
       join enfants e on e.id = ps.enfant_id
       where ps.id = dossiers_export.parcours_id)
    )
  );

drop policy if exists "Suppression dossier si membre actif de la famille" on dossiers_export;
create policy "Suppression dossier si membre actif de la famille"
  on dossiers_export for delete
  to authenticated
  using (
    est_membre_actif_famille(
      (select e.famille_id from parcours_scolaires ps
       join enfants e on e.id = ps.enfant_id
       where ps.id = dossiers_export.parcours_id)
    )
  );

-- ---------------------------------------------------------------------------
-- RLS - dossiers_export_elements : appartenance via dossier -> parcours ->
-- enfant -> famille.
-- ---------------------------------------------------------------------------
alter table dossiers_export_elements enable row level security;

drop policy if exists "Lecture element dossier si membre actif de la famille" on dossiers_export_elements;
create policy "Lecture element dossier si membre actif de la famille"
  on dossiers_export_elements for select
  to authenticated
  using (
    est_membre_actif_famille(
      (select e.famille_id
       from dossiers_export d
       join parcours_scolaires ps on ps.id = d.parcours_id
       join enfants e on e.id = ps.enfant_id
       where d.id = dossiers_export_elements.dossier_id)
    )
  );

drop policy if exists "Creation element dossier si membre actif de la famille" on dossiers_export_elements;
create policy "Creation element dossier si membre actif de la famille"
  on dossiers_export_elements for insert
  to authenticated
  with check (
    est_membre_actif_famille(
      (select e.famille_id
       from dossiers_export d
       join parcours_scolaires ps on ps.id = d.parcours_id
       join enfants e on e.id = ps.enfant_id
       where d.id = dossiers_export_elements.dossier_id)
    )
  );

drop policy if exists "Modification element dossier si membre actif de la famille" on dossiers_export_elements;
create policy "Modification element dossier si membre actif de la famille"
  on dossiers_export_elements for update
  to authenticated
  using (
    est_membre_actif_famille(
      (select e.famille_id
       from dossiers_export d
       join parcours_scolaires ps on ps.id = d.parcours_id
       join enfants e on e.id = ps.enfant_id
       where d.id = dossiers_export_elements.dossier_id)
    )
  )
  with check (
    est_membre_actif_famille(
      (select e.famille_id
       from dossiers_export d
       join parcours_scolaires ps on ps.id = d.parcours_id
       join enfants e on e.id = ps.enfant_id
       where d.id = dossiers_export_elements.dossier_id)
    )
  );

drop policy if exists "Suppression element dossier si membre actif de la famille" on dossiers_export_elements;
create policy "Suppression element dossier si membre actif de la famille"
  on dossiers_export_elements for delete
  to authenticated
  using (
    est_membre_actif_famille(
      (select e.famille_id
       from dossiers_export d
       join parcours_scolaires ps on ps.id = d.parcours_id
       join enfants e on e.id = ps.enfant_id
       where d.id = dossiers_export_elements.dossier_id)
    )
  );
