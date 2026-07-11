create table if not exists enfants (
  id                    uuid primary key default gen_random_uuid(),
  famille_id            uuid not null references familles(id) on delete cascade,
  prenom                text not null,
  date_naissance        date,                 -- facultative (droits des familles)
  photo_storage_path    text,                 -- rempli par le lot Traces (bucket privé)
  photo_thumbnail_path  text,
  remarques             text,
  cree_par              uuid references auth.users(id) on delete set null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint prenom_non_vide check (length(trim(prenom)) > 0)
);

create index if not exists idx_enfants_famille on enfants(famille_id);

alter table enfants enable row level security;

create policy "Lecture enfants si membre actif de la famille"
  on enfants for select
  to authenticated
  using (est_membre_actif_famille(famille_id));

create policy "Creation enfant si membre actif de la famille"
  on enfants for insert
  to authenticated
  with check (est_membre_actif_famille(famille_id));

create policy "Modification enfant si membre actif de la famille"
  on enfants for update
  to authenticated
  using (est_membre_actif_famille(famille_id))
  with check (est_membre_actif_famille(famille_id));

create policy "Suppression enfant si membre actif de la famille"
  on enfants for delete
  to authenticated
  using (est_membre_actif_famille(famille_id));
