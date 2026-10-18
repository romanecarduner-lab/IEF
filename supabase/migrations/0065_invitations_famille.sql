-- Lot invitation : inviter un second parent dans le meme espace familial.
--
-- Principes :
-- * un seul niveau de droits : le role "parent" existant (les deux
--   personnes sont instructrices, memes droits) ;
-- * un compte = un seul espace familial ;
-- * le lien d'invitation est secret : seule son empreinte (sha-256) est
--   stockee, le lien lui-meme n'est montre qu'une fois, a sa creation ;
-- * tout passe par des fonctions SECURITY DEFINER : aucune policy
--   insert/update/delete n'est ajoutee sur les tables.
--
-- SQL en ASCII pur (pas d'accent) pour pouvoir etre colle sans risque.

-- ---------------------------------------------------------------------------
-- Reglage : afficher "ajoute par" sur les activites et les photos.
-- Desactive par defaut. La policy de modification de familles existe deja
-- (0002) : un membre actif peut changer ce reglage.
-- ---------------------------------------------------------------------------
alter table familles
  add column if not exists afficher_auteur boolean not null default false;

-- ---------------------------------------------------------------------------
-- Table des invitations
-- ---------------------------------------------------------------------------
create table if not exists invitations_famille (
  id             uuid primary key default gen_random_uuid(),
  famille_id     uuid not null references familles(id) on delete cascade,
  role_id        uuid not null references roles_famille(id) on delete restrict,
  email          text,
  prenom_invite  text,
  token_hash     text not null unique,
  cree_par       uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  expire_le      timestamptz not null,
  utilise_le     timestamptz,
  utilise_par    uuid references auth.users(id) on delete set null,
  annule_le      timestamptz
);

create index if not exists idx_invitations_famille on invitations_famille(famille_id);

alter table invitations_famille enable row level security;

-- Lecture seule pour les membres actifs de la famille (liste des
-- invitations en attente). Aucune ecriture directe.
drop policy if exists "Lecture invitations si membre actif" on invitations_famille;
create policy "Lecture invitations si membre actif"
  on invitations_famille for select
  to authenticated
  using (est_membre_actif_famille(famille_id));

-- ---------------------------------------------------------------------------
-- Creer une invitation
-- ---------------------------------------------------------------------------
create or replace function rpc_creer_invitation(
  p_famille_id uuid,
  p_email text,
  p_prenom text,
  p_token_hash text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role_parent_id uuid;
  v_email          text;
  v_id             uuid;
  v_en_attente     integer;
begin
  if auth.uid() is null then
    raise exception 'utilisateur_non_authentifie';
  end if;
  if not est_membre_actif_famille(p_famille_id) then
    raise exception 'acces_refuse';
  end if;
  if p_token_hash is null or length(p_token_hash) < 32 then
    raise exception 'empreinte_invalide';
  end if;

  v_email := nullif(lower(trim(coalesce(p_email, ''))), '');
  if v_email is not null and v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'email_invalide';
  end if;

  select count(*) into v_en_attente
  from invitations_famille
  where famille_id = p_famille_id
    and utilise_le is null
    and annule_le is null
    and expire_le > now();
  if v_en_attente >= 10 then
    raise exception 'trop_d_invitations';
  end if;

  select id into v_role_parent_id from roles_famille where code = 'parent';

  insert into invitations_famille (
    famille_id, role_id, email, prenom_invite, token_hash, cree_par, expire_le
  ) values (
    p_famille_id, v_role_parent_id, v_email,
    nullif(trim(coalesce(p_prenom, '')), ''),
    p_token_hash, auth.uid(), now() + interval '7 days'
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function rpc_creer_invitation(uuid, text, text, text) from public;
grant execute on function rpc_creer_invitation(uuid, text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Annuler une invitation en attente
-- ---------------------------------------------------------------------------
create or replace function rpc_annuler_invitation(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_famille_id uuid;
begin
  select famille_id into v_famille_id from invitations_famille where id = p_id;
  if v_famille_id is null or not est_membre_actif_famille(v_famille_id) then
    raise exception 'acces_refuse';
  end if;
  update invitations_famille
     set annule_le = now()
   where id = p_id and utilise_le is null and annule_le is null;
end;
$$;

revoke all on function rpc_annuler_invitation(uuid) from public;
grant execute on function rpc_annuler_invitation(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Apercu d'une invitation (avant connexion). Ne revele que le nom de
-- l'espace et si le lien est utilisable. Accessible sans compte.
-- ---------------------------------------------------------------------------
create or replace function rpc_apercu_invitation(p_token_hash text)
returns table (
  motif text,
  nom_famille text,
  email_restreint boolean,
  prenom_invite text
)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_inv invitations_famille%rowtype;
  v_nom text;
begin
  select * into v_inv from invitations_famille where token_hash = p_token_hash;
  if not found then
    return query select 'introuvable'::text, null::text, false, null::text;
    return;
  end if;

  select nom into v_nom from familles where id = v_inv.famille_id;

  if v_inv.annule_le is not null then
    return query select 'annulee'::text, null::text, false, null::text;
  elsif v_inv.utilise_le is not null then
    return query select 'utilisee'::text, null::text, false, null::text;
  elsif v_inv.expire_le <= now() then
    return query select 'expiree'::text, null::text, false, null::text;
  else
    return query select 'ok'::text, v_nom, (v_inv.email is not null), v_inv.prenom_invite;
  end if;
end;
$$;

revoke all on function rpc_apercu_invitation(text) from public;
grant execute on function rpc_apercu_invitation(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Accepter une invitation
--
-- Un compte n'appartient qu'a un seul espace. Si la personne a deja un
-- espace, il doit etre VIDE (aucun enfant, aucun autre membre) : on le
-- retire alors, puis on la rattache a l'espace qui l'invite. Sinon on
-- refuse, pour ne jamais faire perdre de donnees.
-- ---------------------------------------------------------------------------
create or replace function rpc_accepter_invitation(p_token_hash text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inv             invitations_famille%rowtype;
  v_email_connecte  text;
  v_autre_famille   uuid;
  v_statut_actif_id uuid;
begin
  if auth.uid() is null then
    raise exception 'utilisateur_non_authentifie';
  end if;

  select * into v_inv
  from invitations_famille
  where token_hash = p_token_hash
  for update;

  if not found then
    raise exception 'invitation_introuvable';
  end if;
  if v_inv.annule_le is not null then
    raise exception 'invitation_annulee';
  end if;

  -- Deja membre de cette famille : on ne fait rien de plus (idempotent).
  if exists (
    select 1 from utilisateurs_familles
    where user_id = auth.uid() and famille_id = v_inv.famille_id
  ) then
    return v_inv.famille_id;
  end if;

  if v_inv.utilise_le is not null then
    raise exception 'invitation_utilisee';
  end if;
  if v_inv.expire_le <= now() then
    raise exception 'invitation_expiree';
  end if;

  if v_inv.email is not null then
    select lower(email) into v_email_connecte from auth.users where id = auth.uid();
    if v_email_connecte is distinct from v_inv.email then
      raise exception 'invitation_autre_adresse';
    end if;
  end if;

  select famille_id into v_autre_famille
  from utilisateurs_familles
  where user_id = auth.uid()
  limit 1;

  if v_autre_famille is not null then
    if exists (select 1 from enfants where famille_id = v_autre_famille)
       or exists (
         select 1 from utilisateurs_familles
         where famille_id = v_autre_famille and user_id <> auth.uid()
       ) then
      raise exception 'espace_non_vide';
    end if;

    delete from utilisateurs_familles
    where user_id = auth.uid() and famille_id = v_autre_famille;

    -- On tente de supprimer l'espace vide devenu orphelin ; si une
    -- contrainte s'y oppose, il reste simplement sans membre (sans effet).
    begin
      delete from familles where id = v_autre_famille;
    exception when others then
      null;
    end;
  end if;

  select id into v_statut_actif_id from statuts_appartenance_famille where code = 'actif';

  insert into utilisateurs_familles (user_id, famille_id, role_id, statut_id, invite_par)
  values (auth.uid(), v_inv.famille_id, v_inv.role_id, v_statut_actif_id, v_inv.cree_par);

  update invitations_famille
     set utilise_le = now(), utilise_par = auth.uid()
   where id = v_inv.id;

  return v_inv.famille_id;
end;
$$;

revoke all on function rpc_accepter_invitation(text) from public;
grant execute on function rpc_accepter_invitation(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Liste des personnes d'un espace (prenom et e-mail inclus)
-- ---------------------------------------------------------------------------
create or replace function rpc_membres_famille(p_famille_id uuid)
returns table (
  user_id uuid,
  prenom text,
  email text,
  role_code text,
  depuis timestamptz,
  est_moi boolean
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not est_membre_actif_famille(p_famille_id) then
    raise exception 'acces_refuse';
  end if;

  return query
  select uf.user_id,
         nullif(trim(coalesce(u.raw_user_meta_data ->> 'prenom', '')), ''),
         u.email::text,
         r.code,
         uf.created_at,
         (uf.user_id = auth.uid())
  from utilisateurs_familles uf
  join auth.users u on u.id = uf.user_id
  join roles_famille r on r.id = uf.role_id
  where uf.famille_id = p_famille_id
  order by uf.created_at;
end;
$$;

revoke all on function rpc_membres_famille(uuid) from public;
grant execute on function rpc_membres_famille(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Retirer une autre personne de l'espace. On ne peut pas se retirer
-- soi-meme (l'espace garde donc toujours au moins un parent). Les
-- activites et photos qu'elle a ajoutees restent dans l'espace.
-- ---------------------------------------------------------------------------
create or replace function rpc_retirer_membre(p_famille_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not est_membre_actif_famille(p_famille_id) then
    raise exception 'acces_refuse';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'retrait_de_soi_impossible';
  end if;

  delete from utilisateurs_familles
  where famille_id = p_famille_id and user_id = p_user_id;
end;
$$;

revoke all on function rpc_retirer_membre(uuid, uuid) from public;
grant execute on function rpc_retirer_membre(uuid, uuid) to authenticated;
