-- Complete la mediation des langues vivantes cycle 2 avec CE1 et CE2
-- (CP deja importe), y compris "Expliciter un message, une situation,
-- un document pour autrui" qui n'existe qu'a partir du CE1. Dernier
-- point en suspens du cycle 2 -- celui-ci est desormais entierement
-- complet. Transcrit depuis le PDF officiel fourni par l'utilisatrice.

do $$
declare
  v_cycle2_id uuid;
  v_type_sous_domaine uuid;
  v_type_objectif uuid;
  v_type_exemple uuid;
  v_langues_id uuid;
  v_mediation_id uuid;
  v_annee_id uuid;
  v_theme_id uuid;
  v_deja_complet boolean;
begin
  select id into v_cycle2_id from cycles where libelle = 'Cycle 2 (CP, CE1, CE2)';
  select id into v_type_sous_domaine from types_element_programme where code = 'sous_domaine';
  select id into v_type_objectif from types_element_programme where code = 'objectif';
  select id into v_type_exemple from types_element_programme where code = 'exemple_reussite';

  select id into v_langues_id from elements_programme
  where cycle_id = v_cycle2_id and type_element_id = (select id from types_element_programme where code = 'domaine')
    and libelle = U&'Langues vivantes \00E9trang\00E8res et r\00E9gionales';

  select id into v_mediation_id from elements_programme
  where cycle_id = v_cycle2_id and parent_id = v_langues_id
    and type_element_id = v_type_sous_domaine and libelle = U&'M\00E9diation';

  if v_mediation_id is null then
    raise exception 'Mediation (langues vivantes, cycle 2) introuvable -- la migration precedente n''a pas ete executee.';
  end if;

  select exists(
    select 1 from elements_programme
    where cycle_id = v_cycle2_id and parent_id = v_mediation_id
      and type_element_id = v_type_sous_domaine and libelle = U&'Cours \00E9l\00E9mentaire premi\00E8re ann\00E9e'
  ) into v_deja_complet;

  if v_deja_complet then
    raise notice 'Mediation CE1/CE2 (langues vivantes) deja completee -- rien a faire.';
    return;
  end if;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_mediation_id, v_type_sous_domaine, U&'Cours \00E9l\00E9mentaire premi\00E8re ann\00E9e', 2)
  returning id into v_annee_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Identifier les rep\00E8res culturels -- Rep\00E9rer quelques diff\00E9rences ou similitudes dans des domaines familiers (f\00EAtes calendaires, nourriture, jeux, sports).', 1)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_exemple, U&'Dans le cadre d''une s\00E9quence d''EPS, apr\00E8s avoir jou\00E9 au jeu de cour Duck, Duck, Goose (l''\00E9quivalent anglais du jeu du facteur), l''\00E9l\00E8ve rep\00E8re les diff\00E9rences culturelles entre les deux versions et les exprime en fran\00E7ais.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Expliciter un message, une situation, un document pour autrui -- Mobiliser le champ lexical des besoins \00E9l\00E9mentaires \00E0 l''aide de mots isol\00E9s, accompagn\00E9s de gestes ou ins\00E9r\00E9s dans des structures tr\00E8s simples.', 2)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_exemple, U&'Dans le cadre d''un jeu de r\00F4les, un \00E9l\00E8ve doit exprimer les besoins d''un camarade correspondant \00E0 la carte imag\00E9e que celui-ci a pioch\00E9e (Miss, Andrew''s sad. / Miss, Stacy''s tired.).', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Animer un travail collectif, coop\00E9rer et contribuer \00E0 des \00E9changes interculturels -- Utiliser des consignes \00E9l\00E9mentaires accompagn\00E9es de gestes.', 3)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_exemple, U&'Lors de la r\00E9alisation en petits groupes d''une cocotte en papier, un \00E9l\00E8ve donne les consignes de fabrication \00E0 ses camarades (Take the paper. Fold it here. Fold it again here.).', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_mediation_id, v_type_sous_domaine, U&'Cours \00E9l\00E9mentaire deuxi\00E8me ann\00E9e', 3)
  returning id into v_annee_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Identifier les rep\00E8res culturels -- Rep\00E9rer quelques diff\00E9rences ou similitudes dans des domaines familiers (f\00EAtes calendaires, nourriture, jeux, sports).', 1)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_exemple, U&'Lors de la pr\00E9sentation par l''assistant de langue du repas de No\00EBl tel qu''il a cours dans son pays, l''\00E9l\00E8ve rep\00E8re les diff\00E9rences avec son repas de f\00EAte traditionnel (Turkey, sprouts, mashed potatoes, Christmas pudding).', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Expliciter un message, une situation, un document pour autrui -- Mobiliser le champ lexical des besoins \00E9l\00E9mentaires \00E0 l''aide de mots isol\00E9s, accompagn\00E9s de gestes ou ins\00E9r\00E9s dans des structures tr\00E8s simples.', 2)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_exemple, U&'Lors de la Semaine des langues, un \00E9l\00E8ve dit une expression dans la langue maternelle d''un camarade, que celui-ci exprime dans la langue cible \00E0 son enseignant (Tengo hambre. / Miss, he''s hungry. / Time for lunch!).', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Animer un travail collectif, coop\00E9rer et contribuer \00E0 des \00E9changes interculturels -- Utiliser des formules d''accueil ou de salutation toutes simples.', 3)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_exemple, U&'Lors de l''accueil d''un nouvel \00E9l\00E8ve, ses camarades lui disent (Hello Arthur! Welcome to our school, welcome to your new school!).', 1);

  raise notice 'Mediation CE1/CE2 (langues vivantes) completee -- cycle 2 desormais entierement complet.';
end $$;