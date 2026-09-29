-- Expose le chemin complet (domaine > ... > tranche d'age) de chaque
-- objectif en une seule requete groupee, plutot qu'un appel RPC par
-- objectif (meme piege de performance deja corrige ailleurs). Utile
-- pour distinguer a l'affichage deux competences qui partagent
-- exactement le meme libelle a des tranches d'age differentes.

create or replace view v_chemin_complet_objectif
with (security_invoker = true)
as
with recursive remontee as (
  select
    id as objectif_id,
    id as noeud_actuel,
    parent_id,
    libelle::text as chemin
  from elements_programme
  where type_element_id = (select id from types_element_programme where code = 'objectif')
  union all
  select
    r.objectif_id,
    e.id as noeud_actuel,
    e.parent_id,
    e.libelle || ' > ' || r.chemin
  from elements_programme e
  join remontee r on e.id = r.parent_id
)
select r.objectif_id, r.chemin
from remontee r
where r.parent_id is null;

grant select on v_chemin_complet_objectif to authenticated;
