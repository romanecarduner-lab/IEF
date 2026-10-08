-- La recherche par mot-cle classait les resultats par ordre alphabetique
-- et limitait a 30 : les competences contenant reellement le mot tape
-- pouvaient etre noyees. Desormais : d'abord celles qui contiennent le
-- mot entier, puis celles qui en contiennent le plus (racines), puis
-- ordre alphabetique. Seuil abaisse a 2 lettres.

create or replace function rechercher_objectifs_programme(p_recherche text, p_cycle_id uuid default null)
returns table(id uuid, libelle text, chemin text)
language sql
stable
as $$
  with mots as (
    select distinct unnest(regexp_split_to_array(lower(trim(p_recherche)), '\s+')) as mot
  ),
  mots_utiles as (
    select mot from mots where length(mot) >= 2
  ),
  racines as (
    select mot,
      case when length(mot) > 5 then left(mot, 5) else mot end as racine
    from mots_utiles
  ),
  candidats as (
    select
      o.id,
      o.libelle,
      o.parent_id,
      count(distinct r.mot) filter (where o.libelle ilike '%' || r.mot || '%') as mots_entiers,
      count(distinct r.mot) as racines_trouvees
    from elements_programme o
    join racines r on o.libelle ilike '%' || r.racine || '%'
    where o.type_element_id = (select t.id from types_element_programme t where t.code = 'objectif')
      and (p_cycle_id is null or o.cycle_id = p_cycle_id)
    group by o.id, o.libelle, o.parent_id
  )
  select c.id, c.libelle, chemin_element_programme(c.parent_id) as chemin
  from candidats c
  order by c.mots_entiers desc, c.racines_trouvees desc, c.libelle
  limit 40;
$$;
