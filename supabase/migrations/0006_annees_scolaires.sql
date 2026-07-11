create table if not exists annees_scolaires (
  id           uuid primary key default gen_random_uuid(),
  famille_id   uuid not null references familles(id) on delete cascade,
  libelle      text not null,          -- ex. '2026-2027'
  date_debut   date not null,
  date_fin     date not null,
  created_at   timestamptz not null default now(),
  unique (famille_id, libelle),
  check (date_fin > date_debut)
);

create index if not exists idx_annees_famille on annees_scolaires(famille_id);

alter table annees_scolaires enable row level security;

create policy "Lecture annees_scolaires si membre actif de la famille"
  on annees_scolaires for select
  to authenticated
  using (est_membre_actif_famille(famille_id));

create policy "Creation annee_scolaire si membre actif de la famille"
  on annees_scolaires for insert
  to authenticated
  with check (est_membre_actif_famille(famille_id));

create policy "Modification annee_scolaire si membre actif de la famille"
  on annees_scolaires for update
  to authenticated
  using (est_membre_actif_famille(famille_id))
  with check (est_membre_actif_famille(famille_id));

create policy "Suppression annee_scolaire si membre actif de la famille"
  on annees_scolaires for delete
  to authenticated
  using (est_membre_actif_famille(famille_id));
