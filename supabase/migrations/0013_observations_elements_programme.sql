-- Lot 6 - Relier une activite aux elements du programme observes.
--
-- observations_elements_programme : lien principal, au niveau de l'activite.
-- traces_elements_programme : lien optionnel plus fin, au niveau d'une trace
-- precise (schema uniquement pour ce lot ; interface non construite encore,
-- voir Corrections-Schema-et-Lot1.md).

create table if not exists observations_elements_programme (
  id                       uuid primary key default gen_random_uuid(),
  activite_id              uuid not null references activites(id) on delete cascade,
  element_programme_id     uuid not null references elements_programme(id) on delete restrict,
  niveau_autonomie_id      uuid not null references niveaux_autonomie(id) on delete restrict,
  justification             text,
  commentaire_pedagogique   text,
  auteur_id                uuid references auth.users(id) on delete set null,
  auteur_nom_affiche        text not null,
  created_at               timestamptz not null default now(),
  unique (activite_id, element_programme_id)
);

create index if not exists idx_oep_activite on observations_elements_programme(activite_id);
create index if not exists idx_oep_element on observations_elements_programme(element_programme_id);

create table if not exists traces_elements_programme (
  id                    uuid primary key default gen_random_uuid(),
  trace_id              uuid not null references traces(id) on delete cascade,
  element_programme_id  uuid not null references elements_programme(id) on delete restrict,
  created_at            timestamptz not null default now(),
  unique (trace_id, element_programme_id)
);

create index if not exists idx_tep_trace on traces_elements_programme(trace_id);
create index if not exists idx_tep_element on traces_elements_programme(element_programme_id);

-- ---------------------------------------------------------------------------
-- Fonction utilitaire : liste tous les objectifs sous un element donne
-- (competence ou repere_annuel), en traversant un niveau intermediaire
-- eventuel de sous-competence. Utilisee par le selecteur de competences
-- cote client pour eviter de coder en dur la profondeur de l'arbre.
-- ---------------------------------------------------------------------------
create or replace function lister_objectifs_sous_element(p_element_id uuid)
returns table(id uuid, libelle text, groupe text)
language sql
stable
as $$
  with recursive descendants as (
    select e.id, e.libelle, e.parent_id, e.type_element_id, e.ordre
    from elements_programme e
    where e.parent_id = p_element_id
    union all
    select e.id, e.libelle, e.parent_id, e.type_element_id, e.ordre
    from elements_programme e
    join descendants d on e.parent_id = d.id
  )
  select
    d.id,
    d.libelle,
    case
      when p.type_element_id = (select id from types_element_programme where code = 'competence')
        then p.libelle
      else null
    end as groupe
  from descendants d
  join elements_programme p on p.id = d.parent_id
  where d.type_element_id = (select id from types_element_programme where code = 'objectif')
  order by d.ordre;
$$;

revoke all on function lister_objectifs_sous_element(uuid) from public;
grant execute on function lister_objectifs_sous_element(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS - observations_elements_programme : appartenance via
-- activite -> parcours_scolaires -> enfants -> famille.
-- ---------------------------------------------------------------------------
alter table observations_elements_programme enable row level security;

drop policy if exists "Lecture observations si membre actif de la famille" on observations_elements_programme;
create policy "Lecture observations si membre actif de la famille"
  on observations_elements_programme for select
  to authenticated
  using (
    est_membre_actif_famille(
      (select e.famille_id
       from activites a
       join parcours_scolaires ps on ps.id = a.parcours_id
       join enfants e on e.id = ps.enfant_id
       where a.id = observations_elements_programme.activite_id)
    )
  );

drop policy if exists "Creation observation si membre actif de la famille" on observations_elements_programme;
create policy "Creation observation si membre actif de la famille"
  on observations_elements_programme for insert
  to authenticated
  with check (
    est_membre_actif_famille(
      (select e.famille_id
       from activites a
       join parcours_scolaires ps on ps.id = a.parcours_id
       join enfants e on e.id = ps.enfant_id
       where a.id = observations_elements_programme.activite_id)
    )
  );

drop policy if exists "Modification observation si membre actif de la famille" on observations_elements_programme;
create policy "Modification observation si membre actif de la famille"
  on observations_elements_programme for update
  to authenticated
  using (
    est_membre_actif_famille(
      (select e.famille_id
       from activites a
       join parcours_scolaires ps on ps.id = a.parcours_id
       join enfants e on e.id = ps.enfant_id
       where a.id = observations_elements_programme.activite_id)
    )
  )
  with check (
    est_membre_actif_famille(
      (select e.famille_id
       from activites a
       join parcours_scolaires ps on ps.id = a.parcours_id
       join enfants e on e.id = ps.enfant_id
       where a.id = observations_elements_programme.activite_id)
    )
  );

drop policy if exists "Suppression observation si membre actif de la famille" on observations_elements_programme;
create policy "Suppression observation si membre actif de la famille"
  on observations_elements_programme for delete
  to authenticated
  using (
    est_membre_actif_famille(
      (select e.famille_id
       from activites a
       join parcours_scolaires ps on ps.id = a.parcours_id
       join enfants e on e.id = ps.enfant_id
       where a.id = observations_elements_programme.activite_id)
    )
  );

-- ---------------------------------------------------------------------------
-- RLS - traces_elements_programme : appartenance via
-- trace -> activite -> parcours_scolaires -> enfants -> famille.
-- ---------------------------------------------------------------------------
alter table traces_elements_programme enable row level security;

drop policy if exists "Lecture traces_elements si membre actif de la famille" on traces_elements_programme;
create policy "Lecture traces_elements si membre actif de la famille"
  on traces_elements_programme for select
  to authenticated
  using (
    est_membre_actif_famille(
      (select e.famille_id
       from traces t
       join activites a on a.id = t.activite_id
       join parcours_scolaires ps on ps.id = a.parcours_id
       join enfants e on e.id = ps.enfant_id
       where t.id = traces_elements_programme.trace_id)
    )
  );

drop policy if exists "Creation traces_elements si membre actif de la famille" on traces_elements_programme;
create policy "Creation traces_elements si membre actif de la famille"
  on traces_elements_programme for insert
  to authenticated
  with check (
    est_membre_actif_famille(
      (select e.famille_id
       from traces t
       join activites a on a.id = t.activite_id
       join parcours_scolaires ps on ps.id = a.parcours_id
       join enfants e on e.id = ps.enfant_id
       where t.id = traces_elements_programme.trace_id)
    )
  );

drop policy if exists "Suppression traces_elements si membre actif de la famille" on traces_elements_programme;
create policy "Suppression traces_elements si membre actif de la famille"
  on traces_elements_programme for delete
  to authenticated
  using (
    est_membre_actif_famille(
      (select e.famille_id
       from traces t
       join activites a on a.id = t.activite_id
       join parcours_scolaires ps on ps.id = a.parcours_id
       join enfants e on e.id = ps.enfant_id
       where t.id = traces_elements_programme.trace_id)
    )
  );
