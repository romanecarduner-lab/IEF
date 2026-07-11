-- Lot 1 — Cœur du socle multi-famille : familles + utilisateurs_familles.

create table if not exists familles (
  id         uuid primary key default gen_random_uuid(),
  nom        text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists utilisateurs_familles (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  famille_id   uuid not null references familles(id) on delete cascade,
  role_id      uuid not null references roles_famille(id) on delete restrict,
  statut_id    uuid not null references statuts_appartenance_famille(id) on delete restrict,
  invite_par   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  unique (user_id, famille_id)
);

create index if not exists idx_uf_famille on utilisateurs_familles(famille_id);
create index if not exists idx_uf_user on utilisateurs_familles(user_id);

-- ---------------------------------------------------------------------------
-- Fonction d'appartenance, en SECURITY DEFINER.
--
-- Pourquoi : une policy RLS sur utilisateurs_familles qui interrogerait
-- directement utilisateurs_familles créerait une évaluation récursive de la
-- policy. La pratique recommandée par Supabase consiste à isoler ce test
-- dans une fonction SECURITY DEFINER, qui s'exécute avec les droits de son
-- propriétaire (et contourne donc la RLS pour cette seule vérification
-- interne, sans jamais exposer les données brutes de la table à l'appelant).
-- ---------------------------------------------------------------------------
create or replace function est_membre_actif_famille(p_famille_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from utilisateurs_familles uf
    join statuts_appartenance_famille sa on sa.id = uf.statut_id
    where uf.famille_id = p_famille_id
      and uf.user_id = auth.uid()
      and sa.code = 'actif'
  );
$$;

revoke all on function est_membre_actif_famille(uuid) from public;
grant execute on function est_membre_actif_famille(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS — familles
-- ---------------------------------------------------------------------------
alter table familles enable row level security;

create policy "Lecture famille si membre actif"
  on familles for select
  to authenticated
  using (est_membre_actif_famille(id));

create policy "Modification famille si membre actif"
  on familles for update
  to authenticated
  using (est_membre_actif_famille(id))
  with check (est_membre_actif_famille(id));

-- Pas de policy insert : la création passe exclusivement par
-- rpc_creer_espace_familial (0003), en SECURITY DEFINER.
-- Pas de policy delete pour le lot 1 : la suppression d'une famille sera
-- traitée avec les droits des familles (purge Storage incluse), pas ici.

-- ---------------------------------------------------------------------------
-- RLS — utilisateurs_familles
-- ---------------------------------------------------------------------------
alter table utilisateurs_familles enable row level security;

create policy "Lecture appartenances si membre actif de la meme famille"
  on utilisateurs_familles for select
  to authenticated
  using (est_membre_actif_famille(famille_id));

-- Pas de policy insert/update/delete pour le lot 1 : toute écriture passe
-- par rpc_creer_espace_familial (création) ; le système d'invitation
-- (lot V2) introduira les policies nécessaires à ce moment-là.
