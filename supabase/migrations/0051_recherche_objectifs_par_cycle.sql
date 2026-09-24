-- Correction critique : suggerer_objectifs_programme et
-- rechercher_objectifs_programme cherchaient dans TOUS les cycles
-- confondus, sans distinction -- meme defaut que celui deja corrige
-- sur v_total_objectifs_par_domaine. Avec un seul cycle en base, ca ne
-- se voyait pas ; depuis l'ajout du cycle 2, les suggestions par
-- mots-cles a la creation d'une activite pouvaient proposer des
-- competences du mauvais cycle (ex. "Lire" proposant du cycle 2 pour
-- un enfant en cycle 1). p_cycle_id est optionnel (par defaut NULL =
-- tous les cycles, comportement inchange si non fourni) pour ne rien
-- casser d'existant, mais l'application le fournit desormais toujours.

create or replace function suggerer_objectifs_programme(p_texte text, p_cycle_id uuid default null)
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
    and (p_cycle_id is null or o.cycle_id = p_cycle_id)
  order by o.libelle
  limit 15;
$$;

create or replace function rechercher_objectifs_programme(p_recherche text, p_cycle_id uuid default null)
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
    and (p_cycle_id is null or o.cycle_id = p_cycle_id)
  order by o.libelle
  limit 30;
$$;
