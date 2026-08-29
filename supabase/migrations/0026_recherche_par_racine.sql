-- Ameliore le rapprochement par mots-cles (suggestions automatiques et
-- recherche libre) en comparant la racine d'un mot plutot que le mot
-- entier : "saisons" ne retrouvait pas "saison" dans le programme
-- officiel (comparaison litterale, singulier/pluriel non reconnu).
--
-- Approximation simple (pas une vraie analyse linguistique) : on
-- tronque tout mot de plus de 5 lettres a ses 5 premieres lettres avant
-- de chercher cette racine dans les libelles. Reste un rapprochement
-- approximatif, pas une IA semantique -- le parent valide toujours en
-- cochant.

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
  ),
  racines as (
    select distinct
      case when length(mot) > 5 then left(mot, 5) else mot end as racine
    from mots_utiles
  )
  select distinct
    o.id,
    o.libelle,
    chemin_element_programme(o.parent_id) as chemin
  from elements_programme o
  join racines r on o.libelle ilike '%' || r.racine || '%'
  where o.type_element_id = (select id from types_element_programme where code = 'objectif')
  order by o.libelle
  limit 15;
$$;

create or replace function rechercher_objectifs_programme(p_recherche text)
returns table(id uuid, libelle text, chemin text)
language sql
stable
as $$
  with mots as (
    select distinct unnest(regexp_split_to_array(lower(p_recherche), '\s+')) as mot
  ),
  mots_utiles as (
    select mot from mots where length(mot) >= 3
  ),
  racines as (
    select distinct
      case when length(mot) > 5 then left(mot, 5) else mot end as racine
    from mots_utiles
  )
  select distinct
    o.id,
    o.libelle,
    chemin_element_programme(o.parent_id) as chemin
  from elements_programme o
  join racines r on o.libelle ilike '%' || r.racine || '%'
  where o.type_element_id = (select id from types_element_programme where code = 'objectif')
  order by o.libelle
  limit 30;
$$;
