-- Lot 7 (complement) - Vues pour une vue d'ensemble visuelle de la
-- progression par domaine (couverture du programme officiel).

create or replace view v_total_objectifs_par_domaine
with (security_invoker = true)
as
select
  split_part(chemin_element_programme(o.id), ' > ', 1) as domaine,
  count(*) as total_objectifs
from elements_programme o
where o.type_element_id = (select id from types_element_programme where code = 'objectif')
group by 1;

grant select on v_total_objectifs_par_domaine to authenticated;

create or replace view v_progression_par_domaine
with (security_invoker = true)
as
select
  sp.parcours_id,
  split_part(chemin_element_programme(sp.element_programme_id), ' > ', 1) as domaine,
  st.code as statut_code,
  st.ordre as statut_ordre,
  count(*) as nb
from syntheses_progression sp
join statuts_progression st on st.id = sp.statut_global_id
group by sp.parcours_id, domaine, st.code, st.ordre;

grant select on v_progression_par_domaine to authenticated;
