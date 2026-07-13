create table if not exists activites (
  id                     uuid primary key default gen_random_uuid(),
  parcours_id            uuid not null references parcours_scolaires(id) on delete cascade,
  auteur_id              uuid references auth.users(id) on delete set null,
  auteur_nom_affiche     text not null,  -- snapshot, survit à la suppression du compte
  date_activite          date not null,
  titre                  text not null,
  description            text,
  contexte_id            uuid not null references contextes_activite(id) on delete restrict,
  lieu                   text,
  observations           text,
  paroles_enfant         text,
  personnes_presentes    text,  -- champ libre en V1 (voir Corrections-Schema-et-Lot1.md)
  autonomie_generale_id  uuid references niveaux_autonomie(id) on delete restrict,  -- facultatif
  statut_id              uuid not null references statuts_activite(id) on delete restrict,
  favori                 boolean not null default false,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  constraint titre_non_vide check (length(trim(titre)) > 0)
);

create index if not exists idx_activites_parcours on activites(parcours_id);
create index if not exists idx_activites_date on activites(date_activite);
create index if not exists idx_activites_statut on activites(statut_id);

-- ---------------------------------------------------------------------------
-- RLS — activites n'a pas de famille_id direct : l'appartenance passe par
-- parcours_scolaires → enfants → famille. Pas de récursion (aucune de ces
-- tables ne s'auto-référence dans la vérification).
-- ---------------------------------------------------------------------------
alter table activites enable row level security;

create policy "Lecture activites si membre actif de la famille"
  on activites for select
  to authenticated
  using (
    est_membre_actif_famille(
      (select e.famille_id
       from parcours_scolaires ps
       join enfants e on e.id = ps.enfant_id
       where ps.id = activites.parcours_id)
    )
  );

create policy "Creation activite si membre actif de la famille"
  on activites for insert
  to authenticated
  with check (
    est_membre_actif_famille(
      (select e.famille_id
       from parcours_scolaires ps
       join enfants e on e.id = ps.enfant_id
       where ps.id = activites.parcours_id)
    )
  );

create policy "Modification activite si membre actif de la famille"
  on activites for update
  to authenticated
  using (
    est_membre_actif_famille(
      (select e.famille_id
       from parcours_scolaires ps
       join enfants e on e.id = ps.enfant_id
       where ps.id = activites.parcours_id)
    )
  )
  with check (
    est_membre_actif_famille(
      (select e.famille_id
       from parcours_scolaires ps
       join enfants e on e.id = ps.enfant_id
       where ps.id = activites.parcours_id)
    )
  );

create policy "Suppression activite si membre actif de la famille"
  on activites for delete
  to authenticated
  using (
    est_membre_actif_famille(
      (select e.famille_id
       from parcours_scolaires ps
       join enfants e on e.id = ps.enfant_id
       where ps.id = activites.parcours_id)
    )
  );
