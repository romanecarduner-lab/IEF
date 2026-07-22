-- Tests pgTAP - lot 10 (dossiers_export, dossiers_export_elements).

begin;
select plan(4);

insert into auth.users (id, email, encrypted_password, email_confirmed_at, aud, role)
values
  ('33333333-4444-5555-6666-777777777701', 'parent-h1@test.local', 'x', now(), 'authenticated', 'authenticated'),
  ('33333333-4444-5555-6666-777777777702', 'parent-h2@test.local', 'x', now(), 'authenticated', 'authenticated');

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '33333333-4444-5555-6666-777777777701')::text, true);
select rpc_creer_espace_familial('Famille H1');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '33333333-4444-5555-6666-777777777702')::text, true);
select rpc_creer_espace_familial('Famille H2');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '33333333-4444-5555-6666-777777777701')::text, true);

insert into enfants (famille_id, prenom)
select id, 'Zoe' from familles where nom = 'Famille H1';

insert into annees_scolaires (famille_id, libelle, date_debut, date_fin)
select id, '2026-2027', '2026-09-01', '2027-07-05' from familles where nom = 'Famille H1';

insert into parcours_scolaires (enfant_id, annee_scolaire_id, referentiel_id, cycle_id)
select e.id, a.id, r.id, c.id
from enfants e
join familles f on f.id = e.famille_id and f.nom = 'Famille H1'
join annees_scolaires a on a.famille_id = f.id and a.libelle = '2026-2027'
join referentiels_programmes r on r.statut = 'actif'
join cycles c on c.referentiel_id = r.id
limit 1;

insert into dossiers_export (parcours_id, titre, created_par, created_par_nom_affiche)
select
  (select id from parcours_scolaires limit 1),
  'Dossier annuel 2026-2027',
  '33333333-4444-5555-6666-777777777701',
  'Parent H1';

select is(
  (select count(*)::int from dossiers_export),
  1,
  'Le parent H1 voit le dossier qu''il vient de creer'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '33333333-4444-5555-6666-777777777702')::text, true);

select is(
  (select count(*)::int from dossiers_export),
  0,
  'Le parent H2 ne voit pas le dossier de la famille H1'
);

update dossiers_export set titre = 'Piratee';
select is(
  (select count(*)::int from dossiers_export where titre = 'Piratee'),
  0,
  'Le parent H2 ne peut pas modifier le dossier de la famille H1'
);

delete from dossiers_export;
reset role;

select is(
  (select count(*)::int from dossiers_export),
  1,
  'Le dossier de la famille H1 existe toujours apres tentative de suppression par H2'
);

select finish();
rollback;
