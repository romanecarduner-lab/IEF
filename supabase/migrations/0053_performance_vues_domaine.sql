-- Correction de performance : v_objectif_domaine et
-- v_total_objectifs_par_domaine appelaient chemin_element_programme()
-- (une requete recursive complete) une fois PAR OBJECTIF, a chaque
-- interrogation de la vue. Avec ~424 objectifs (cycle 1 seul), c'etait
-- deja couteux mais tolerable ; avec l'ajout du cycle 2 (~750
-- objectifs au total), l'onglet "Ce qui reste a voir" (et tout ce qui
-- s'appuie sur ces vues) est devenu nettement plus lent a charger.
--
-- Remplace par UNE SEULE requete recursive calculant le domaine de
-- tous les objectifs a la fois (au lieu de centaines d'appels de
-- fonction independants), rassemblee dans une vue de base partagee
-- par les deux vues existantes -- dont la signature de colonnes ne
-- change pas, donc aucun changement cote application n'est necessaire.

create or replace view v_domaine_par_objectif
with (security_invoker = true)
as
with recursive remontee as (
  select
    id as objectif_id,
    cycle_id,
    libelle as libelle_objectif,
    id as noeud_actuel,
    parent_id
  from elements_programme
  where type_element_id = (select id from types_element_programme where code = 'objectif')
  union all
  select
    r.objectif_id,
    r.cycle_id,
    r.libelle_objectif,
    e.id as noeud_actuel,
    e.parent_id
  from elements_programme e
  join remontee r on e.id = r.parent_id
)
select
  r.objectif_id,
  r.cycle_id,
  r.libelle_objectif as libelle,
  e.libelle as domaine
from remontee r
join elements_programme e on e.id = r.noeud_actuel
where e.parent_id is null;

grant select on v_domaine_par_objectif to authenticated;

create or replace view v_objectif_domaine
with (security_invoker = true)
as
select objectif_id, cycle_id, libelle, domaine
from v_domaine_par_objectif;

grant select on v_objectif_domaine to authenticated;

create or replace view v_total_objectifs_par_domaine
with (security_invoker = true)
as
select
  domaine,
  count(*) as total_objectifs,
  cycle_id
from v_domaine_par_objectif
group by domaine, cycle_id;

grant select on v_total_objectifs_par_domaine to authenticated;
