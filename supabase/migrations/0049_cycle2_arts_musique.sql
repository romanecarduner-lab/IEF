-- Import du programme officiel Arts plastiques et Education
-- musicale, cycle 2 (BOEN n31 du 30 juillet 2020, arrete du
-- 17-7-2020 -- toujours en vigueur, non renouvele contrairement
-- aux autres matieres deja importees). Contrairement aux autres
-- matieres du cycle 2, ce texte ne se decline pas par annee : les
-- trois questions/quatre competences sont abordees chaque annee du
-- cycle. Derniere piece du cycle 2 : celui-ci est desormais complet
-- sur toutes les matieres officielles.

do $$
declare
  v_cycle2_id uuid;
  v_type_domaine uuid;
  v_type_sous_domaine uuid;
  v_type_objectif uuid;
  v_type_exemple uuid;
  v_domaine_id uuid;
  v_theme_id uuid;
  v_objectif_id uuid;
begin
  select id into v_cycle2_id from cycles where libelle = 'Cycle 2 (CP, CE1, CE2)';
  select id into v_type_domaine from types_element_programme where code = 'domaine';
  select id into v_type_sous_domaine from types_element_programme where code = 'sous_domaine';
  select id into v_type_objectif from types_element_programme where code = 'objectif';
  select id into v_type_exemple from types_element_programme where code = 'exemple_reussite';

  select id into v_domaine_id from elements_programme
  where cycle_id = v_cycle2_id and type_element_id = v_type_domaine
    and libelle = U&'Arts plastiques';

  if v_domaine_id is null then
    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, null, v_type_domaine, U&'Arts plastiques', 11)
    returning id into v_domaine_id;

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_domaine_id, v_type_sous_domaine, U&'La repr\00E9sentation du monde', 1)
    returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Utiliser le dessin dans toute sa diversit\00E9 comme moyen d''expression. Employer divers outils, dont ceux num\00E9riques, pour repr\00E9senter. Prendre en compte l''influence des outils, supports, mat\00E9riaux, gestes sur la repr\00E9sentation en deux et en trois dimensions.', 1)
      returning id into v_objectif_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Explorer son environnement visuel pour prendre conscience de la pr\00E9sence du dessin et de la diversit\00E9 des modes de repr\00E9sentation.', 1);
      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Repr\00E9senter l''environnement proche par le dessin (carnet de croquis) ; photographier en variant les points de vue et les cadrages ; explorer la repr\00E9sentation par le volume, notamment le modelage.', 2);
      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Explorer des outils et des supports connus, en d\00E9couvrir d''autres, y compris num\00E9riques.', 3);

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Connaitre diverses formes artistiques de repr\00E9sentation du monde : \0153uvres contemporaines et du pass\00E9, occidentales et extra occidentales.', 2)
      returning id into v_objectif_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Reconstituer une sc\00E8ne, enregistrer les traces ou le constat d''une observation.', 1);
      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Mettre en relation l''observation des productions plastiques avec les images pr\00E9sentes dans l''environnement quotidien des \00E9l\00E8ves (publicit\00E9, patrimoine de proximit\00E9, albums jeunesse).', 2);
      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Comparer et \00E9tablir des liens entre des \0153uvres d''art appartenant \00E0 un m\00EAme domaine d''expression plastique ou portant sur un m\00EAme sujet, \00E0 propos des formes, de l''espace, de la lumi\00E8re, de la couleur, des mati\00E8res, des gestes, des supports, des outils.', 3);

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_domaine_id, v_type_sous_domaine, U&'L''expression des \00E9motions', 2)
    returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Exprimer sa sensibilit\00E9 et son imagination en s''emparant des \00E9l\00E9ments du langage plastique. Exp\00E9rimenter les effets des couleurs, des mat\00E9riaux, des supports en explorant l''organisation et la composition plastiques. Exprimer ses \00E9motions et sa sensibilit\00E9 en confrontant sa perception \00E0 celle d''autres \00E9l\00E8ves.', 1)
      returning id into v_objectif_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Rep\00E9rer des mati\00E8res et des mat\00E9riaux dans l''environnement quotidien, dans les productions de pairs, dans les repr\00E9sentations d''\0153uvres rencontr\00E9es en classe.', 1);
      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Agir sur les formes, sur les couleurs (m\00E9langes, d\00E9grad\00E9s, contrastes), sur les mati\00E8res et les objets : peindre avec des mati\00E8res \00E9paisses ou fluides sans dessin pr\00E9alable ; coller, superposer des papiers et des images ; modeler, creuser pour explorer le volume.', 2);
      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Explorer les possibilit\00E9s d''assemblage ou de modelage (carton, bois, argile), en tirant parti de gestes connus : modeler, creuser, pousser, tirer, \00E9quilibrer, coller.', 3);
      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Observer et exp\00E9rimenter des principes d''organisation et de composition plastiques : r\00E9p\00E9tition, alternance, superposition, orientation, concentration, dispersion, \00E9quilibre.', 4);

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_domaine_id, v_type_sous_domaine, U&'La narration et le t\00E9moignage par les images', 3)
    returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_objectif, U&'R\00E9aliser des productions plastiques pour raconter, t\00E9moigner. Transformer ou restructurer des images ou des objets. Articuler le texte et l''image \00E0 des fins d''illustration, de cr\00E9ation.', 1)
      returning id into v_objectif_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Raconter des histoires vraies ou invent\00E9es par le dessin, la reprise ou l''agencement d''images connues, l''isolement des fragments, l''association d''images de diff\00E9rentes origines.', 1);
      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Transformer un r\00E9cit en une image, en explorer divers principes d''organisation (r\00E9p\00E9tition, alternance, superposition, concentration, dispersion, \00E9quilibre).', 2);
      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Intervenir sur une image existante, d\00E9couvrir son fonctionnement, en d\00E9tourner le sens.', 3);
      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'D\00E9couvrir des \0153uvres d''art comme traces ou t\00E9moignages de faits r\00E9els restitu\00E9s de mani\00E8re plus ou moins fid\00E8le (carnets de voyage, statuaire) ou vecteurs d''histoires, h\00E9rit\00E9es ou invent\00E9es.', 4);
      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'T\00E9moigner en r\00E9alisant des productions p\00E9rennes ou \00E9ph\00E9m\00E8res donn\00E9es \00E0 voir par diff\00E9rents m\00E9dias : murs de l''\00E9cole, lieu ext\00E9rieur, blog.', 5);

  end if;

  select id into v_domaine_id from elements_programme
  where cycle_id = v_cycle2_id and type_element_id = v_type_domaine
    and libelle = U&'\00C9ducation musicale';

  if v_domaine_id is null then
    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, null, v_type_domaine, U&'\00C9ducation musicale', 12)
    returning id into v_domaine_id;

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_domaine_id, v_type_sous_domaine, U&'Chanter', 1)
    returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Reproduire un mod\00E8le m\00E9lodique, rythmique. Chanter une m\00E9lodie simple avec une intonation juste. Chanter une comptine, un chant par imitation. Interpr\00E9ter un chant avec expressivit\00E9 (phras\00E9, articulation du texte) en respectant ses phrases musicales. Mobiliser son corps pour interpr\00E9ter.', 1)
      returning id into v_objectif_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Jeux vocaux mobilisant les diverses possibilit\00E9s de la voix.', 1);
      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Recherche de la justesse dans l''interpr\00E9tation.', 2);
      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Mise en mouvement de son corps, imitation d''un mod\00E8le, assimilation d''habitudes corporelles pour chanter.', 3);

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_domaine_id, v_type_sous_domaine, U&'\00C9couter, comparer', 2)
    returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_objectif, U&'D\00E9crire et comparer des \00E9l\00E9ments sonores ; rep\00E9rer, y compris dans la nature, des sons et des suites musicales ; identifier des \00E9l\00E9ments communs et contrast\00E9s. Rep\00E9rer une organisation simple : r\00E9currence d''une m\00E9lodie, d''un motif rythmique, d''un th\00E8me. Comparer des musiques et identifier des ressemblances et des diff\00E9rences.', 1)
      returning id into v_objectif_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Identification, caract\00E9risation, tri des \00E9l\00E9ments per\00E7us lors d''\00E9coutes compar\00E9es de brefs extraits musicaux.', 1);
      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Repr\00E9sentations graphiques de passages musicaux.', 2);

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_domaine_id, v_type_sous_domaine, U&'Explorer et imaginer', 3)
    returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Exp\00E9rimenter les param\00E8tres du son : intensit\00E9, hauteur, timbre, dur\00E9e. Imaginer des repr\00E9sentations graphiques ou corporelles de la musique. Inventer une organisation simple \00E0 partir d''\00E9l\00E9ments sonores travaill\00E9s.', 1)
      returning id into v_objectif_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Jeu avec la voix pour exprimer des sentiments (la tristesse, la joie) ou \00E9voquer des personnages.', 1);
      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Utilisation d''objets sonores (petites percussions, lames sonores) pour enrichir les r\00E9alisations collectives.', 2);

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_domaine_id, v_type_sous_domaine, U&'\00C9changer, partager', 4)
    returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Exprimer ses \00E9motions, ses sentiments et ses pr\00E9f\00E9rences artistiques. \00C9couter et respecter l''avis des autres et l''expression de leur sensibilit\00E9. Respecter les r\00E8gles et les exigences d''une production musicale collective.', 1)
      returning id into v_objectif_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Expression et partage avec les autres de son ressenti, de ses \00E9motions, de ses sentiments.', 1);

  end if;

  raise notice 'Arts plastiques et Education musicale (cycle 2) importes -- cycle 2 complet.';
end $$;