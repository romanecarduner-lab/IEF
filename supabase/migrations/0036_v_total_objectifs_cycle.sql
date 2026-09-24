-- Correction critique : v_total_objectifs_par_domaine comptait les
-- objectifs de TOUS les cycles confondus, sans distinction. Avec un
-- seul cycle en base, ca ne se voyait pas -- des l'ajout du cycle 2,
-- ses domaines (ex. "Francais") se sont mis a apparaitre pour les
-- enfants du cycle 1 aussi, avec 0% puisqu'ils n'y ont jamais rien
-- observe. La vue expose maintenant le cycle_id, pour que chaque
-- ecran ne compte que les domaines du cycle reellement suivi par le
-- parcours affiche.
--
-- cycle_id est ajoute en DERNIERE position (pas en premier) : Postgres
-- interdit a CREATE OR REPLACE VIEW de deplacer ou d'inserer une
-- colonne avant celles qui existent deja, seulement d'en ajouter a la
-- fin (erreur 42P16 sinon).

create or replace view v_total_objectifs_par_domaine
with (security_invoker = true)
as
select
  split_part(chemin_element_programme(o.id), ' > ', 1) as domaine,
  count(*) as total_objectifs,
  o.cycle_id
from elements_programme o
where o.type_element_id = (select id from types_element_programme where code = 'objectif')
group by o.cycle_id, 1;

grant select on v_total_objectifs_par_domaine to authenticated;
