-- Corrige le doublon du domaine "Langues vivantes" : la migration
-- precedente (0060) cherchait a supprimer l'ancien domaine par son
-- libelle, mais celui-ci avait ete importe avec des accents
-- ("etrangeres", "regionales") alors que la recherche de suppression
-- en etait depourvue -- l'ancien n'a donc jamais ete trouve ni
-- supprime, et un second domaine a ete cree a cote.
--
-- Supprime maintenant l'ancien domaine (avec ses accents d'origine),
-- niveau par niveau comme precedemment (ON DELETE RESTRICT, pas de
-- cascade), puis renomme le nouveau domaine pour qu'il garde les
-- accents, par coherence avec le reste de l'application.

do $$
declare
  v_ancien_id uuid;
  v_nouveau_id uuid;
  v_id_courant uuid;
begin
  select id into v_ancien_id from elements_programme
  where libelle = U&'Langues vivantes \00E9trang\00E8res et r\00E9gionales'
    and parent_id is null;

  if v_ancien_id is not null then
    for v_id_courant in
      with recursive descendants as (
        select id, parent_id, 0 as profondeur from elements_programme where id = v_ancien_id
        union all
        select e.id, e.parent_id, d.profondeur + 1
        from elements_programme e join descendants d on e.parent_id = d.id
      )
      select id from descendants where profondeur = 5 order by id
    loop
      delete from elements_programme where id = v_id_courant;
    end loop;

    for v_id_courant in
      with recursive descendants as (
        select id, parent_id, 0 as profondeur from elements_programme where id = v_ancien_id
        union all
        select e.id, e.parent_id, d.profondeur + 1
        from elements_programme e join descendants d on e.parent_id = d.id
      )
      select id from descendants where profondeur = 4 order by id
    loop
      delete from elements_programme where id = v_id_courant;
    end loop;

    for v_id_courant in
      with recursive descendants as (
        select id, parent_id, 0 as profondeur from elements_programme where id = v_ancien_id
        union all
        select e.id, e.parent_id, d.profondeur + 1
        from elements_programme e join descendants d on e.parent_id = d.id
      )
      select id from descendants where profondeur = 3 order by id
    loop
      delete from elements_programme where id = v_id_courant;
    end loop;

    for v_id_courant in
      with recursive descendants as (
        select id, parent_id, 0 as profondeur from elements_programme where id = v_ancien_id
        union all
        select e.id, e.parent_id, d.profondeur + 1
        from elements_programme e join descendants d on e.parent_id = d.id
      )
      select id from descendants where profondeur = 2 order by id
    loop
      delete from elements_programme where id = v_id_courant;
    end loop;

    for v_id_courant in
      with recursive descendants as (
        select id, parent_id, 0 as profondeur from elements_programme where id = v_ancien_id
        union all
        select e.id, e.parent_id, d.profondeur + 1
        from elements_programme e join descendants d on e.parent_id = d.id
      )
      select id from descendants where profondeur = 1 order by id
    loop
      delete from elements_programme where id = v_id_courant;
    end loop;

    delete from elements_programme where id = v_ancien_id;
    raise notice 'Ancien domaine "Langues vivantes" (avec accents) supprime.';
  else
    raise notice 'Aucun ancien domaine accentue trouve -- rien a supprimer.';
  end if;

  select id into v_nouveau_id from elements_programme
  where libelle = 'Langues vivantes etrangeres et regionales'
    and parent_id is null;

  if v_nouveau_id is not null then
    update elements_programme
    set libelle = U&'Langues vivantes \00E9trang\00E8res et r\00E9gionales'
    where id = v_nouveau_id;
    raise notice 'Nouveau domaine renomme avec les accents.';
  end if;
end $$;
