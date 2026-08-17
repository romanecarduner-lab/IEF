-- Expose les exemples de reussite officiels d'un objectif -- le lien
-- operationnel concret entre "ce qui a ete observe" et "la competence
-- est demontree", tel qu'attendu par le programme (deja importes en
-- base au lot 6, mais jamais affiches jusqu'ici).

create or replace function lister_exemples_reussite(p_objectif_id uuid)
returns table(exemple text)
language sql
stable
as $$
  select e.libelle
  from elements_programme e
  where e.parent_id = p_objectif_id
    and e.type_element_id = (select id from types_element_programme where code = 'exemple_reussite')
  order by e.ordre;
$$;

revoke all on function lister_exemples_reussite(uuid) from public;
grant execute on function lister_exemples_reussite(uuid) to authenticated;
