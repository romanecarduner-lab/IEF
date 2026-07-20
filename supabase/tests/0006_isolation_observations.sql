-- Tests pgTAP - lot 6 (observations_elements_programme).

begin;
select plan(4);

insert into auth.users (id, email, encrypted_password, email_confirmed_at, aud, role)
values
  ('11111111-2222-3333-4444-555555555501', 'parent-f1@test.local', 'x', now(), 'authenticated', 'authenticated'),
  ('11111111-2222-3333-4444-555555555502', 'parent-f2@test.local', 'x', now(), 'authenticated', 'authenticated');

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '11111111-2222-3333-4444-555555555501')::text, true);
select rpc_creer_espace_familial('Famille F1');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '11111111-2222-3333-4444-555555555502')::text, true);
select rpc_creer_espace_familial('Famille F2');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '11111111-2222-3333-4444-555555555501')::text, true);

insert into enfants (famille_id, prenom)
select id, 'Adele' from familles where nom = 'Famille F1';

insert into annees_scolaires (famille_id, libelle, date_debut, date_fin)
select id, '2026-2027', '2026-09-01', '2027-07-05' from familles where nom = 'Famille F1';

insert into parcours_scolaires (enfant_id, annee_scolaire_id, referentiel_id, cycle_id)
select e.id, a.id, r.id, c.id
from enfants e
join familles f on f.id = e.famille_id and f.nom = 'Famille F1'
join annees_scolaires a on a.famille_id = f.id and a.libelle = '2026-2027'
join referentiels_programmes r on r.statut = 'actif'
join cycles c on c.referentiel_id = r.id
limit 1;

insert into activites (parcours_id, auteur_id, auteur_nom_affiche, date_activite, titre, contexte_id, statut_id)
select
  (select id from parcours_scolaires limit 1),
  '11111111-2222-3333-4444-555555555501',
  'Parent F1',
  current_date,
  'Comptine',
  (select id from contextes_activite where code = 'spontanee'),
  (select id from statuts_activite where code = 'brouillon');

insert into observations_elements_programme
  (activite_id, element_programme_id, niveau_autonomie_id, auteur_id, auteur_nom_affiche)
select
  (select id from activites where titre = 'Comptine'),
  (select id from elements_programme where type_element_id = (select id from types_element_programme where code = 'objectif') limit 1),
  (select id from niveaux_autonomie where code = 'autonome'),
  '11111111-2222-3333-4444-555555555501',
  'Parent F1';

select is(
  (select count(*)::int from observations_elements_programme),
  1,
  'Le parent F1 voit l''observation qu''il vient de creer'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '11111111-2222-3333-4444-555555555502')::text, true);

select is(
  (select count(*)::int from observations_elements_programme),
  0,
  'Le parent F2 ne voit pas l''observation de la famille F1'
);

delete from observations_elements_programme;
reset role;

select is(
  (select count(*)::int from observations_elements_programme),
  1,
  'L''observation de la famille F1 existe toujours apres tentative de suppression par F2'
);

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '11111111-2222-3333-4444-555555555502')::text, true);

select throws_ok(
  format(
    $$ insert into observations_elements_programme
       (activite_id, element_programme_id, niveau_autonomie_id, auteur_id, auteur_nom_affiche)
       values (%L, (select id from elements_programme where type_element_id =
         (select id from types_element_programme where code = 'objectif') limit 1),
         (select id from niveaux_autonomie where code = 'autonome'),
         '11111111-2222-3333-4444-555555555502', 'Parent F2') $$,
    (select id from activites where titre = 'Comptine')
  ),
  null,
  'Le parent F2 ne peut pas creer une observation sur l''activite de la famille F1'
);
reset role;

select finish();
rollback;
