-- Lot 5 - Traces (photos, productions, documents, citations, observations).
--
-- Convention de chemin de stockage : {famille_id}/{trace_id}.{extension}
-- et {famille_id}/{trace_id}_thumb.{extension} pour la miniature.
-- Le premier segment (famille_id) est ce que les policies Storage
-- verifient plus bas, via la fonction est_membre_actif_famille deja
-- utilisee pour toutes les autres tables.

create table if not exists traces (
  id                          uuid primary key default gen_random_uuid(),
  activite_id                 uuid not null references activites(id) on delete cascade,
  type_id                     uuid not null references types_trace(id) on delete restrict,
  chemin_stockage              text,
  miniature_chemin_stockage    text,
  contenu_texte                text,  -- pour citation / observation_parentale sans fichier
  legende                      text,
  date_trace                   date not null default current_date,
  statut_id                    uuid not null references statuts_trace(id) on delete restrict,
  ordre_affichage               integer not null default 0,
  auteur_id                    uuid references auth.users(id) on delete set null,
  auteur_nom_affiche            text not null,
  created_at                   timestamptz not null default now(),
  updated_at                   timestamptz not null default now(),
  constraint chemin_ou_texte check (chemin_stockage is not null or contenu_texte is not null)
);

create index if not exists idx_traces_activite on traces(activite_id);
create index if not exists idx_traces_statut on traces(statut_id);

-- ---------------------------------------------------------------------------
-- RLS - traces n'a pas de famille_id direct : l'appartenance passe par
-- activite_id -> parcours_scolaires -> enfants -> famille.
-- ---------------------------------------------------------------------------
alter table traces enable row level security;

create policy "Lecture traces si membre actif de la famille"
  on traces for select
  to authenticated
  using (
    est_membre_actif_famille(
      (select e.famille_id
       from activites a
       join parcours_scolaires ps on ps.id = a.parcours_id
       join enfants e on e.id = ps.enfant_id
       where a.id = traces.activite_id)
    )
  );

create policy "Creation trace si membre actif de la famille"
  on traces for insert
  to authenticated
  with check (
    est_membre_actif_famille(
      (select e.famille_id
       from activites a
       join parcours_scolaires ps on ps.id = a.parcours_id
       join enfants e on e.id = ps.enfant_id
       where a.id = traces.activite_id)
    )
  );

create policy "Modification trace si membre actif de la famille"
  on traces for update
  to authenticated
  using (
    est_membre_actif_famille(
      (select e.famille_id
       from activites a
       join parcours_scolaires ps on ps.id = a.parcours_id
       join enfants e on e.id = ps.enfant_id
       where a.id = traces.activite_id)
    )
  )
  with check (
    est_membre_actif_famille(
      (select e.famille_id
       from activites a
       join parcours_scolaires ps on ps.id = a.parcours_id
       join enfants e on e.id = ps.enfant_id
       where a.id = traces.activite_id)
    )
  );

create policy "Suppression trace si membre actif de la famille"
  on traces for delete
  to authenticated
  using (
    est_membre_actif_famille(
      (select e.famille_id
       from activites a
       join parcours_scolaires ps on ps.id = a.parcours_id
       join enfants e on e.id = ps.enfant_id
       where a.id = traces.activite_id)
    )
  );

-- ---------------------------------------------------------------------------
-- Bucket Storage prive + policies. Un bucket est simplement une ligne dans
-- storage.buckets : creable par SQL, comme n'importe quelle table.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'traces-pedagogiques',
  'traces-pedagogiques',
  false,
  10485760, -- 10 Mo
  array[
    'image/jpeg','image/png','image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do nothing;

create policy "Lecture fichiers famille"
on storage.objects for select
to authenticated
using (
  bucket_id = 'traces-pedagogiques'
  and est_membre_actif_famille(((storage.foldername(name))[1])::uuid)
);

create policy "Insertion fichiers famille"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'traces-pedagogiques'
  and est_membre_actif_famille(((storage.foldername(name))[1])::uuid)
);

create policy "Modification fichiers famille"
on storage.objects for update
to authenticated
using (
  bucket_id = 'traces-pedagogiques'
  and est_membre_actif_famille(((storage.foldername(name))[1])::uuid)
)
with check (
  bucket_id = 'traces-pedagogiques'
  and est_membre_actif_famille(((storage.foldername(name))[1])::uuid)
);

create policy "Suppression fichiers famille"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'traces-pedagogiques'
  and est_membre_actif_famille(((storage.foldername(name))[1])::uuid)
);
