-- Lot 1 — Création atomique d'un espace familial + rattachement de l'utilisateur.
--
-- Appelée côté application juste après la première connexion authentifiée
-- (voir src/app/(protege)/layout.tsx) si l'utilisateur n'appartient encore
-- à aucune famille. SECURITY DEFINER : contourne volontairement la RLS
-- pour ces deux insertions précises, dans une seule transaction, afin
-- qu'une famille ne puisse jamais exister sans son premier membre
-- (et inversement).

create or replace function rpc_creer_espace_familial(p_nom_famille text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_famille_id      uuid;
  v_role_parent_id  uuid;
  v_statut_actif_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Utilisateur non authentifié.';
  end if;

  if p_nom_famille is null or length(trim(p_nom_famille)) = 0 then
    raise exception 'Le nom de l''espace familial est requis.';
  end if;

  -- Défense en profondeur : un utilisateur ne peut créer un premier espace
  -- que s'il n'en possède pas déjà un (l'invitation à rejoindre une famille
  -- existante est un flux distinct, prévu en V2).
  if exists (
    select 1 from utilisateurs_familles where user_id = auth.uid()
  ) then
    raise exception 'Cet utilisateur appartient déjà à un espace familial.';
  end if;

  select id into v_role_parent_id from roles_famille where code = 'parent';
  select id into v_statut_actif_id from statuts_appartenance_famille where code = 'actif';

  insert into familles (nom)
  values (trim(p_nom_famille))
  returning id into v_famille_id;

  insert into utilisateurs_familles (user_id, famille_id, role_id, statut_id)
  values (auth.uid(), v_famille_id, v_role_parent_id, v_statut_actif_id);

  return v_famille_id;
end;
$$;

revoke all on function rpc_creer_espace_familial(text) from public;
grant execute on function rpc_creer_espace_familial(text) to authenticated;
