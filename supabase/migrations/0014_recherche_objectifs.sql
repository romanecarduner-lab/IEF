-- Lot 6 (complement) - Recherche libre d'objectifs, independamment de la
-- navigation en cascade. Repond au besoin reel : un parent sait souvent ce
-- que l'enfant a fait, pas dans quelle tranche d'age officielle ca tombe.

create or replace function chemin_element_programme(p_element_id uuid)
returns text
language sql
stable
as $$
  with recursive remontee as (
    select e.id, e.libelle, e.parent_id, 0 as profondeur
    from elements_programme e
    where e.id = p_element_id
    union all
    select e.id, e.libelle, e.parent_id, r.profondeur + 1
    from elements_programme e
    join remontee r on e.id = r.parent_id
  )
  select string_agg(libelle, ' > ' order by profondeur desc)
  from remontee;
$$;

revoke all on function chemin_element_programme(uuid) from public;
grant execute on function chemin_element_programme(uuid) to authenticated;

create or replace function rechercher_objectifs_programme(p_recherche text)
returns table(id uuid, libelle text, chemin text)
language sql
stable
as $$
  select
    o.id,
    o.libelle,
    chemin_element_programme(o.parent_id) as chemin
  from elements_programme o
  where o.type_element_id = (select id from types_element_programme where code = 'objectif')
    and o.libelle ilike '%' || p_recherche || '%'
  order by o.libelle
  limit 30;
$$;

revoke all on function rechercher_objectifs_programme(text) from public;
grant execute on function rechercher_objectifs_programme(text) to authenticated;
