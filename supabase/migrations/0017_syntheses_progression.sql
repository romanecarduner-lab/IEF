-- Lot 7 - Synthese de progression par competence.
--
-- Le statut global n'est jamais modifie automatiquement par un trigger :
-- seul le parent le change, via l'interface. Les compteurs (nombre
-- d'observations, dates distinctes, contextes distincts) ne sont pas
-- stockes non plus : ils sont calcules a la demande par la vue
-- v_indicateurs_observation, pour eviter tout probleme de synchronisation
-- lors des suppressions/modifications d'observations (voir
-- Corrections-Schema-et-Lot1.md, section 8).

create table if not exists syntheses_progression (
  id                    uuid primary key default gen_random_uuid(),
  parcours_id           uuid not null references parcours_scolaires(id) on delete cascade,
  element_programme_id  uuid not null references elements_programme(id) on delete restrict,
  statut_global_id      uuid not null references statuts_progression(id) on delete restrict,
  valide_par            uuid references auth.users(id) on delete set null,
  valide_par_nom_affiche text not null,
  valide_le             timestamptz not null default now(),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (parcours_id, element_programme_id)
);

create index if not exists idx_synthese_parcours on syntheses_progression(parcours_id);
create index if not exists idx_synthese_element on syntheses_progression(element_programme_id);

create table if not exists historique_progression (
  id                      uuid primary key default gen_random_uuid(),
  synthese_id             uuid not null references syntheses_progression(id) on delete cascade,
  ancien_statut           text,
  nouveau_statut          text not null,
  change_par              uuid references auth.users(id) on delete set null,
  change_par_nom_affiche  text not null,
  commentaire             text,
  created_at              timestamptz not null default now()
);

create index if not exists idx_histprog_synthese on historique_progression(synthese_id);

-- ---------------------------------------------------------------------------
-- Vue des indicateurs calcules (jamais stockee). security_invoker garantit
-- que la vue respecte la RLS de l'utilisateur qui interroge, pas celle du
-- proprietaire de la vue (indispensable pour l'isolation entre familles).
-- ---------------------------------------------------------------------------
create or replace view v_indicateurs_observation
with (security_invoker = true)
as
select
  a.parcours_id,
  oep.element_programme_id,
  count(*) as nb_observations,
  count(distinct a.date_activite) as nb_dates_distinctes,
  count(distinct a.contexte_id) as nb_contextes_distincts,
  min(a.date_activite) as premiere_observation,
  max(a.date_activite) as derniere_observation
from observations_elements_programme oep
join activites a on a.id = oep.activite_id
group by a.parcours_id, oep.element_programme_id;

grant select on v_indicateurs_observation to authenticated;

-- ---------------------------------------------------------------------------
-- RLS - syntheses_progression : appartenance via parcours -> enfant -> famille.
-- ---------------------------------------------------------------------------
alter table syntheses_progression enable row level security;

drop policy if exists "Lecture synthese si membre actif de la famille" on syntheses_progression;
create policy "Lecture synthese si membre actif de la famille"
  on syntheses_progression for select
  to authenticated
  using (
    est_membre_actif_famille(
      (select e.famille_id from parcours_scolaires ps
       join enfants e on e.id = ps.enfant_id
       where ps.id = syntheses_progression.parcours_id)
    )
  );

drop policy if exists "Creation synthese si membre actif de la famille" on syntheses_progression;
create policy "Creation synthese si membre actif de la famille"
  on syntheses_progression for insert
  to authenticated
  with check (
    est_membre_actif_famille(
      (select e.famille_id from parcours_scolaires ps
       join enfants e on e.id = ps.enfant_id
       where ps.id = syntheses_progression.parcours_id)
    )
  );

drop policy if exists "Modification synthese si membre actif de la famille" on syntheses_progression;
create policy "Modification synthese si membre actif de la famille"
  on syntheses_progression for update
  to authenticated
  using (
    est_membre_actif_famille(
      (select e.famille_id from parcours_scolaires ps
       join enfants e on e.id = ps.enfant_id
       where ps.id = syntheses_progression.parcours_id)
    )
  )
  with check (
    est_membre_actif_famille(
      (select e.famille_id from parcours_scolaires ps
       join enfants e on e.id = ps.enfant_id
       where ps.id = syntheses_progression.parcours_id)
    )
  );

drop policy if exists "Suppression synthese si membre actif de la famille" on syntheses_progression;
create policy "Suppression synthese si membre actif de la famille"
  on syntheses_progression for delete
  to authenticated
  using (
    est_membre_actif_famille(
      (select e.famille_id from parcours_scolaires ps
       join enfants e on e.id = ps.enfant_id
       where ps.id = syntheses_progression.parcours_id)
    )
  );

-- ---------------------------------------------------------------------------
-- RLS - historique_progression : appartenance via synthese -> parcours ->
-- enfant -> famille. Lecture et creation seulement (l'historique n'est
-- jamais modifie ni supprime individuellement).
-- ---------------------------------------------------------------------------
alter table historique_progression enable row level security;

drop policy if exists "Lecture historique si membre actif de la famille" on historique_progression;
create policy "Lecture historique si membre actif de la famille"
  on historique_progression for select
  to authenticated
  using (
    est_membre_actif_famille(
      (select e.famille_id
       from syntheses_progression sp
       join parcours_scolaires ps on ps.id = sp.parcours_id
       join enfants e on e.id = ps.enfant_id
       where sp.id = historique_progression.synthese_id)
    )
  );

drop policy if exists "Creation historique si membre actif de la famille" on historique_progression;
create policy "Creation historique si membre actif de la famille"
  on historique_progression for insert
  to authenticated
  with check (
    est_membre_actif_famille(
      (select e.famille_id
       from syntheses_progression sp
       join parcours_scolaires ps on ps.id = sp.parcours_id
       join enfants e on e.id = ps.enfant_id
       where sp.id = historique_progression.synthese_id)
    )
  );
