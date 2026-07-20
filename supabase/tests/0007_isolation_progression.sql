-- Tests pgTAP - lot 7 (syntheses_progression, vue v_indicateurs_observation).

begin;
select plan(5);

insert into auth.users (id, email, encrypted_password, email_confirmed_at, aud, role)
values
  ('22222222-3333-4444-5555-666666666601', 'parent-g1@test.local', 'x', now(), 'authenticated', 'authenticated'),
  ('22222222-3333-4444-5555-666666666602', 'parent-g2@test.local', 'x', now(), 'authenticated', 'authenticated');

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '22222222-3333-4444-5555-666666666601')::text, true);
select rpc_creer_espace_familial('Famille G1');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '22222222-3333-4444-5555-666666666602')::text, true);
select rpc_creer_espace_familial('Famille G2');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '22222222-3333-4444-5555-666666666601')::text, true);

insert into enfants (famille_id, prenom)
select id, 'Tom' from familles where nom = 'Famille G1';

insert into annees_scolaires (famille_id, libelle, date_debut, date_fin)
select id, '2026-2027', '2026-09-01', '2027-07-05' from familles where nom = 'Famille G1';

insert into parcours_scolaires (enfant_id, annee_scolaire_id, referentiel_id, cycle_id)
select e.id, a.id, r.id, c.id
from enfants e
join familles f on f.id = e.famille_id and f.nom = 'Famille G1'
join annees_scolaires a on a.famille_id = f.id and a.libelle = '2026-2027'
join referentiels_programmes r on r.statut = 'actif'
join cycles c on c.referentiel_id = r.id
limit 1;

insert into activites (parcours_id, auteur_id, auteur_nom_affiche, date_activite, titre, contexte_id, statut_id)
select
  (select id from parcours_scolaires limit 1),
  '22222222-3333-4444-5555-666666666601',
  'Parent G1',
  current_date,
  'Puzzle',
  (select id from contextes_activite where code = 'jeu_libre'),
  (select id from statuts_activite where code = 'brouillon');

insert into observations_elements_programme
  (activite_id, element_programme_id, niveau_autonomie_id, auteur_id, auteur_nom_affiche)
select
  (select id from activites where titre = 'Puzzle'),
  (select id from elements_programme where type_element_id = (select id from types_element_programme where code = 'objectif') limit 1),
  (select id from niveaux_autonomie where code = 'autonome'),
  '22222222-3333-4444-5555-666666666601',
  'Parent G1';

insert into syntheses_progression
  (parcours_id, element_programme_id, statut_global_id, valide_par, valide_par_nom_affiche)
select
  (select id from parcours_scolaires limit 1),
  (select id from elements_programme where type_element_id = (select id from types_element_programme where code = 'objectif') limit 1),
  (select id from statuts_progression where code = 'premiere_observation'),
  '22222222-3333-4444-5555-666666666601',
  'Parent G1';

select is(
  (select count(*)::int from syntheses_progression),
  1,
  'Le parent G1 voit la synthese qu''il vient de creer'
);

select is(
  (select nb_observations::int from v_indicateurs_observation limit 1),
  1,
  'La vue d''indicateurs compte correctement 1 observation pour le parent G1'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '22222222-3333-4444-5555-666666666602')::text, true);

select is(
  (select count(*)::int from syntheses_progression),
  0,
  'Le parent G2 ne voit pas la synthese de la famille G1'
);

select is(
  (select count(*)::int from v_indicateurs_observation),
  0,
  'La vue d''indicateurs ne fuite aucune ligne vers le parent G2 (security_invoker)'
);

delete from syntheses_progression;
reset role;

select is(
  (select count(*)::int from syntheses_progression),
  1,
  'La synthese de la famille G1 existe toujours apres tentative de suppression par G2'
);

select finish();
rollback;
