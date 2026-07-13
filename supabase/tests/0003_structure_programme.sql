-- Tests pgTAP — lot 3 (structure du programme officiel, sans import réel).

begin;
select plan(6);

insert into auth.users (id, email, encrypted_password, email_confirmed_at, aud, role)
values ('55555555-5555-5555-5555-555555555555', 'parent-c@test.local', 'x', now(), 'authenticated', 'authenticated');

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '55555555-5555-5555-5555-555555555555')::text, true);
select rpc_creer_espace_familial('Famille C');
reset role;

-- ---------------------------------------------------------------------------
-- Un utilisateur authentifié peut lire le référentiel (même vide).
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '55555555-5555-5555-5555-555555555555')::text, true);

select lives_ok(
  $$ select count(*) from types_element_programme $$,
  'Un utilisateur authentifié peut lire types_element_programme'
);

select lives_ok(
  $$ select count(*) from elements_programme $$,
  'Un utilisateur authentifié peut lire elements_programme'
);

-- Aucune policy insert pour les utilisateurs standards.
select throws_ok(
  $$ insert into types_element_programme (code, libelle) values ('test', 'Test') $$,
  null,
  'Un utilisateur standard ne peut pas écrire dans types_element_programme'
);
reset role;

-- ---------------------------------------------------------------------------
-- Trigger de cohérence de cycle, testé côté postgres (hors RLS) pour isoler
-- le comportement du trigger de celui de la RLS.
-- ---------------------------------------------------------------------------
insert into elements_programme (cycle_id, type_element_id, libelle)
select c.id, t.id, 'Domaine de test'
from cycles c
join referentiels_programmes r on r.id = c.referentiel_id and r.version = 'brouillon-0'
join types_element_programme t on t.code = 'domaine';

select is(
  (select count(*)::int from elements_programme where libelle = 'Domaine de test'),
  1,
  'Un élément racine (sans parent) peut être créé'
);

-- Un enfant dans le même cycle : autorisé.
select lives_ok(
  $$ insert into elements_programme (cycle_id, parent_id, type_element_id, libelle)
     select
       (select cycle_id from elements_programme where libelle = 'Domaine de test'),
       (select id from elements_programme where libelle = 'Domaine de test'),
       (select id from types_element_programme where code = 'competence'),
       'Compétence de test' $$,
  'Un élément enfant du même cycle que son parent est accepté'
);

-- Un second cycle, pour tester le rejet d'un mélange de cycles.
insert into referentiels_programmes (nom, version, date_entree_vigueur, statut)
values ('Référentiel de test 2', 'test-2', current_date, 'actif');

insert into cycles (referentiel_id, libelle, ordre)
select id, 'Cycle de test 2', 1 from referentiels_programmes where version = 'test-2';

select throws_like(
  $$ insert into elements_programme (cycle_id, parent_id, type_element_id, libelle)
     select
       (select id from cycles where libelle = 'Cycle de test 2'),
       (select id from elements_programme where libelle = 'Domaine de test'),
       (select id from types_element_programme where code = 'competence'),
       'Compétence incohérente' $$,
  '%même cycle que son parent%',
  'Le trigger refuse un enfant rattaché à un cycle différent de celui de son parent'
);

select finish();
rollback;
