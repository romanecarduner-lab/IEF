-- Tests pgTAP — isolation des données entre familles (lot 1).
--
-- Exécution locale : supabase test db
-- Exécution CI     : .github/workflows/tests-rls.yml
--
-- Portée du lot 1 : familles + utilisateurs_familles uniquement.
-- Les tests sur storage.objects seront ajoutés avec le lot "Traces".

begin;
select plan(11);

-- ---------------------------------------------------------------------------
-- Préparation : deux utilisateurs fictifs, dans deux familles distinctes.
-- ---------------------------------------------------------------------------
insert into auth.users (id, email, encrypted_password, email_confirmed_at, aud, role)
values
  ('11111111-1111-1111-1111-111111111111', 'parent-a@test.local', 'x', now(), 'authenticated', 'authenticated'),
  ('22222222-2222-2222-2222-222222222222', 'parent-b@test.local', 'x', now(), 'authenticated', 'authenticated');

-- Création de la famille A, en tant que parent A.
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '11111111-1111-1111-1111-111111111111')::text, true);
select rpc_creer_espace_familial('Famille A');
reset role;

-- Création de la famille B, en tant que parent B.
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '22222222-2222-2222-2222-222222222222')::text, true);
select rpc_creer_espace_familial('Famille B');
reset role;

-- ---------------------------------------------------------------------------
-- 1. Le parent A voit sa propre famille.
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '11111111-1111-1111-1111-111111111111')::text, true);

select is(
  (select count(*)::int from familles where nom = 'Famille A'),
  1,
  'Le parent A voit sa propre famille'
);

select is(
  (select count(*)::int from utilisateurs_familles
     where user_id = '11111111-1111-1111-1111-111111111111'),
  1,
  'Le parent A voit sa propre appartenance'
);

-- 2. Le parent A ne voit jamais la famille B.
select is(
  (select count(*)::int from familles where nom = 'Famille B'),
  0,
  'Le parent A ne voit pas la famille B'
);

select is(
  (select count(*)::int from utilisateurs_familles
     where user_id = '22222222-2222-2222-2222-222222222222'),
  0,
  'Le parent A ne voit pas l''appartenance du parent B'
);

-- 3. Le parent A ne peut pas insérer une ligne rattachant un tiers à sa famille
--    (aucune policy insert n'existe sur utilisateurs_familles pour le rôle
--    authenticated : l'insertion directe doit échouer).
select throws_ok(
  $$ insert into utilisateurs_familles (user_id, famille_id, role_id, statut_id)
     select '22222222-2222-2222-2222-222222222222',
            f.id,
            (select id from roles_famille where code = 'parent'),
            (select id from statuts_appartenance_famille where code = 'actif')
     from familles f where f.nom = 'Famille A' $$,
  null,
  'Insertion directe dans utilisateurs_familles refusée (pas de policy insert)'
);

-- 4a. Le parent A ne peut pas modifier la famille B (aucune ligne affectée).
update familles set nom = 'Piratee' where nom = 'Famille B';
select is(
  (select count(*)::int from familles where nom = 'Piratee'),
  0,
  'Le parent A ne peut pas modifier la famille B'
);

-- 4b. Le parent A ne peut pas supprimer la famille B (aucune policy delete,
--     la ligne doit toujours exister ensuite).
delete from familles where nom = 'Famille B';
reset role;

-- Vérification côté "postgres" (sans RLS) que la famille B existe toujours.
select is(
  (select count(*)::int from familles where nom = 'Famille B'),
  1,
  'La famille B existe toujours après tentative de suppression par le parent A'
);

-- ---------------------------------------------------------------------------
-- 5. Un membre retiré (statut != actif) perd immédiatement l'accès.
-- ---------------------------------------------------------------------------
update utilisateurs_familles
set statut_id = (select id from statuts_appartenance_famille where code = 'invite_en_attente')
where user_id = '11111111-1111-1111-1111-111111111111';

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '11111111-1111-1111-1111-111111111111')::text, true);

select is(
  (select count(*)::int from familles where nom = 'Famille A'),
  0,
  'Un membre au statut non actif perd l''accès à sa famille'
);
reset role;

-- Remise en état pour la suite des tests
update utilisateurs_familles
set statut_id = (select id from statuts_appartenance_famille where code = 'actif')
where user_id = '11111111-1111-1111-1111-111111111111';

-- ---------------------------------------------------------------------------
-- 6. Un utilisateur non authentifié (anon) n'accède à aucune ligne.
-- ---------------------------------------------------------------------------
set local role anon;
select set_config('request.jwt.claims', '', true);

select is(
  (select count(*)::int from familles),
  0,
  'Un utilisateur anonyme ne voit aucune famille'
);

select is(
  (select count(*)::int from utilisateurs_familles),
  0,
  'Un utilisateur anonyme ne voit aucune appartenance'
);
reset role;

-- ---------------------------------------------------------------------------
-- 7. Un utilisateur ne peut pas créer un deuxième espace pour lui-même
--    (garde-fou de rpc_creer_espace_familial).
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '11111111-1111-1111-1111-111111111111')::text, true);

select throws_ok(
  $$ select rpc_creer_espace_familial('Deuxieme famille') $$,
  'Cet utilisateur appartient déjà à un espace familial.',
  'Un utilisateur ne peut pas créer un second espace familial'
);
reset role;

select finish();
rollback;
