-- Tests pgTAP - lot 5 (traces, table + storage.objects).

begin;
select plan(6);

insert into auth.users (id, email, encrypted_password, email_confirmed_at, aud, role)
values
  ('88888888-8888-8888-8888-888888888888', 'parent-e1@test.local', 'x', now(), 'authenticated', 'authenticated'),
  ('99999999-9999-9999-9999-999999999999', 'parent-e2@test.local', 'x', now(), 'authenticated', 'authenticated');

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '88888888-8888-8888-8888-888888888888')::text, true);
select rpc_creer_espace_familial('Famille E1');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '99999999-9999-9999-9999-999999999999')::text, true);
select rpc_creer_espace_familial('Famille E2');
reset role;

-- Le parent E1 cree enfant / annee / parcours / activite / trace texte.
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '88888888-8888-8888-8888-888888888888')::text, true);

insert into enfants (famille_id, prenom)
select id, 'Sacha' from familles where nom = 'Famille E1';

insert into annees_scolaires (famille_id, libelle, date_debut, date_fin)
select id, '2026-2027', '2026-09-01', '2027-07-05' from familles where nom = 'Famille E1';

insert into parcours_scolaires (enfant_id, annee_scolaire_id, referentiel_id, cycle_id)
select e.id, a.id, r.id, c.id
from enfants e
join familles f on f.id = e.famille_id and f.nom = 'Famille E1'
join annees_scolaires a on a.famille_id = f.id and a.libelle = '2026-2027'
join referentiels_programmes r on r.version = 'brouillon-0'
join cycles c on c.referentiel_id = r.id;

insert into activites (parcours_id, auteur_id, auteur_nom_affiche, date_activite, titre, contexte_id, statut_id)
select
  (select id from parcours_scolaires limit 1),
  '88888888-8888-8888-8888-888888888888',
  'Parent E1',
  current_date,
  'Peinture',
  (select id from contextes_activite where code = 'proposee'),
  (select id from statuts_activite where code = 'brouillon');

insert into traces (activite_id, type_id, contenu_texte, statut_id, auteur_id, auteur_nom_affiche)
select
  (select id from activites where titre = 'Peinture'),
  (select id from types_trace where code = 'citation'),
  'Regarde, j''ai fait un arc-en-ciel !',
  (select id from statuts_trace where code = 'prive'),
  '88888888-8888-8888-8888-888888888888',
  'Parent E1';

select is(
  (select count(*)::int from traces where contenu_texte like '%arc-en-ciel%'),
  1,
  'Le parent E1 voit la trace qu''il vient de creer'
);
reset role;

-- Le parent E2 ne voit rien de la famille E1.
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '99999999-9999-9999-9999-999999999999')::text, true);

select is(
  (select count(*)::int from traces where contenu_texte like '%arc-en-ciel%'),
  0,
  'Le parent E2 ne voit pas la trace de la famille E1'
);

update traces set legende = 'Piratee' where contenu_texte like '%arc-en-ciel%';
select is(
  (select count(*)::int from traces where legende = 'Piratee'),
  0,
  'Le parent E2 ne peut pas modifier la trace de la famille E1'
);

delete from traces where contenu_texte like '%arc-en-ciel%';
reset role;

select is(
  (select count(*)::int from traces where contenu_texte like '%arc-en-ciel%'),
  1,
  'La trace de la famille E1 existe toujours apres tentative de suppression par E2'
);

-- ---------------------------------------------------------------------------
-- Storage : le parent E2 ne peut pas deposer un fichier sous le prefixe
-- de la famille E1.
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '99999999-9999-9999-9999-999999999999')::text, true);

select throws_ok(
  format(
    $$ insert into storage.objects (bucket_id, name, owner)
       values ('traces-pedagogiques', %L, auth.uid()) $$,
    (select id from familles where nom = 'Famille E1') || '/intrusion.jpg'
  ),
  null,
  'Le parent E2 ne peut pas deposer un fichier dans le dossier de la famille E1'
);

-- Le parent E2 peut deposer un fichier dans son propre dossier.
select lives_ok(
  format(
    $$ insert into storage.objects (bucket_id, name, owner)
       values ('traces-pedagogiques', %L, auth.uid()) $$,
    (select id from familles where nom = 'Famille E2') || '/test.jpg'
  ),
  'Le parent E2 peut deposer un fichier dans son propre dossier'
);
reset role;

select finish();
rollback;
