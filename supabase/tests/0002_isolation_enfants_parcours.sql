-- Tests pgTAP — lot 2 (enfants, années scolaires, parcours scolaires).
-- Complète supabase/tests/0001_isolation_familles.sql, ne le remplace pas.

begin;
select plan(11);

-- ---------------------------------------------------------------------------
-- Préparation : deux familles fictives (mêmes comptes que le test du lot 1,
-- recréés ici pour que ce fichier soit exécutable indépendamment).
-- ---------------------------------------------------------------------------
insert into auth.users (id, email, encrypted_password, email_confirmed_at, aud, role)
values
  ('33333333-3333-3333-3333-333333333333', 'parent-a2@test.local', 'x', now(), 'authenticated', 'authenticated'),
  ('44444444-4444-4444-4444-444444444444', 'parent-b2@test.local', 'x', now(), 'authenticated', 'authenticated');

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '33333333-3333-3333-3333-333333333333')::text, true);
select rpc_creer_espace_familial('Famille A2');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '44444444-4444-4444-4444-444444444444')::text, true);
select rpc_creer_espace_familial('Famille B2');
reset role;

-- Un second référentiel/cycle, distinct du seed provisoire, pour tester le
-- garde-fou "cycle appartient bien au référentiel indiqué" (test 9).
insert into referentiels_programmes (nom, version, date_entree_vigueur, statut)
values ('Référentiel de test', 'test-1', current_date, 'actif');

insert into cycles (referentiel_id, libelle, ordre)
select id, 'Cycle de test', 1 from referentiels_programmes where version = 'test-1';

-- ---------------------------------------------------------------------------
-- Le parent A2 crée un enfant, une année scolaire, un parcours.
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '33333333-3333-3333-3333-333333333333')::text, true);

insert into enfants (famille_id, prenom)
select id, 'Nino' from familles where nom = 'Famille A2';

insert into annees_scolaires (famille_id, libelle, date_debut, date_fin)
select id, '2026-2027', '2026-09-01', '2027-07-05' from familles where nom = 'Famille A2';

insert into parcours_scolaires (enfant_id, annee_scolaire_id, referentiel_id, cycle_id, niveau_indicatif)
select
  e.id, a.id,
  r.id, c.id,
  'Grande section'
from enfants e
join familles f on f.id = e.famille_id and f.nom = 'Famille A2'
join annees_scolaires a on a.famille_id = f.id and a.libelle = '2026-2027'
join referentiels_programmes r on r.version = 'brouillon-0'
join cycles c on c.referentiel_id = r.id;

select is(
  (select count(*)::int from enfants where prenom = 'Nino'),
  1,
  'Le parent A2 voit l''enfant qu''il vient de créer'
);

select is(
  (select count(*)::int from parcours_scolaires),
  1,
  'Le parent A2 voit le parcours qu''il vient de créer'
);
reset role;

-- ---------------------------------------------------------------------------
-- Le parent B2 ne voit rien de la famille A2.
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '44444444-4444-4444-4444-444444444444')::text, true);

select is(
  (select count(*)::int from enfants where prenom = 'Nino'),
  0,
  'Le parent B2 ne voit pas l''enfant de la famille A2'
);

select is(
  (select count(*)::int from annees_scolaires where libelle = '2026-2027'),
  0,
  'Le parent B2 ne voit pas l''année scolaire de la famille A2'
);

select is(
  (select count(*)::int from parcours_scolaires),
  0,
  'Le parent B2 ne voit aucun parcours de la famille A2'
);

-- Le parent B2 ne peut pas modifier l'enfant de la famille A2.
update enfants set prenom = 'Pirate' where prenom = 'Nino';
select is(
  (select count(*)::int from enfants where prenom = 'Pirate'),
  0,
  'Le parent B2 ne peut pas modifier l''enfant de la famille A2'
);

-- Le parent B2 ne peut pas supprimer l'enfant de la famille A2.
delete from enfants where prenom = 'Nino';
reset role;

select is(
  (select count(*)::int from enfants where prenom = 'Nino'),
  1,
  'L''enfant de la famille A2 existe toujours après tentative de suppression par B2'
);

-- ---------------------------------------------------------------------------
-- Cohérence : un parcours ne peut pas relier un enfant et une année de
-- familles différentes.
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '44444444-4444-4444-4444-444444444444')::text, true);

insert into enfants (famille_id, prenom)
select id, 'Autre enfant' from familles where nom = 'Famille B2';

insert into annees_scolaires (famille_id, libelle, date_debut, date_fin)
select id, '2027-2028', '2027-09-01', '2028-07-05' from familles where nom = 'Famille B2';
reset role;

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '33333333-3333-3333-3333-333333333333')::text, true);

select throws_like(
  $$ insert into parcours_scolaires (enfant_id, annee_scolaire_id, referentiel_id, cycle_id)
     select
       (select id from enfants where prenom = 'Nino'),
       (select id from annees_scolaires where libelle = '2027-2028'),
       (select id from referentiels_programmes where version = 'brouillon-0'),
       (select id from cycles c join referentiels_programmes r on r.id = c.referentiel_id and r.version = 'brouillon-0')
  $$,
  '%n''appartiennent pas à la même famille%',
  'Le trigger refuse un enfant et une année de familles différentes'
);

-- ---------------------------------------------------------------------------
-- Cohérence : un parcours ne peut pas déclarer un cycle qui n'appartient
-- pas au référentiel indiqué.
-- ---------------------------------------------------------------------------
select throws_like(
  $$ insert into parcours_scolaires (enfant_id, annee_scolaire_id, referentiel_id, cycle_id)
     select
       (select id from enfants where prenom = 'Nino'),
       (select id from annees_scolaires where libelle = '2026-2027'),
       (select id from referentiels_programmes where version = 'brouillon-0'),
       (select id from cycles where libelle = 'Cycle de test')
  $$,
  '%cycle sélectionné n''appartient pas au référentiel%',
  'Le trigger refuse un cycle qui n''appartient pas au référentiel déclaré'
);
reset role;

select finish();
rollback;
