-- Import du programme officiel cycle 2 -- Francais > Lecture (BO du 31
-- octobre 2024, https://education.gouv.fr/sites/default/files/ensel135_annexe3.pdf).
-- Premier sous-domaine du francais importe ; les quatre autres (Ecriture,
-- Oral, Vocabulaire, Grammaire et orthographe) suivront de la meme facon.

do $$
declare
  v_cycle2_id uuid;
  v_referentiel_id uuid;
  v_type_domaine uuid;
  v_type_sous_domaine uuid;
  v_type_objectif uuid;
  v_type_exemple uuid;
  v_francais_id uuid;
  v_lecture_id uuid;
  v_annee_id uuid;
  v_theme_id uuid;
  v_objectif_id uuid;
begin
  select id into v_referentiel_id from referentiels_programmes where version = 'brouillon-0';

  -- Cycle 2 : cree seulement s'il n'existe pas deja (executions repetees sans risque).
  insert into cycles (referentiel_id, libelle, ordre)
  values (v_referentiel_id, 'Cycle 2 (CP, CE1, CE2)', 2)
  on conflict (referentiel_id, libelle) do nothing;

  select id into v_cycle2_id from cycles
  where referentiel_id = v_referentiel_id and libelle = 'Cycle 2 (CP, CE1, CE2)';

  select id into v_type_domaine from types_element_programme where code = 'domaine';
  select id into v_type_sous_domaine from types_element_programme where code = 'sous_domaine';
  select id into v_type_objectif from types_element_programme where code = 'objectif';
  select id into v_type_exemple from types_element_programme where code = 'exemple_reussite';

  -- Domaine "Francais" : cree seulement s'il n'existe pas deja pour ce cycle.
  select id into v_francais_id from elements_programme
  where cycle_id = v_cycle2_id and type_element_id = v_type_domaine and libelle = 'Francais';

  if v_francais_id is null then
    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, null, v_type_domaine, 'Francais', 1)
    returning id into v_francais_id;
  end if;

  select id into v_lecture_id from elements_programme
  where cycle_id = v_cycle2_id and parent_id = v_francais_id
    and type_element_id = v_type_sous_domaine and libelle = 'Lecture';

  if v_lecture_id is not null then
    raise notice 'Lecture (cycle 2, francais) deja importee -- rien a faire.';
    return;
  end if;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_francais_id, v_type_sous_domaine, 'Lecture', 1)
  returning id into v_lecture_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_lecture_id, v_type_sous_domaine, 'Cours preparatoire', 1)
  returning id into v_annee_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Identifier les mots de maniere de plus en plus aisee', 1)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, 'En fin de periode 1 : decoder et encoder 12 a 15 correspondances graphophonemiques (CGP) regulieres, frequentes et aisement prononcables ; dechiffrer des syllabes, des mots puis des phrases en fonction de la progression de l''apprentissage des CGP.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'L''eleve dechiffre les mots les plus reguliers selon la progression des CGP.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il automatise la lecture des mots frequents et transparents comme le, la, ami, rire, lune, etc.', 2);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, 'En milieu d''annee : decoder et encoder de 25 a 30 CGP ; avoir pris conscience de la presence de lettres finales muettes et s''appuyer sur le sens des mots pour les dechiffrer correctement ; memoriser les mots frequents et reguliers ; dechiffrer entre 15 et 30 mots par minute.', 2)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il lit et ecrit de nouveaux mots ou pseudo-mots en lien avec la progression des CGP.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il dechiffre tous les mots selon la progression des CGP et identifie les marques grammaticales en genre et en nombre.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il automatise la reconnaissance de mots qui ont des caracteristiques morphologiques communes : un prefixe, un radical ou un suffixe identiques.', 3);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, 'En fin d''annee : decoder 30 mots par minute au minimum fin CP, sans preparation, 50 apres preparation.', 3)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il lit des consignes, des phrases et de courts textes dechiffrables avec exactitude.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Lire a voix haute', 2)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, 'Des le debut de l''annee : oraliser les syllabes dechiffrees et encodees, puis les mots.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'L''eleve est capable de lire a voix haute des syllabes, des mots et de courtes phrases.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, 'En cours d''annee : oraliser regulierement les mots et phrases dechiffres et encodes ; s''entrainer a lire des textes dechiffrables de maniere a automatiser sa lecture.', 2)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il est capable de lire a voix haute un texte simple en faisant une courte pause a la fin des phrases.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, 'En fin d''annee : lire apres preparation un texte adapte a son niveau de lecture avec une vitesse de 30 mots par minute au minimum sans preparation, 50 apres preparation ; identifier les marques de ponctuation et les prendre en compte sur un texte prepare ; amorcer une lecture expressive.', 3)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Apres preparation, il repere les groupes de mots qui doivent etre lus ensemble en s''appuyant sur le sens et la chaine d''accords ; il en tient compte dans sa lecture a voix haute.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Apres preparation, il modifie sa voix pour faire parler tel ou tel personnage.', 2);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Comprendre un texte', 3)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, 'Degager le sens global d''un texte entendu ou lu de facon autonome ; identifier les mots inconnus dans un texte et chercher a leur donner un sens ; se reperer dans la chaine anaphorique ; comprendre ce qui est implicite (inferences simples) ; justifier ses reponses par un retour au texte ; lire et comprendre en autonomie un texte narratif, informatif ou prescriptif d''une dizaine de lignes.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'L''eleve est capable de construire une representation mentale au fur et a mesure que se deroule la lecture.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il construit la chronologie et identifie les lieux evoques dans un recit.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il repere les informations donnees dans un texte informatif simple relevant des differents champs disciplinaires.', 3);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il commence a s''appuyer sur le contexte pour elucider le sens des mots inconnus.', 4);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il est capable de realiser en autonomie une inference simple (contexte connu de l''eleve). Ex. : J''ai pris mon parapluie -> Le temps est pluvieux.', 5);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il cherche a comprendre les emotions des personnages en s''appuyant sur ses experiences personnelles, grace a un questionnement ouvert du professeur.', 6);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il verifie sa comprehension dans des echanges entre pairs et peut la reviser, le cas echeant, en retournant au texte.', 7);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Devenir lecteur', 4)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, 'Lire 5 a 10 oeuvres completes et variees issues du patrimoine et de la litterature de jeunesse (albums, romans, contes, fables, poemes, pieces de theatre et documentaires) ; reperer et reconnaitre des types de personnages ; aller vers les livres et etre capable d''en choisir a titre personnel ; relier ses lectures a son experience personnelle, etre en mesure d''etablir des liens entre ses differentes lectures (mise en reseau) ; frequenter regulierement des lieux de lecture.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'L''eleve est capable de caracteriser les personnages, de les comparer et de reconnaitre des types recurrents dans la litterature de jeunesse.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il differencie le type narratif du type informatif.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il est capable d''exprimer le lien entre deux lectures ou entre une lecture et sa propre experience.', 3);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il est capable de choisir un livre en fonction de ses propres centres d''interet.', 4);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_lecture_id, v_type_sous_domaine, 'Cours elementaire premiere annee', 2)
  returning id into v_annee_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Identifier les mots de maniere de plus en plus aisee', 1)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, 'Tout au long de l''annee : automatiser le decodage des correspondances graphophonemiques (CGP) apprises au CP. En fin d''annee : decoder toutes les CGP y compris les plus complexes ; avoir memorise l''ensemble des CGP dans tous les types d''ecriture ; identifier directement l''ensemble des mots courants et dechiffrer avec exactitude les mots nouveaux dont le decodage n''a pas encore ete automatise.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'L''eleve dechiffre et ecrit sous la dictee des syllabes et des pseudo-mots comportant des CGP courantes et d''autres plus complexes.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il lit des phrases contenant des morphemes grammaticaux et lexicaux muets de maniere fluide sans vocaliser les lettres muettes.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il lit des mots nouveaux en lien avec l''orthographe lexicale, il se sert de sa connaissance des graphemes pour etablir des listes analogiques de mots.', 3);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Lire a voix haute', 2)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, 'En fin d''annee : lire un texte adapte a son niveau de lecture avec une vitesse de 70 mots par minute ; lire des textes narratifs, documentaires et prescriptifs en respectant tous les signes de ponctuation et les groupes de souffle ; lire de maniere expressive.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'L''eleve s''entraine a la lecture a voix haute dans des seances specifiques : il repere la ponctuation et les groupes de mots qui doivent etre lus ensemble.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il lit apres preparation un texte simple en realisant les pauses adequates et en adoptant le ton et le rythme appropries au sens du texte.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il lit un texte en modifiant sa voix et sa cadence, en fonction du sens.', 3);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Comprendre un texte', 3)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, 'Degager le sens global d''un texte lu, de facon autonome, a la suite d''une seance dediee a la comprehension ; developper des strategies pour elucider le sens des mots et des expressions inconnus ; se reperer dans la chaine anaphorique et s''appuyer sur le sens du texte pour resoudre des ambiguites ; comprendre ce qui est implicite dans le texte (inferences) dans des cas simples ; justifier ses reponses par un retour au texte ; lire et comprendre en autonomie un texte narratif, informatif ou prescriptif d''une quinzaine de lignes.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'L''eleve restitue les enchainements logiques et chronologiques d''un recit.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il est capable d''expliciter les emotions des personnages.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il est capable de donner un titre au texte et de le resumer oralement.', 3);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il realise ce qui est demande dans le cas d''un texte prescriptif : une recette, l''application d''une regle du jeu, etc.', 4);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'L''eleve prend appui sur la morphologie d''un mot et/ou sur le contexte pour le comprendre.', 5);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il prend l''habitude de consulter un dictionnaire adapte et de relire en autonomie un texte ou un passage pour mieux le comprendre.', 6);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Devenir lecteur', 4)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, 'Lire 5 a 10 oeuvres completes et variees issues du patrimoine et de la litterature de jeunesse ; se familiariser aux differents genres et types de textes ; faire preuve d''initiative dans ses lectures personnelles en empruntant des livres en fonction de ses gouts ; relier ses lectures a son experience personnelle.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'L''eleve commence a ecrire a propos de ses lectures : il exprime ses gouts et preferences, est capable d''ecrire un bref resume ou d''inventer une autre fin.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il est capable, a l''oral, de presenter une lecture a ses camarades.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il reconnait, lors des lectures orales d''un adulte, les grandes caracteristiques d''un texte (conte, fable, poeme).', 3);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il se familiarise avec les lieux de lecture et developpe une autonomie dans le choix de ses lectures.', 4);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_lecture_id, v_type_sous_domaine, 'Cours elementaire deuxieme annee', 3)
  returning id into v_annee_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Identifier les mots de maniere de plus en plus aisee', 1)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, 'Avoir automatise toutes les correspondances graphophonemiques (CGP) ; lire un texte nouveau en s''appuyant sur un decodage rapide ; automatiser la lecture des mots ; reperer les lettres muettes et decoder les mots inconnus en conservant une vitesse de lecture correspondant aux objectifs de fin d''annee.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'L''eleve reconnait directement les mots frequents et irreguliers.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il utilise la voie graphophonologique pour lire des mots inconnus en conservant une fluidite de lecture.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il lit un texte avec fluidite sans vocaliser les lettres muettes et en faisant les liaisons appropriees.', 3);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Lire a voix haute', 2)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, 'Lire un texte adapte a son niveau de lecture avec une vitesse de 90 mots par minute ; lire un texte en respectant l''ensemble des marques de ponctuation et les liaisons ; manifester sa comprehension par une lecture expressive qui respecte la structure du texte, de la phrase et le sens.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'L''eleve est capable de lire une scene de theatre en incarnant un personnage et en jouant de l''expressivite de la ponctuation.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Comprendre un texte', 3)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, 'Lire et degager le sens d''un texte narratif, poetique, documentaire ou theatral, lu en autonomie ou lu par un adulte ; adopter une posture active par rapport au vocabulaire inconnu ; se reperer dans la chaine anaphorique et s''appuyer sur le sens du texte pour resoudre des ambiguites ; differencier le type narratif du type informatif et prescriptif ; comprendre ce qui est implicite en s''appuyant sur des indices explicites et sur ses propres connaissances ; lire et comprendre en autonomie un texte narratif, informatif ou prescriptif d''une vingtaine de lignes.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'L''eleve restitue les enchainements logiques et chronologiques d''un recit et identifie les evenements, les personnages et les lieux evoques.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il repere les informations donnees dans un texte informatif simple et verbalise ce que la lecture lui a permis d''apprendre.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il est capable de donner un titre au texte et de le resumer oralement.', 3);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il sait utiliser les sous-titres, titres de chapitres, mise en page en paragraphes, etc. pour mieux comprendre.', 4);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il est capable d''expliciter les emotions et ressorts psychologiques des personnages et explicite les inferences.', 5);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il prend appui sur le contexte et sur la morphologie pour elucider le sens des mots inconnus.', 6);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il commence a utiliser des strategies dans le cas d''une prise de conscience de non-comprehension : relecture, recherche dans le dictionnaire, recherche documentaire, etc.', 7);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Devenir lecteur', 4)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, 'Lire de maniere autonome 5 a 10 oeuvres completes et variees issues du patrimoine et de la litterature de jeunesse ; relier ses lectures a son experience personnelle, etre en mesure d''etablir des liens entre ses differentes lectures (mise en reseau) ; frequenter des lieux de lecture regulierement et rencontrer des acteurs du livre.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'L''eleve connait les caracteristiques de personnages-types de plus en plus diversifies ; il dispose de references construites sur des reseaux de textes.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il differencie les caracteristiques des genres et types les plus courants : poesie, theatre, recit (policier, d''aventure, etc.).', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il partage une culture commune autour de textes patrimoniaux adaptes a son age.', 3);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il consigne ses experiences de lecture dans un carnet de lecteur.', 4);

end $$;