-- Correction du francais cycle 2 : les cinq sous-domaines avaient ete
-- importes SANS accents par erreur (regle 'ASCII pur' mal appliquee --
-- elle demande la notation U&'' pour les caracteres accentues, pas leur
-- suppression). Supprime proprement (feuille par feuille, parent_id est
-- en ON DELETE RESTRICT) puis reimporte avec les accents corrects.

do $$
declare
  v_cycle2_id uuid;
  v_francais_id uuid;
  v_nb_observations int;
  v_deleted int;
  v_type_domaine uuid;
  v_type_sous_domaine uuid;
  v_type_objectif uuid;
  v_type_exemple uuid;
  v_domaine_id uuid;
  v_annee_id uuid;
  v_theme_id uuid;
  v_objectif_id uuid;
begin
  select id into v_cycle2_id from cycles where libelle = 'Cycle 2 (CP, CE1, CE2)';

  select id into v_francais_id from elements_programme
  where cycle_id = v_cycle2_id and libelle = 'Francais'
    and type_element_id = (select id from types_element_programme where code = 'domaine');

  if v_francais_id is null then
    raise notice 'Francais (cycle 2) introuvable -- rien a corriger.';
    return;
  end if;

  -- Securite : si des observations existent deja sur ce sous-arbre, on
  -- n'efface rien et on arrete plutot que de risquer de perdre un lien
  -- reel avec une activite deja enregistree.
  with recursive descendants as (
    select id from elements_programme where id = v_francais_id
    union all
    select ep2.id from elements_programme ep2 join descendants d on ep2.parent_id = d.id
  )
  select count(*) into v_nb_observations
  from observations_elements_programme oep
  where oep.element_programme_id in (select id from descendants);

  if v_nb_observations > 0 then
    raise exception 'Des observations existent deja sur le francais (cycle 2, % lignes) : correction annulee par securite, a traiter manuellement.', v_nb_observations;
  end if;

  -- Suppression feuille par feuille jusqu'a disparition complete du sous-arbre.
  loop
    with recursive descendants as (
      select id from elements_programme where id = v_francais_id
      union all
      select ep2.id from elements_programme ep2 join descendants d on ep2.parent_id = d.id
    )
    delete from elements_programme
    where id in (
      select d.id from descendants d
      where not exists (select 1 from elements_programme c where c.parent_id = d.id)
    );
    get diagnostics v_deleted = row_count;
    exit when v_deleted = 0;
  end loop;

  raise notice 'Ancien Francais (cycle 2, sans accents) supprime. Reimport en cours...';

  select id into v_type_domaine from types_element_programme where code = 'domaine';
  select id into v_type_sous_domaine from types_element_programme where code = 'sous_domaine';
  select id into v_type_objectif from types_element_programme where code = 'objectif';
  select id into v_type_exemple from types_element_programme where code = 'exemple_reussite';

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, null, v_type_domaine, U&'Fran\00E7ais', 1)
  returning id into v_francais_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_francais_id, v_type_sous_domaine, U&'Lecture', 1)
  returning id into v_domaine_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_domaine_id, v_type_sous_domaine, U&'Cours pr\00E9paratoire', 1)
  returning id into v_annee_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Identifier les mots de mani\00E8re de plus en plus ais\00E9e', 1)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'En fin de p\00E9riode 1 : d\00E9coder et encoder 12 \00E0 15 correspondances graphophon\00E9miques (CGP) r\00E9guli\00E8res, fr\00E9quentes et ais\00E9ment pronon\00E7ables ; d\00E9chiffrer des syllabes, des mots puis des phrases en fonction de la progression de l''apprentissage des CGP.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve d\00E9chiffre les mots les plus r\00E9guliers selon la progression des CGP.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il automatise la lecture des mots fr\00E9quents et transparents comme le, la, ami, rire, lune, etc.', 2);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'En milieu d''ann\00E9e : d\00E9coder et encoder de 25 \00E0 30 CGP ; avoir pris conscience de la pr\00E9sence de lettres finales muettes et s''appuyer sur le sens des mots pour les d\00E9chiffrer correctement ; m\00E9moriser les mots fr\00E9quents et r\00E9guliers ; d\00E9chiffrer entre 15 et 30 mots par minute.', 2)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il lit et \00E9crit de nouveaux mots ou pseudo-mots en lien avec la progression des CGP.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il d\00E9chiffre tous les mots selon la progression des CGP et identifie les marques grammaticales en genre et en nombre.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il automatise la reconnaissance de mots qui ont des caract\00E9ristiques morphologiques communes : un pr\00E9fixe, un radical ou un suffixe identiques.', 3);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'En fin d''ann\00E9e : d\00E9coder 30 mots par minute au minimum fin CP, sans pr\00E9paration, 50 apr\00E8s pr\00E9paration.', 3)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il lit des consignes, des phrases et de courts textes d\00E9chiffrables avec exactitude.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Lire \00E0 voix haute', 2)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'D\00E8s le d\00E9but de l''ann\00E9e : oraliser les syllabes d\00E9chiffr\00E9es et encod\00E9es, puis les mots.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve est capable de lire \00E0 voix haute des syllabes, des mots et de courtes phrases.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'En cours d''ann\00E9e : oraliser r\00E9guli\00E8rement les mots et phrases d\00E9chiffr\00E9s et encod\00E9s ; s''entrainer \00E0 lire des textes d\00E9chiffrables de mani\00E8re \00E0 automatiser sa lecture.', 2)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il est capable de lire \00E0 voix haute un texte simple en faisant une courte pause \00E0 la fin des phrases.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'En fin d''ann\00E9e : lire apr\00E8s pr\00E9paration un texte adapt\00E9 \00E0 son niveau de lecture avec une vitesse de 30 mots par minute au minimum sans pr\00E9paration, 50 apr\00E8s pr\00E9paration ; identifier les marques de ponctuation et les prendre en compte sur un texte pr\00E9par\00E9 ; amorcer une lecture expressive.', 3)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Apr\00E8s pr\00E9paration, il rep\00E8re les groupes de mots qui doivent \00EAtre lus ensemble en s''appuyant sur le sens et la chaine d''accords ; il en tient compte dans sa lecture \00E0 voix haute.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Apr\00E8s pr\00E9paration, il modifie sa voix pour faire parler tel ou tel personnage.', 2);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Comprendre un texte', 3)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'D\00E9gager le sens global d''un texte entendu ou lu de fa\00E7on autonome ; identifier les mots inconnus dans un texte et chercher \00E0 leur donner un sens ; se rep\00E9rer dans la chaine anaphorique ; comprendre ce qui est implicite (inf\00E9rences simples) ; justifier ses r\00E9ponses par un retour au texte ; lire et comprendre en autonomie un texte narratif, informatif ou prescriptif d''une dizaine de lignes.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve est capable de construire une repr\00E9sentation mentale au fur et \00E0 mesure que se d\00E9roule la lecture.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il construit la chronologie et identifie les lieux \00E9voqu\00E9s dans un r\00E9cit.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il rep\00E8re les informations donn\00E9es dans un texte informatif simple relevant des diff\00E9rents champs disciplinaires.', 3);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il commence \00E0 s''appuyer sur le contexte pour \00E9lucider le sens des mots inconnus.', 4);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il est capable de r\00E9aliser en autonomie une inf\00E9rence simple (contexte connu de l''\00E9l\00E8ve). Ex. : J''ai pris mon parapluie -> Le temps est pluvieux.', 5);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il cherche \00E0 comprendre les \00E9motions des personnages en s''appuyant sur ses exp\00E9riences personnelles, gr\00E2ce \00E0 un questionnement ouvert du professeur.', 6);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il v\00E9rifie sa compr\00E9hension dans des \00E9changes entre pairs et peut la r\00E9viser, le cas \00E9ch\00E9ant, en retournant au texte.', 7);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Devenir lecteur', 4)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Lire 5 \00E0 10 oeuvres compl\00E8tes et vari\00E9es issues du patrimoine et de la litt\00E9rature de jeunesse (albums, romans, contes, fables, po\00E8mes, pi\00E8ces de th\00E9\00E2tre et documentaires) ; rep\00E9rer et reconnaitre des types de personnages ; aller vers les livres et \00EAtre capable d''en choisir \00E0 titre personnel ; relier ses lectures \00E0 son exp\00E9rience personnelle, \00EAtre en mesure d''\00E9tablir des liens entre ses diff\00E9rentes lectures (mise en r\00E9seau) ; fr\00E9quenter r\00E9guli\00E8rement des lieux de lecture.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve est capable de caract\00E9riser les personnages, de les comparer et de reconnaitre des types r\00E9currents dans la litt\00E9rature de jeunesse.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il diff\00E9rencie le type narratif du type informatif.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il est capable d''exprimer le lien entre deux lectures ou entre une lecture et sa propre exp\00E9rience.', 3);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il est capable de choisir un livre en fonction de ses propres centres d''int\00E9r\00EAt.', 4);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_domaine_id, v_type_sous_domaine, U&'Cours \00E9l\00E9mentaire premi\00E8re ann\00E9e', 2)
  returning id into v_annee_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Identifier les mots de mani\00E8re de plus en plus ais\00E9e', 1)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Tout au long de l''ann\00E9e : automatiser le d\00E9codage des correspondances graphophon\00E9miques (CGP) apprises au CP. En fin d''ann\00E9e : d\00E9coder toutes les CGP y compris les plus complexes ; avoir m\00E9moris\00E9 l''ensemble des CGP dans tous les types d''\00E9criture ; identifier directement l''ensemble des mots courants et d\00E9chiffrer avec exactitude les mots nouveaux dont le d\00E9codage n''a pas encore \00E9t\00E9 automatis\00E9.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve d\00E9chiffre et \00E9crit sous la dict\00E9e des syllabes et des pseudo-mots comportant des CGP courantes et d''autres plus complexes.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il lit des phrases contenant des morph\00E8mes grammaticaux et lexicaux muets de mani\00E8re fluide sans vocaliser les lettres muettes.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il lit des mots nouveaux en lien avec l''orthographe lexicale, il se sert de sa connaissance des graph\00E8mes pour \00E9tablir des listes analogiques de mots.', 3);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Lire \00E0 voix haute', 2)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'En fin d''ann\00E9e : lire un texte adapt\00E9 \00E0 son niveau de lecture avec une vitesse de 70 mots par minute ; lire des textes narratifs, documentaires et prescriptifs en respectant tous les signes de ponctuation et les groupes de souffle ; lire de mani\00E8re expressive.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve s''entraine \00E0 la lecture \00E0 voix haute dans des s\00E9ances sp\00E9cifiques : il rep\00E8re la ponctuation et les groupes de mots qui doivent \00EAtre lus ensemble.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il lit apr\00E8s pr\00E9paration un texte simple en r\00E9alisant les pauses ad\00E9quates et en adoptant le ton et le rythme appropri\00E9s au sens du texte.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il lit un texte en modifiant sa voix et sa cadence, en fonction du sens.', 3);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Comprendre un texte', 3)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'D\00E9gager le sens global d''un texte lu, de fa\00E7on autonome, \00E0 la suite d''une s\00E9ance d\00E9di\00E9e \00E0 la compr\00E9hension ; d\00E9velopper des strat\00E9gies pour \00E9lucider le sens des mots et des expressions inconnus ; se rep\00E9rer dans la chaine anaphorique et s''appuyer sur le sens du texte pour r\00E9soudre des ambig\00FCit\00E9s ; comprendre ce qui est implicite dans le texte (inf\00E9rences) dans des cas simples ; justifier ses r\00E9ponses par un retour au texte ; lire et comprendre en autonomie un texte narratif, informatif ou prescriptif d''une quinzaine de lignes.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve restitue les enchainements logiques et chronologiques d''un r\00E9cit.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il est capable d''expliciter les \00E9motions des personnages.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il est capable de donner un titre au texte et de le r\00E9sumer oralement.', 3);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il r\00E9alise ce qui est demand\00E9 dans le cas d''un texte prescriptif : une recette, l''application d''une r\00E8gle du jeu, etc.', 4);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve prend appui sur la morphologie d''un mot et/ou sur le contexte pour le comprendre.', 5);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il prend l''habitude de consulter un dictionnaire adapt\00E9 et de relire en autonomie un texte ou un passage pour mieux le comprendre.', 6);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Devenir lecteur', 4)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Lire 5 \00E0 10 oeuvres compl\00E8tes et vari\00E9es issues du patrimoine et de la litt\00E9rature de jeunesse ; se familiariser aux diff\00E9rents genres et types de textes ; faire preuve d''initiative dans ses lectures personnelles en empruntant des livres en fonction de ses gouts ; relier ses lectures \00E0 son exp\00E9rience personnelle.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve commence \00E0 \00E9crire \00E0 propos de ses lectures : il exprime ses gouts et pr\00E9f\00E9rences, est capable d''\00E9crire un bref r\00E9sum\00E9 ou d''inventer une autre fin.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il est capable, \00E0 l''oral, de pr\00E9senter une lecture \00E0 ses camarades.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il reconnait, lors des lectures orales d''un adulte, les grandes caract\00E9ristiques d''un texte (conte, fable, po\00E8me).', 3);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il se familiarise avec les lieux de lecture et d\00E9veloppe une autonomie dans le choix de ses lectures.', 4);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_domaine_id, v_type_sous_domaine, U&'Cours \00E9l\00E9mentaire deuxi\00E8me ann\00E9e', 3)
  returning id into v_annee_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Identifier les mots de mani\00E8re de plus en plus ais\00E9e', 1)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Avoir automatis\00E9 toutes les correspondances graphophon\00E9miques (CGP) ; lire un texte nouveau en s''appuyant sur un d\00E9codage rapide ; automatiser la lecture des mots ; rep\00E9rer les lettres muettes et d\00E9coder les mots inconnus en conservant une vitesse de lecture correspondant aux objectifs de fin d''ann\00E9e.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve reconnait directement les mots fr\00E9quents et irr\00E9guliers.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il utilise la voie graphophonologique pour lire des mots inconnus en conservant une fluidit\00E9 de lecture.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il lit un texte avec fluidit\00E9 sans vocaliser les lettres muettes et en faisant les liaisons appropri\00E9es.', 3);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Lire \00E0 voix haute', 2)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Lire un texte adapt\00E9 \00E0 son niveau de lecture avec une vitesse de 90 mots par minute ; lire un texte en respectant l''ensemble des marques de ponctuation et les liaisons ; manifester sa compr\00E9hension par une lecture expressive qui respecte la structure du texte, de la phrase et le sens.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve est capable de lire une sc\00E8ne de th\00E9\00E2tre en incarnant un personnage et en jouant de l''expressivit\00E9 de la ponctuation.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Comprendre un texte', 3)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Lire et d\00E9gager le sens d''un texte narratif, po\00E9tique, documentaire ou th\00E9\00E2tral, lu en autonomie ou lu par un adulte ; adopter une posture active par rapport au vocabulaire inconnu ; se rep\00E9rer dans la chaine anaphorique et s''appuyer sur le sens du texte pour r\00E9soudre des ambig\00FCit\00E9s ; diff\00E9rencier le type narratif du type informatif et prescriptif ; comprendre ce qui est implicite en s''appuyant sur des indices explicites et sur ses propres connaissances ; lire et comprendre en autonomie un texte narratif, informatif ou prescriptif d''une vingtaine de lignes.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve restitue les enchainements logiques et chronologiques d''un r\00E9cit et identifie les \00E9v\00E8nements, les personnages et les lieux \00E9voqu\00E9s.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il rep\00E8re les informations donn\00E9es dans un texte informatif simple et verbalise ce que la lecture lui a permis d''apprendre.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il est capable de donner un titre au texte et de le r\00E9sumer oralement.', 3);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il sait utiliser les sous-titres, titres de chapitres, mise en page en paragraphes, etc. pour mieux comprendre.', 4);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il est capable d''expliciter les \00E9motions et ressorts psychologiques des personnages et explicite les inf\00E9rences.', 5);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il prend appui sur le contexte et sur la morphologie pour \00E9lucider le sens des mots inconnus.', 6);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il commence \00E0 utiliser des strat\00E9gies dans le cas d''une prise de conscience de non-compr\00E9hension : relecture, recherche dans le dictionnaire, recherche documentaire, etc.', 7);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Devenir lecteur', 4)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Lire de mani\00E8re autonome 5 \00E0 10 oeuvres compl\00E8tes et vari\00E9es issues du patrimoine et de la litt\00E9rature de jeunesse ; relier ses lectures \00E0 son exp\00E9rience personnelle, \00EAtre en mesure d''\00E9tablir des liens entre ses diff\00E9rentes lectures (mise en r\00E9seau) ; fr\00E9quenter des lieux de lecture r\00E9guli\00E8rement et rencontrer des acteurs du livre.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve connait les caract\00E9ristiques de personnages-types de plus en plus diversifi\00E9s ; il dispose de r\00E9f\00E9rences construites sur des r\00E9seaux de textes.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il diff\00E9rencie les caract\00E9ristiques des genres et types les plus courants : po\00E9sie, th\00E9\00E2tre, r\00E9cit (policier, d''aventure, etc.).', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il partage une culture commune autour de textes patrimoniaux adapt\00E9s \00E0 son \00E2ge.', 3);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il consigne ses exp\00E9riences de lecture dans un carnet de lecteur.', 4);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_francais_id, v_type_sous_domaine, U&'\00C9criture', 2)
  returning id into v_domaine_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_domaine_id, v_type_sous_domaine, U&'Cours pr\00E9paratoire', 1)
  returning id into v_annee_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Apprendre \00E0 \00E9crire en \00E9criture cursive', 1)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Apprendre \00E0 \00E9crire en \00E9criture cursive tous les graph\00E8mes \00E9tudi\00E9s selon la progression en d\00E9codage ; apprendre \00E0 les enchainer, avec fluidit\00E9, avec d''autres lettres dans des syllabes, mots, phrases.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve respecte la forme et la taille de la lettre, le sens de rotation du trac\00E9 et l''enchainement des lettres.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il est capable d''enchainer plusieurs lettres sans lever le crayon (sauf devant les lettres rondes : a, c, d, g, o, q, x).', 2);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Encoder puis \00E9crire sous dict\00E9e', 2)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'D\00E8s le d\00E9but de l''ann\00E9e : encoder des syllabes simples puis des mots selon la progression des CGP. D\00E8s la fin de la 2e p\00E9riode : \00E9crire des mots dict\00E9s avec des lettres muettes apprises. En fin d''ann\00E9e : \00E9crire sous la dict\00E9e des mots et des phrases.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Dans le cadre des le\00E7ons sur les graph\00E8mes, l''\00E9l\00E8ve r\00E9alise des dict\00E9es de lettres, syllabes, mots puis phrases \00E0 partir de la p\00E9riode 2.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il oralise ce qu''il \00E9crit et segmente la chaine orale (la phrase en mots, les mots en syllabes et phon\00E8mes).', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il utilise l''analogie (il recourt au mot vendredi pour \00E9crire la pr\00E9position en).', 3);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'A partir de la p\00E9riode 2, il mobilise des connaissances orthographiques lors des activit\00E9s d''encodage.', 4);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il utilise les outils pr\00E9sents dans la classe (frise alphab\00E9tique, r\00E9pertoire de mots, affichages, etc.).', 5);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Copier et acqu\00E9rir des strat\00E9gies de copie', 3)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'D\00E8s le d\00E9but de l''ann\00E9e : copier des syllabes simples puis des mots avec lettres muettes. D\00E8s la fin de la p\00E9riode 1 : copier une phrase en lien avec les CGP \00E9tudi\00E9es, commencer \00E0 verbaliser et \00E0 utiliser des strat\00E9gies de copie, commencer \00E0 savoir se relire apr\00E8s copie. En fin d''ann\00E9e : copier trois ou quatre phrases sans erreur et de fa\00E7on lisible.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve transforme en cursive un mot puis une phrase \00E0 partir de mod\00E8les en \00E9criture scripte.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il copie un \00E9crit plac\00E9 \00E0 distance et comptabilise le nombre de recours au mod\00E8le pour obtenir une version conforme.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il rectifie seul les oublis de mots et les erreurs de ponctuation en fin d''ann\00E9e.', 3);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il verbalise et met en place des strat\00E9gies de copies (segmenter l''empan, m\00E9morisation par ex.).', 4);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Produire des \00E9crits', 4)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'D\00E8s le d\00E9but de l''ann\00E9e : \00E9crire des graph\00E8mes, des syllabes, des mots puis quelques phrases avec l''aide du professeur. D\00E8s la 2e p\00E9riode : produire des \00E9crits courts porteurs de sens, d''une \00E0 cinq lignes. En fin d''ann\00E9e : commencer \00E0 acqu\00E9rir une m\00E9thodologie de production \00E9crite (planification, mise en mots, relectures et r\00E9visions).', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve compose des phrases \00E0 l''aide d''\00E9tiquettes mobiles qu''il sait d\00E9chiffrer.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il participe \00E0 une dict\00E9e \00E0 l''adulte, en petit groupe, en adaptant son d\00E9bit de parole.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il compl\00E8te et modifie des listes analogiques en lien avec ses apprentissages en lecture, grammaire, orthographe et vocabulaire.', 3);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il respecte les deux marqueurs de la phrase : majuscule et ponctuation finale forte, en fin d''ann\00E9e.', 4);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Apr\00E8s la lecture d''un r\00E9cit \00E0 structure r\00E9p\00E9titive, il \00E9crit un nouvel \00E9pisode en respectant la structure impos\00E9e.', 5);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_domaine_id, v_type_sous_domaine, U&'Cours \00E9l\00E9mentaire premi\00E8re ann\00E9e', 2)
  returning id into v_annee_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Apprendre \00E0 \00E9crire en \00E9criture cursive', 1)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'D\00E8s la p\00E9riode 1 : m\00E9moriser le trac\00E9 norm\00E9 et la transcription de toutes les lettres minuscules scriptes en lettres minuscules cursives. A partir de la p\00E9riode 2 : reconnaitre les lettres dans les quatre \00E9critures ; apprendre le trac\00E9 norm\00E9 des lettres majuscules cursives par familles de gestes.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve exerce tous les jours le geste d''\00E9criture cursive minuscule en r\00E9visant les graph\00E8mes par famille de gestes.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il transcrit de l''\00E9criture scripte en \00E9criture cursive.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'En fin d''ann\00E9e, il reconnait toutes les majuscules des lettres cursives et sait les tracer.', 3);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Encoder puis \00E9crire sous dict\00E9e', 2)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Orthographier correctement les mots fr\00E9quents, r\00E9guliers puis irr\00E9guliers ; r\00E9aliser des accords en genre et en nombre dans le groupe nominal et dans le groupe verbal.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve r\00E9alise des dict\00E9es en lien avec l''\00E9tude des graph\00E8mes avec ou sans appui du cahier o\00F9 ils sont consign\00E9s.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il r\00E9alise des dict\00E9es en lien avec l''\00E9tude de la langue et se familiarise avec divers types de dict\00E9e.', 2);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Copier et acqu\00E9rir des strat\00E9gies de copie', 3)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Automatiser le geste d''\00E9criture cursive par la copie de textes en temps limit\00E9 ; acqu\00E9rir des strat\00E9gies de copie et en mesurer l''efficacit\00E9. A l''issue de la p\00E9riode 1 : copier quatre \00E0 cinq phrases courtes. A partir de la p\00E9riode 3 : copier cinq ou six lignes sans erreur. A la fin de l''ann\00E9e : recopier sans effort une dizaine de lignes en respectant la ponctuation et la mise en page.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait transcrire cinq ou six phrases dans un cahier en enchainant plusieurs lettres sans rompre le geste.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il sait mobiliser diff\00E9rentes strat\00E9gies de copie : lettre \00E0 lettre, syllabe par syllabe, mot \00E0 mot, groupe de mots par groupe de mots, etc.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il commence \00E0 comparer l''efficacit\00E9 relative de ces strat\00E9gies, selon les situations.', 3);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il relit son \00E9crit et corrige l''orthographe en fonction du texte et des indications du professeur.', 4);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Produire des \00E9crits', 4)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'D\00E8s les premi\00E8res semaines : r\00E9diger une phrase simple \00E0 partir d''une phrase prototypique. D\00E8s la p\00E9riode 1 : \00E9crire un texte court de une \00E0 trois phrases. Au cours des p\00E9riodes 1 \00E0 5 : ins\00E9rer des connecteurs pour rendre coh\00E9rent l''enchainement de plusieurs phrases. En fin d''ann\00E9e : \00E9crire un texte de six ou sept phrases maximum en assurant la coh\00E9rence syntaxique et logique du texte produit.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve modifie un passage d''un texte lu en prenant appui sur un corpus de mots.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il se sert de brouillons pour \00E9crire : listes, pistes, cartes mentales, etc.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Lors de l''\00E9tude d''une oeuvre, il \00E9crit la suite d''un passage en s\00E9quen\00E7ant les actions : D''abord... Puis... Enfin...', 3);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'A l''\00E9coute de son texte, il indique s''il y a des omissions, des incoh\00E9rences et des r\00E9p\00E9titions.', 4);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'En fin d''ann\00E9e, il \00E9crit des phrases de r\00E9ponses dans de nombreuses situations de classe, par exemple en math\00E9matiques.', 5);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_domaine_id, v_type_sous_domaine, U&'Cours \00E9l\00E9mentaire deuxi\00E8me ann\00E9e', 3)
  returning id into v_annee_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Apprendre \00E0 \00E9crire en \00E9criture cursive', 1)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'D\00E8s la p\00E9riode 1 : automatiser l''\00E9criture de toutes les lettres minuscules et majuscules en cursive.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve \00E9crit et transcrit avec fluidit\00E9 toutes les lettres cursives minuscules et majuscules.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Encoder puis \00E9crire sous dict\00E9e', 2)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'A la fin de l''ann\00E9e : orthographier correctement les mots fr\00E9quents, r\00E9guliers et irr\00E9guliers et des phrases selon les accords \00E9tudi\00E9s dans le cadre de dict\00E9es.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve r\00E9alise des dict\00E9es en lien avec l''\00E9tude de la langue en mobilisant diverses connaissances enseign\00E9es.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il transcrit correctement les phon\00E8mes pouvant s''\00E9crire \00E0 l''aide de plusieurs graph\00E8mes dans diff\00E9rents mots fr\00E9quents.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il orthographie les chaines d''accord dans la phrase.', 3);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Copier et acqu\00E9rir des strat\00E9gies de copie', 3)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'En fin d''ann\00E9e : copier une dizaine de lignes sans erreur en conjuguant vitesse et exactitude et en respectant les mises en page complexes.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve utilise syst\00E9matiquement des strat\00E9gies de copie pour exercer la vitesse, l''exactitude, l''endurance et la mise en page.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il sait copier en respectant la mise en page du texte.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il se relit et est capable de rep\00E9rer des omissions ou erreurs orthographiques ou de ponctuation.', 3);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Produire des \00E9crits', 4)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'D\00E9velopper tout au long de l''ann\00E9e les comp\00E9tences qui lui permettront en fin d''ann\00E9e d''\00E9crire pour transmettre un message, de r\00E9diger des phrases entrainant les automatismes appris en grammaire et orthographe, d''\00E9crire un texte d''une dizaine de lignes de diff\00E9rents types, et de relire son texte m\00E9thodiquement.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve \00E9crit un message correctement orthographi\00E9 pour \00EAtre compris par le lecteur.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il utilise un brouillon pour organiser ses id\00E9es et s''appuie sur un cahier de r\00E8gles ou sur des affichages.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il mobilise des connecteurs temporels et logiques.', 3);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il \00E9crit des dialogues, des r\00E9cits, des po\00E8mes en tenant compte des diff\00E9rentes caract\00E9ristiques des types et genres de textes.', 4);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il \00E9crit des questions, des r\00E9ponses et des hypoth\00E8ses.', 5);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il parvient \00E0 identifier les groupes nominaux et verbaux dans son texte et \00E9ventuellement \00E0 corriger les erreurs d''accords.', 6);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il am\00E9liore son texte en fonction des indications du professeur.', 7);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_francais_id, v_type_sous_domaine, U&'Oral', 3)
  returning id into v_domaine_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_domaine_id, v_type_sous_domaine, U&'Cours pr\00E9paratoire', 1)
  returning id into v_annee_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'\00C9couter pour comprendre', 1)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Comprendre un message entendu de quelques minutes et m\00E9moriser quelques informations importantes.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve adopte une posture d''\00E9coute pour m\00E9moriser une consigne ou un message important.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il r\00E9alise l''action demand\00E9e par un discours injonctif : consigne, recette de cuisine, notice de montage, r\00E8gle du jeu, etc.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il sait r\00E9pondre, apr\00E8s plusieurs \00E9coutes d''un texte narratif, \00E0 la question : Que raconte ce texte ?', 3);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il sait r\00E9pondre, apr\00E8s plusieurs \00E9coutes d''un bref document audio ou d''une lecture oralis\00E9e d''un texte documentaire, \00E0 la question : Quelles informations as-tu retenues ?', 4);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Dire pour \00EAtre compris', 2)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Mener une br\00E8ve production orale pour rapporter, raconter, d\00E9crire ou expliquer, en utilisant quelques organisateurs du discours et en mobilisant le lexique appris ; s''\00E9couter pour progresser et proposer des reformulations ; oraliser un texte m\00E9moris\00E9 ou pr\00E9par\00E9 en tenant compte de son auditoire.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'En groupe restreint, l''\00E9l\00E8ve est capable de prendre la parole en regardant ses camarades et en veillant \00E0 se faire comprendre d''eux.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il est capable de d\00E9crire des images ou de raconter avec ses propres mots une histoire entendue, en utilisant des connecteurs tels que parce que, alors, ensuite.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il restitue un po\00E8me en articulant distinctement et d''une voix audible.', 3);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Participer \00E0 des \00E9changes', 3)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Participer aux \00E9changes en respectant les r\00E8gles, en \00E9coutant les autres et en donnant son avis ; prendre conscience des \00E9carts de niveau de langue selon les situations de communication.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve attend la fin d''une prise de parole pour parler.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il est capable d''exprimer une id\00E9e en lien avec le sujet de l''\00E9change en r\00E9utilisant des expressions comme : Je souhaite prendre la parole pour... ; Je suis d''accord...', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il mesure que l''on ne parle pas de la m\00EAme mani\00E8re en classe et dans la cour.', 3);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_domaine_id, v_type_sous_domaine, U&'Cours \00E9l\00E9mentaire premi\00E8re ann\00E9e', 2)
  returning id into v_annee_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'\00C9couter pour comprendre', 1)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Maintenir une attention active pendant quelques minutes pour rep\00E9rer, m\00E9moriser, classer ou ordonner les informations importantes entendues \00E0 l''oral.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve est capable d''\00E9coute active : il prend le temps de comprendre les informations entendues.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il r\00E9alise l''action demand\00E9e par un discours injonctif : consigne, recette de cuisine, notice de montage, r\00E8gle du jeu, etc.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il r\00E9capitule une le\00E7on orale, par exemple en sciences, en ordonnant les informations.', 3);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Dire pour \00EAtre compris', 2)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Utiliser \00E0 l''oral l''ensemble des temps verbaux pour raconter, d\00E9crire, expliquer, comparer ou exposer ; utiliser les crit\00E8res d\00E9finis pour \00E9valuer sa prestation ou celle des autres et progresser dans la production de diff\00E9rents types de discours.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve est capable de prendre la parole en groupe : il s''adresse directement \00E0 ses camarades et se fait comprendre.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il est capable de r\00E9investir, pendant 5 minutes maximum, les tournures linguistiques et les postures apprises lors des s\00E9ances d\00E9di\00E9es \00E0 l''enseignement des diff\00E9rents types de discours.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il utilise des termes comme d''abord, pour commencer, ensuite, donc, par cons\00E9quent, enfin, pour terminer, pour conclure.', 3);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il pr\00E9sente une d\00E9marche scientifique en utilisant le lexique appris.', 4);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Participer \00E0 des \00E9changes', 3)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Respecter le propos au cours des \00E9changes au sein d''un groupe ; adapter le registre de langue utilis\00E9 (familier, courant, soutenu) \00E0 la situation de communication propos\00E9e.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve exprime et justifie un accord ou un d\00E9saccord en utilisant des expressions fournies par le professeur : Je ne suis pas d''accord avec... ; Je ne partage pas l''avis de...', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il participe \00E0 des jeux de r\00F4le et adapte son registre de langue de fa\00E7on appropri\00E9e (vocabulaire et syntaxe).', 2);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_domaine_id, v_type_sous_domaine, U&'Cours \00E9l\00E9mentaire deuxi\00E8me ann\00E9e', 3)
  returning id into v_annee_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'\00C9couter pour comprendre', 1)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Rep\00E9rer, m\00E9moriser et relier entre elles plusieurs informations importantes pour construire la coh\00E9rence d''un message entendu de plus en plus long et complexe (5 minutes maximum), en \00E9valuant son degr\00E9 de compr\00E9hension.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve \00E9coute une interview d''un ou d''une artiste ou d''un ou d''une scientifique et, apr\00E8s plusieurs \00E9coutes et \00E0 la suite de consignes claires, reformule l''essentiel de ce qu''il a appris du locuteur en question.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il \00E9coute une histoire et est capable d''en inventer la fin.', 2);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Dire pour \00EAtre compris', 2)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Mener une production orale de plus en plus longue et structur\00E9e pour raconter, expliquer, argumenter, justifier ; maintenir l''int\00E9r\00EAt de son auditoire lors des diff\00E9rentes prestations orales.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve est capable de r\00E9investir les tournures linguistiques et les postures apprises lors des s\00E9ances d\00E9di\00E9es \00E0 l''enseignement des diff\00E9rentes formes de discours.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il produit des phrases de plus en plus complexes et mobilise un lexique de plus en plus vari\00E9 et abstrait.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il pr\00E9sente un expos\00E9 de quelques minutes construit en classe en prenant appui sur un support.', 3);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il explique un raisonnement en math\00E9matiques ou en sciences : une d\00E9marche, le choix d''une proc\00E9dure, etc.', 4);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il est capable d''expliciter une erreur commise.', 5);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il \00E9vite les tics verbaux, les mots familiers, varie les connecteurs et veille au niveau de langue adopt\00E9 lors des prestations orales.', 6);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Participer \00E0 des \00E9changes', 3)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Tenir compte de ce qui a d\00E9j\00E0 \00E9t\00E9 dit lors des interventions au sein d''un groupe ; utiliser un registre de langue et adopter des postures adapt\00E9es aux situations propos\00E9es (jeux de r\00F4les).', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve est capable de reformuler ce qui a \00E9t\00E9 dit par un camarade et de s''appuyer sur ce propos pour faire progresser l''\00E9change.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il utilise des expressions fournies par le professeur : Pour compl\00E9ter ce qu''a dit... ; Je souhaite revenir sur ce qu''a dit... ; Pour reprendre les propos de...', 2);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_francais_id, v_type_sous_domaine, U&'Vocabulaire', 4)
  returning id into v_domaine_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_domaine_id, v_type_sous_domaine, U&'Cours pr\00E9paratoire', 1)
  returning id into v_annee_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Enrichir son vocabulaire dans tous les enseignements', 1)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'D\00E9couvrir et m\00E9moriser le vocabulaire sp\00E9cifique rencontr\00E9 dans les diff\00E9rents enseignements et dans les lectures.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve r\00E9utilise \00E0 bon escient le lexique sp\00E9cifique rencontr\00E9 en math\00E9matiques, en questionner le monde ou lors des lectures.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il classe des mots nouveaux par cat\00E9gorie (les animaux, les v\00EAtements, l''\00E9cole, etc.).', 2);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'\00C9tablir des relations entre les mots', 2)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Regrouper des mots par familles ou par cat\00E9gories ; d\00E9couvrir des relations de sens simples entre les mots (mots de sens proche ou oppos\00E9).', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve trouve un mot de sens proche ou de sens oppos\00E9 \00E0 un mot donn\00E9.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il regroupe des mots ayant un rapport de sens (le mobilier, les v\00EAtements, etc.).', 2);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'R\00E9employer le vocabulaire \00E9tudi\00E9', 3)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'R\00E9investir \00E0 l''oral puis \00E0 l''\00E9crit le vocabulaire \00E9tudi\00E9 en classe.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve r\00E9utilise spontan\00E9ment, \00E0 l''oral, des mots nouvellement appris.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il r\00E9investit le vocabulaire \00E9tudi\00E9 dans ses productions \00E9crites courtes.', 2);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'M\00E9moriser l''orthographe lexicale', 4)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'M\00E9moriser l''orthographe des mots invariables et des mots fr\00E9quents les plus utiles.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve orthographie correctement, dans une dict\00E9e ou une production \00E9crite, les mots invariables et fr\00E9quents \00E9tudi\00E9s en classe.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_domaine_id, v_type_sous_domaine, U&'Cours \00E9l\00E9mentaire premi\00E8re ann\00E9e', 2)
  returning id into v_annee_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Enrichir son vocabulaire dans toutes les disciplines', 1)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'D\00E9couvrir et m\00E9moriser le vocabulaire rencontr\00E9 dans les diff\00E9rentes disciplines et dans les lectures, y compris le vocabulaire abstrait.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve r\00E9utilise le vocabulaire sp\00E9cifique rencontr\00E9 en sciences, en histoire-g\00E9ographie ou lors des lectures d''oeuvres.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'\00C9tablir des relations entre les mots', 2)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Regrouper des mots selon leur sens (synonymes, contraires) ou leur construction (famille de mots, pr\00E9fixes, suffixes) ; utiliser le contexte pour comprendre un mot inconnu.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve identifie le radical commun \00E0 plusieurs mots d''une m\00EAme famille.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il propose un synonyme ou un contraire adapt\00E9 au contexte d''une phrase.', 2);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'R\00E9employer le vocabulaire \00E9tudi\00E9', 3)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'R\00E9investir le vocabulaire \00E9tudi\00E9 dans des productions orales et \00E9crites de plus en plus vari\00E9es.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve utilise, dans un texte qu''il \00E9crit, des mots pr\00E9cis \00E9tudi\00E9s en classe plut\00F4t que des mots g\00E9n\00E9riques comme chose ou faire.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'M\00E9moriser l''orthographe des mots', 4)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'M\00E9moriser l''orthographe de mots fr\00E9quents et de mots invariables plus nombreux, y compris certains mots irr\00E9guliers.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve orthographie correctement, en contexte de dict\00E9e ou de production \00E9crite, les mots m\00E9moris\00E9s.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_domaine_id, v_type_sous_domaine, U&'Cours \00E9l\00E9mentaire deuxi\00E8me ann\00E9e', 3)
  returning id into v_annee_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Enrichir son vocabulaire dans toutes les disciplines', 1)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'D\00E9couvrir et m\00E9moriser un vocabulaire de plus en plus pr\00E9cis et abstrait, y compris le vocabulaire des sentiments et des jugements.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve utilise \00E0 bon escient un vocabulaire pr\00E9cis pour exprimer une \00E9motion, une opinion ou un jugement.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'\00C9tablir des relations entre les mots', 2)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Utiliser des mots de sens proche ou oppos\00E9 et des mots g\00E9n\00E9riques ou sp\00E9cifiques ; commencer \00E0 utiliser le dictionnaire pour v\00E9rifier le sens d''un mot.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve remplace un mot g\00E9n\00E9rique par un mot plus pr\00E9cis dans un texte qu''il \00E9crit.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il consulte un dictionnaire adapt\00E9 \00E0 son \00E2ge pour v\00E9rifier ou pr\00E9ciser le sens d''un mot.', 2);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'R\00E9employer le vocabulaire \00E9tudi\00E9', 3)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'R\00E9investir de mani\00E8re autonome et pertinente le vocabulaire \00E9tudi\00E9 dans des productions orales et \00E9crites vari\00E9es.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve choisit spontan\00E9ment, dans ses \00E9crits, le mot le plus juste parmi plusieurs synonymes possibles.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'M\00E9moriser l''orthographe des mots', 4)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'M\00E9moriser l''orthographe d''un nombre croissant de mots fr\00E9quents, invariables et irr\00E9guliers rencontr\00E9s dans les diff\00E9rentes disciplines.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve orthographie correctement, en contexte de dict\00E9e ou de production \00E9crite, l''ensemble des mots m\00E9moris\00E9s depuis le CP.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_francais_id, v_type_sous_domaine, U&'Grammaire et orthographe', 5)
  returning id into v_domaine_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_domaine_id, v_type_sous_domaine, U&'Cours pr\00E9paratoire', 1)
  returning id into v_annee_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Se rep\00E9rer dans la phrase simple', 1)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'S''approprier progressivement la notion de phrase simple et ses trois marqueurs essentiels : majuscule initiale, ponctuation finale forte et sens. Comprendre que certains \00E9l\00E9ments (sujet/verbe et d\00E9terminants/noms/adjectifs) fonctionnent ensemble et constituent un syst\00E8me. S''appuyer sur la ponctuation pour reconnaitre les trois types de phrases (d\00E9clarative, interrogative et imp\00E9rative). Reconnaitre les formes n\00E9gative et exclamative. Constituer des corpus par classe de mots : noms, verbes, d\00E9terminants, adjectifs, pronoms personnels.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve identifie les phrases d''un court texte \00E0 partir des majuscules et des diff\00E9rents points.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il sait ordonner et produire une phrase simple (rep\00E8re la place des groupes).', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il manipule les types de phrases d\00E9claratives et imp\00E9ratives avec la forme n\00E9gative et sait expliciter le changement de sens op\00E9r\00E9 par ces manipulations.', 3);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il op\00E8re des tris de mots (d\00E9terminant/nom/adjectif) entendus, lus ou \00E9crits en fonction de leur genre et de leur nombre.', 4);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il observe les corpus que le professeur a tri\00E9s par classe grammaticale et commence \00E0 \00E9laborer des crit\00E8res de reconnaissance.', 5);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'D\00E9couvrir, comprendre et mettre en oeuvre l''orthographe grammaticale', 2)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Comprendre les notions de masculin et de f\00E9minin, de singulier et de pluriel. Se familiariser avec la notion de chaine d''accords (d\00E9terminant/nom/adjectif) en rep\00E9rant les r\00E9gularit\00E9s des marques de genre et de nombre. S''initier \00E0 l''identification de la relation sujet-verbe \00E0 partir du sens et de l''observation des effets des transformations li\00E9es aux temps et aux personnes. Observer les diff\00E9rentes formes verbales fr\00E9quentes et r\00E9guli\00E8res. Apprendre \00E0 conjuguer \00EAtre et avoir au pr\00E9sent de l''indicatif et commencer \00E0 les mobiliser \00E0 l''\00E9crit.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve observe la marque du f\00E9minin (+e) \00E0 partir d''exemples sonores : petit/petite, grand/grande, etc.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il observe la marque du pluriel (+s) \00E0 partir de l''observation de mots se terminant par la marque du pluriel, s muet pr\00E9c\00E9d\00E9s de leur d\00E9terminant.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il op\00E8re des classements grammaticaux de groupes nominaux en fonction de leur genre ou de leur nombre.', 3);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'A partir d''un groupe nominal puis d''une phrase simple qu''il \00E9coute et manipule \00E0 l''\00E9crit, il observe les modifications.', 4);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il orthographie sous la dict\00E9e des groupes nominaux du type : une olive/des olives ; une boulang\00E8re/un boulanger.', 5);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il comprend le lien s\00E9mantique entre le chat et miaule et observe les variations orthographiques entre le chat miaule et les chats miaulent.', 6);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il est capable de trouver l''orthographe d''une terminaison verbale en s''appuyant sur le sens et les analogies (nous -> ons, vous -> ez, ils -> ent, tu -> s, etc.).', 7);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_domaine_id, v_type_sous_domaine, U&'Cours \00E9l\00E9mentaire premi\00E8re ann\00E9e', 2)
  returning id into v_annee_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Se rep\00E9rer dans la phrase simple', 1)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Identifier la phrase simple, en distinguer les principaux constituants et les nommer : groupe sujet (GS), verbe et compl\00E9ments sans distinguer ces derniers entre eux. Reconnaitre et utiliser les trois types de phrases, en lien avec la ponctuation : d\00E9clarative, interrogative et imp\00E9rative. Reconnaitre les formes n\00E9gatives et exclamatives et savoir effectuer des transformations. Diff\00E9rencier et nommer les principales classes de mots : le d\00E9terminant, le nom commun, le nom propre, l''adjectif, le verbe, le pronom personnel sujet.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve progresse en lecture \00E0 voix haute en s''appuyant sur les signes de ponctuation et sur les groupes de sens.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il est capable d''op\00E9rer des manipulations de phrase : d\00E9placement, suppression, ajout, substitution, en grammaire comme en production \00E9crite.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il compl\00E8te des listes propos\00E9es par le professeur par classes grammaticales.', 3);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il cat\00E9gorise un corpus de mots propos\00E9 par classe grammaticale et affine les crit\00E8res de reconnaissance \00E9labor\00E9s au CP, y compris pour les noms propres.', 4);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'D\00E9couvrir, comprendre et mettre en oeuvre l''orthographe grammaticale', 2)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Reconnaitre le groupe nominal (d\00E9terminant/nom/adjectif) et, en \00E9coutant des transformations de phrases \00E0 l''oral puis en les observant \00E0 l''\00E9crit, comprendre le lien entre le d\00E9terminant, le nom et l''adjectif dans la chaine d''accords. Identifier la relation sujet-verbe \00E0 partir de l''observation des effets des transformations li\00E9es au changement de temps et de personne dans des situations simples. Identifier le radical et la terminaison d''un verbe du premier groupe conjugu\00E9 et trouver son infinitif. Apprendre \00E0 conjuguer au pr\00E9sent, \00E0 l''imparfait, au futur puis au pass\00E9 compos\00E9 de l''indicatif \00EAtre et avoir et les verbes du premier groupe.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve reconnait progressivement un d\00E9terminant. Il en indique le genre et le nombre.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il utilise, en dict\00E9e, des marques d''accord pour le nom et l''adjectif \00E9pith\00E8te (pluriel en -s, f\00E9minin en -e) et commence \00E0 les mobiliser en production d''\00E9crits.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il mobilise diff\00E9rentes strat\00E9gies qui permettent d''identifier le verbe et le sujet ; il relie s\00E9mantiquement le sujet et le verbe et op\00E8re des transformations de personne.', 3);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il orthographie des formes verbales en situation de dict\00E9e et commence \00E0 les mobiliser en situation d''expression \00E9crite autonome.', 4);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il est capable de nommer l''infinitif d''un verbe conjugu\00E9 \00E0 divers temps et \00E0 diff\00E9rentes personnes, en s''appuyant sur le rep\00E9rage d''un radical commun.', 5);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_domaine_id, v_type_sous_domaine, U&'Cours \00E9l\00E9mentaire deuxi\00E8me ann\00E9e', 3)
  returning id into v_annee_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Se rep\00E9rer dans la phrase simple', 1)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Identifier la phrase simple et reconnaitre ses principaux constituants : le groupe sujet, le verbe et les compl\00E9ments sans distinguer ces derniers entre eux. Reconnaitre et produire les trois types de phrases : d\00E9clarative, interrogative et imp\00E9rative. Reconnaitre et produire les formes n\00E9gative et exclamative. Diff\00E9rencier et nommer les principales classes de mots : le d\00E9terminant, le nom commun, le nom propre, l''adjectif, le verbe, le pronom personnel sujet et l''adverbe. Utiliser la ponctuation de fin de phrase et reconnaitre les marques du discours rapport\00E9.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve substitue \00E0 un groupe nominal sujet un pronom personnel sujet et inversement.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il transforme des phrases de diff\00E9rents types \00E0 la forme n\00E9gative.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il observe la diff\00E9rence entre les mots variables et invariables et d\00E9couvre la classe grammaticale de l''adverbe ; il sait orthographier les adverbes les plus fr\00E9quents et les adverbes en -ment.', 3);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il rep\00E8re dans un texte les passages au discours direct.', 4);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il mobilise les termes grammaticaux pour r\00E9soudre des probl\00E8mes d''orthographe, d''\00E9criture et de lecture.', 5);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'D\00E9couvrir, comprendre et mettre en oeuvre l''orthographe grammaticale', 2)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Rep\00E9rer, comprendre et mettre en oeuvre les marques d''accord au sein du groupe nominal. Identifier, dans des situations simples, la relation sujet-verbe. Apprendre \00E0 conjuguer au pr\00E9sent, \00E0 l''imparfait, au futur et au pass\00E9 compos\00E9 de l''indicatif \00EAtre et avoir, les verbes du premier groupe et les verbes irr\00E9guliers du 3e groupe (faire, aller, dire, venir, pouvoir, voir, vouloir, prendre). Identifier le radical et la terminaison d''un verbe conjugu\00E9 au programme et trouver son infinitif.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve comprend la notion de chaine d''accords dans le groupe nominal et utilise des marques d''accords r\00E9guliers pour les noms et les adjectifs, ainsi que des marques de pluriels irr\00E9guliers et des marques du f\00E9minin quand elles s''entendent.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il mobilise diff\00E9rentes strat\00E9gies pour consolider l''identification et la compr\00E9hension du lien entre le groupe sujet et le verbe, en op\00E9rant des transformations de personne et de temps.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il verbalise des raisonnements orthographiques en situation de dict\00E9e ou d''\00E9criture et corrige des accords en fonction du signalement du professeur.', 3);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Il orthographie correctement les formes verbales \00E9tudi\00E9es en situation de dict\00E9e et d''\00E9criture.', 4);

  raise notice 'Francais (cycle 2) reimporte avec les accents corrects.';
end $$;