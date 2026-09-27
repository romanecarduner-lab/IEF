-- Reattribue chaque activite au bon parcours (meme enfant, bonne annee
-- scolaire) d'apres sa date reelle plutot que d'apres le parcours
-- choisi au moment de la saisie -- utile quand une nouvelle annee
-- scolaire est creee apres coup et que des activites de cette periode
-- avaient deja ete saisies sous l'ancienne annee.
--
-- Rien n'est supprime ni duplique : seule la colonne parcours_id de
-- l'activite change, quand un parcours correspondant existe deja pour
-- le meme enfant sur la bonne annee. Les traces, observations de
-- competences et competences restent attachees a l'activite (par
-- activite_id, jamais touche) -- mais si le cycle change entre
-- l'ancien et le nouveau parcours (ex. cycle 1 -> cycle 2), les
-- competences deja choisies restent celles de l'ancien cycle : elles
-- ne s'affichent alors plus dans le nouveau, et le rapport final liste
-- precisement ces cas pour verification manuelle plutot que de les
-- perdre ou de les deviner.

do $$
declare
  v_nb_deplacees int := 0;
  v_nb_cycle_change int := 0;
  v_nb_sans_parcours_cible int := 0;
  v_rec record;
  v_nouveau_parcours_id uuid;
  v_nouveau_cycle_id uuid;
  v_ancien_cycle_id uuid;
begin
  for v_rec in
    select
      a.id as activite_id,
      a.date_activite,
      a.parcours_id as ancien_parcours_id,
      p_ancien.enfant_id,
      p_ancien.cycle_id as ancien_cycle_id
    from activites a
    join parcours_scolaires p_ancien on p_ancien.id = a.parcours_id
  loop
    select p.id, p.cycle_id into v_nouveau_parcours_id, v_nouveau_cycle_id
    from parcours_scolaires p
    join annees_scolaires an on an.id = p.annee_scolaire_id
    where p.enfant_id = v_rec.enfant_id
      and v_rec.date_activite between an.date_debut and an.date_fin
    limit 1;

    if v_nouveau_parcours_id is null then
      v_nb_sans_parcours_cible := v_nb_sans_parcours_cible + 1;
      continue;
    end if;

    if v_nouveau_parcours_id = v_rec.ancien_parcours_id then
      continue; -- deja au bon endroit
    end if;

    if v_nouveau_cycle_id != v_rec.ancien_cycle_id then
      v_nb_cycle_change := v_nb_cycle_change + 1;
      raise notice 'Activite % : changement de cycle en deplacant vers la bonne annee -- verifier ses competences manuellement.', v_rec.activite_id;
    end if;

    update activites set parcours_id = v_nouveau_parcours_id where id = v_rec.activite_id;
    v_nb_deplacees := v_nb_deplacees + 1;
  end loop;

  raise notice '--- Reattribution terminee ---';
  raise notice 'Activites deplacees vers la bonne annee : %', v_nb_deplacees;
  raise notice 'Dont avec changement de cycle (competences a verifier) : %', v_nb_cycle_change;
  raise notice 'Activites non deplacees (aucun parcours existant pour cet enfant sur la bonne annee) : %', v_nb_sans_parcours_cible;
end $$;
