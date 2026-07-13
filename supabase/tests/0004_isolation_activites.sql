-- Tests pgTAP — lot 4 (journal pédagogique / activites).

begin;
select plan(6);

insert into auth.users (id, email, encrypted_password, email_confirmed_at, aud, role)
values
  ('66666666-6666-6666-6666-666666666666', 'parent-d1@test.local', 'x', now(), 'authenticated', 'authenticated'),
  ('77777777-7777-7777-7777-777777777777', 'parent-d2@test.local', 'x', now(), 'authenticated', 'authenticated');

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '66666666-6666-6666-6666-666666666666')::text, true);
select rpc_creer_espace_familial('Famille D1');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '77777777-7777-7777-7777-777777777777')::text, true);
select rpc_creer_espace_familial('Famille D2');
reset role;

-- Le parent D1 crée un enfant, une année, un parcours, puis une activité.
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '66666666-6666-6666-6666-666666666666')::text, true);

insert into enfants (famille_id, prenom)
select id, 'Léa' from familles where nom = 'Famille D1';

insert into annees_scolaires (famille_id, libelle, date_debut, date_fin)
select id, '2026-2027', '2026-09-01', '2027-07-05' from familles where nom = 'Famille D1';

insert into parcours_scolaires (enfant_id, annee_scolaire_id, referentiel_id, cycle_id)
select
  e.id, a.id, r.id, c.id
from enfants e
join familles f on f.id = e.famille_id and f.nom = 'Famille D1'
join annees_scolaires a on a.famille_id = f.id and a.libelle = '2026-2027'
join referentiels_programmes r on r.version = 'brouillon-0'
join cycles c on c.referentiel_id = r.id;

insert into activites (parcours_id, auteur_id, auteur_nom_affiche, date_activite, titre, contexte_id, statut_id)
select
  (select id from parcours_scolaires limit 1),
  '66666666-6666-6666-6666-666666666666',
  'Parent D1',
  current_date,
  'Cabane dans les bois',
  (select id from contextes_activite where code = 'spontanee'),
  (select id from statuts_activite where code = 'brouillon');

select is(
  (select count(*)::int from activites where titre = 'Cabane dans les bois'),
  1,
  'Le parent D1 voit l''activité qu''il vient de créer'
);
reset role;

-- Le parent D2 ne voit rien de la famille D1.
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '77777777-7777-7777-7777-777777777777')::text, true);

select is(
  (select count(*)::int from activites where titre = 'Cabane dans les bois'),
  0,
  'Le parent D2 ne voit pas l''activité de la famille D1'
);

-- Le parent D2 ne peut pas modifier l'activité de la famille D1.
update activites set titre = 'Piratee' where titre = 'Cabane dans les bois';
select is(
  (select count(*)::int from activites where titre = 'Piratee'),
  0,
  'Le parent D2 ne peut pas modifier l''activité de la famille D1'
);

-- Le parent D2 ne peut pas la supprimer.
delete from activites where titre = 'Cabane dans les bois';
reset role;

select is(
  (select count(*)::int from activites where titre = 'Cabane dans les bois'),
  1,
  'L''activité de la famille D1 existe toujours après tentative de suppression par D2'
);

-- Le parent D2 ne peut pas créer une activité rattachée au parcours de D1.
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '77777777-7777-7777-7777-777777777777')::text, true);

select throws_ok(
  $$ insert into activites (parcours_id, auteur_id, auteur_nom_affiche, date_activite, titre, contexte_id, statut_id)
     select
       (select id from parcours_scolaires ps
          join enfants e on e.id = ps.enfant_id
          join familles f on f.id = e.famille_id and f.nom = 'Famille D1'),
       '77777777-7777-7777-7777-777777777777',
       'Parent D2',
       current_date,
       'Intrusion',
       (select id from contextes_activite where code = 'autre'),
       (select id from statuts_activite where code = 'brouillon') $$,
  null,
  'Le parent D2 ne peut pas créer une activité sur le parcours de la famille D1'
);

select lives_ok(
  $$ select count(*) from activites $$,
  'La lecture de activites ne lève pas d''erreur pour un utilisateur sans activité visible'
);
reset role;

select finish();
rollback;
