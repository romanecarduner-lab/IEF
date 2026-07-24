-- Lot 11 - Journal d'audit, volontairement independant des autres tables
-- (pas de cascade) : il doit survivre a la suppression d'une famille pour
-- la tracabilite. Ne contient jamais de contenu pedagogique ni de photo,
-- uniquement des metadonnees d'action.

create table if not exists journal_audit (
  id                  uuid primary key default gen_random_uuid(),
  famille_id          uuid,
  type_action         text not null,
  cible_type          text not null,
  cible_id            uuid,
  auteur_id           uuid,
  auteur_nom_affiche  text,
  details             jsonb,
  created_at          timestamptz not null default now()
);

create index if not exists idx_audit_famille on journal_audit(famille_id);
create index if not exists idx_audit_type on journal_audit(type_action, created_at);

-- Aucune policy de lecture pour les utilisateurs standards : ce journal
-- n'est accessible qu'en ecriture, via la fonction ci-dessous, jamais lu
-- directement depuis le client dans ce lot.
alter table journal_audit enable row level security;

-- ---------------------------------------------------------------------------
-- Fonction d'ecriture, en SECURITY DEFINER : contourne volontairement la
-- RLS (aucune policy insert n'existe sur la table) pour permettre a
-- n'importe quel utilisateur authentifie d'y deposer une entree, sans
-- jamais pouvoir la lire, la modifier ou la supprimer ensuite.
-- ---------------------------------------------------------------------------
create or replace function rpc_journal_auditer(
  p_famille_id uuid,
  p_type_action text,
  p_cible_type text,
  p_cible_id uuid,
  p_details jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
begin
  select email into v_email from auth.users where id = auth.uid();

  insert into journal_audit (
    famille_id, type_action, cible_type, cible_id,
    auteur_id, auteur_nom_affiche, details
  ) values (
    p_famille_id, p_type_action, p_cible_type, p_cible_id,
    auth.uid(), coalesce(v_email, 'Parent'), p_details
  );
end;
$$;

revoke all on function rpc_journal_auditer(uuid, text, text, uuid, jsonb) from public;
grant execute on function rpc_journal_auditer(uuid, text, text, uuid, jsonb) to authenticated;
