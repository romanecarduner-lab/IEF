-- Suggestions d'objectifs a partir du titre (et eventuellement de la
-- description) d'une activite, par rapprochement de mots-cles. Ce n'est
-- pas une IA semantique : chaque mot significatif du texte est compare
-- aux libelles des objectifs. Le parent valide toujours en cochant.

create or replace function suggerer_objectifs_programme(p_texte text)
returns table(id uuid, libelle text, chemin text)
language sql
stable
as $$
  with mots as (
    select distinct unnest(regexp_split_to_array(lower(p_texte), '\s+')) as mot
  ),
  mots_utiles as (
    select mot from mots where length(mot) >= 4
  )
  select distinct
    o.id,
    o.libelle,
    chemin_element_programme(o.parent_id) as chemin
  from elements_programme o
  join mots_utiles m on o.libelle ilike '%' || m.mot || '%'
  where o.type_element_id = (select id from types_element_programme where code = 'objectif')
  order by o.libelle
  limit 15;
$$;

revoke all on function suggerer_objectifs_programme(text) from public;
grant execute on function suggerer_objectifs_programme(text) to authenticated;
