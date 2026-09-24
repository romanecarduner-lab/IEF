-- Import du programme officiel Langues vivantes etrangeres et
-- regionales cycle 2 -- derniere matiere du cycle 2, celui-ci est
-- complet une fois cette migration collee. Vu la densite du texte
-- source, un exemple representatif est retenu par sous-competence
-- et par annee, plutot que la totalite des exemples du texte
-- officiel. Mediation CE1/CE2 et "Expliciter un message" ne sont
-- PAS inclus : le texte source s'est interrompu avant de les
-- couvrir, a completer dans une prochaine migration.

do $$
declare
  v_cycle2_id uuid;
  v_type_domaine uuid;
  v_type_sous_domaine uuid;
  v_type_objectif uuid;
  v_type_exemple uuid;
  v_langues_id uuid;
  v_activite_id uuid;
  v_annee_id uuid;
  v_theme_id uuid;
begin
  select id into v_cycle2_id from cycles where libelle = 'Cycle 2 (CP, CE1, CE2)';
  select id into v_type_domaine from types_element_programme where code = 'domaine';
  select id into v_type_sous_domaine from types_element_programme where code = 'sous_domaine';
  select id into v_type_objectif from types_element_programme where code = 'objectif';
  select id into v_type_exemple from types_element_programme where code = 'exemple_reussite';

  select id into v_langues_id from elements_programme
  where cycle_id = v_cycle2_id and type_element_id = v_type_domaine
    and libelle = U&'Langues vivantes \00E9trang\00E8res et r\00E9gionales';

  if v_langues_id is not null then
    raise notice 'Langues vivantes (cycle 2) deja importees -- rien a faire.';
    return;
  end if;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, null, v_type_domaine, U&'Langues vivantes \00E9trang\00E8res et r\00E9gionales', 10)
  returning id into v_langues_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_langues_id, v_type_sous_domaine, U&'Compr\00E9hension de l''oral : \00E9couter et comprendre', 1)
  returning id into v_activite_id;

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_activite_id, v_type_sous_domaine, U&'Cours pr\00E9paratoire', 1)
    returning id into v_annee_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Comprendre quelques mots familiers et expressions tr\00E8s courantes -- Rep\00E9rer quelques mots du champ lexical de la prise de contact ou des salutations. Reconnaitre les pronoms interrogatifs usuels.', 1)
      returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_exemple, U&'Dans le cadre des activit\00E9s ritualis\00E9es (accueil du matin, retour de r\00E9cr\00E9ation), l''\00E9l\00E8ve comprend les formules d''accueil et de salutation utilis\00E9es par le professeur (Hello! Goodbye! Thank you!).', 1);

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Suivre le fil d''une histoire adapt\00E9e \00E0 l''\00E2ge des \00E9l\00E8ves et suffisamment \00E9tay\00E9e -- Reconnaitre certaines lettres de l''alphabet et les chiffres. Reconnaitre des mots simples en s''appuyant sur les indices visuels et sonores.', 2)
      returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_exemple, U&'\00C0 partir d''une comptine num\00E9rique traditionnelle, l''\00E9l\00E8ve comprend les nombres \00E9nonc\00E9s et repr\00E9sente avec ses doigts les quantit\00E9s identifi\00E9es au fil de l''\00E9coute.', 1);

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Comprendre et agir -- Reconnaitre quelques formes courantes de l''imp\00E9ratif afin de r\00E9agir \00E0 des consignes et instructions simples accompagn\00E9es de gestes ou de supports visuels.', 3)
      returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_exemple, U&'Lors du jeu Simon Says, l''\00E9l\00E8ve \00E9coute les instructions donn\00E9es par le professeur et r\00E9alise l''action demand\00E9e (Simon says: Touch your nose. Clap your hands.).', 1);

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_activite_id, v_type_sous_domaine, U&'Cours \00E9l\00E9mentaire premi\00E8re ann\00E9e', 2)
    returning id into v_annee_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Comprendre quelques mots familiers et expressions tr\00E8s courantes -- Rep\00E9rer quelques mots du champ lexical de la prise de contact. Reconnaitre les pronoms interrogatifs usuels (Qui ? Que ? O\00F9 ? Comment ?).', 1)
      returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_exemple, U&'\00C0 partir de la chanson How''s the Weather de Carolyn Graham, l''\00E9l\00E8ve comprend les expressions indiquant le temps qu''il fait et d\00E9signe l''image correspondante.', 1);

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Suivre le fil d''une histoire adapt\00E9e \00E0 l''\00E2ge des \00E9l\00E8ves et suffisamment \00E9tay\00E9e -- Reconnaitre certaines lettres de l''alphabet et les nombres jusqu''\00E0 31 environ. Reconnaitre quelques structures grammaticales simples appartenant \00E0 un r\00E9pertoire m\00E9moris\00E9.', 2)
      returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_exemple, U&'\00C0 partir de l''\00E9coute de l''album One to Ten and Back Again, l''\00E9l\00E8ve rep\00E8re les objets pr\00E9sent\00E9s au fil de l''\00E9coute et les d\00E9signe (Four bright bows, Nine chocolate biscuits).', 1);

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Comprendre et agir -- Reconnaitre quelques formes courantes de l''imp\00E9ratif pour r\00E9agir \00E0 des consignes et instructions simples.', 3)
      returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_exemple, U&'Pour la confection de cr\00EApes \00E0 l''occasion du Pancake Day, l''\00E9l\00E8ve identifie les ingr\00E9dients \00E9nonc\00E9s puis suit les indications pour r\00E9aliser la p\00E2te (You need flour, eggs and milk. Take a bowl and put the flour in.).', 1);

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_activite_id, v_type_sous_domaine, U&'Cours \00E9l\00E9mentaire deuxi\00E8me ann\00E9e', 3)
    returning id into v_annee_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Comprendre quelques mots familiers et expressions tr\00E8s courantes -- Rep\00E9rer quelques mots du champ lexical de la prise de contact. Reconnaitre les pronoms interrogatifs usuels (Qui ? Que ? O\00F9 ? Quand ? Comment ?).', 1)
      returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_exemple, U&'\00C0 partir de l''\00E9coute de l''album What''s The Time, Mr. Wolf?, l''\00E9l\00E8ve comprend les expressions courantes li\00E9es \00E0 la routine quotidienne (It''s eight o''clock. Time for breakfast!).', 1);

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Suivre le fil d''une histoire adapt\00E9e \00E0 l''\00E2ge des \00E9l\00E8ves et suffisamment \00E9tay\00E9e -- Reconnaitre toutes les lettres de l''alphabet et les nombres jusqu''\00E0 100 environ. Reconnaitre quelques structures et formes grammaticales simples.', 2)
      returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_exemple, U&'Lors d''une s\00E9ance de calcul mental en langue \00E9trang\00E8re, l''\00E9l\00E8ve \00E9coute l''addition et \00E9crit la somme correspondante sur son ardoise (fifty-four plus nine equals...).', 1);

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Comprendre et agir -- Reconnaitre quelques formes courantes de l''imp\00E9ratif pour r\00E9agir \00E0 des consignes qui peuvent \00EAtre accompagn\00E9es de gestes et de supports visuels.', 3)
      returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_exemple, U&'L''\00E9l\00E8ve fabrique un petit livre en \00E9coutant et en observant les \00E9tapes \00E9nonc\00E9es (First, fold the paper in half. Then, fold it in half the other way.).', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_langues_id, v_type_sous_domaine, U&'Expression orale en continu : parler en continu', 2)
  returning id into v_activite_id;

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_activite_id, v_type_sous_domaine, U&'Cours pr\00E9paratoire', 1)
    returning id into v_annee_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Rep\00E8res phonologiques -- R\00E9aliser les sp\00E9cificit\00E9s phonologiques essentielles de la langue apprise.', 1)
      returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_exemple, U&'Lors d''un jeu de plateau sur le vocabulaire des animaux, l''\00E9l\00E8ve prononce le nom de l''animal au singulier ou au pluriel selon l''image sur laquelle il se trouve.', 1);

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Reproduire un mod\00E8le oral -- Parler de soi ou de son environnement familier en s''appuyant sur des supports visuels et en pronon\00E7ant correctement des formules br\00E8ves, ritualis\00E9es et m\00E9moris\00E9es.', 2)
      returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_exemple, U&'Lors d''un jeu de devinette de type Who Am I?, un \00E9l\00E8ve pioche une carte d''identit\00E9 et se d\00E9crit \00E0 partir de pictogrammes (I''m 6. My favourite colour is green.).', 1);

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Raconter -- Nommer, caract\00E9riser, d\00E9nombrer tr\00E8s simplement des personnes, des objets, des lieux.', 3)
      returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_exemple, U&'Lors d''un jeu en bin\00F4me, un \00E9l\00E8ve choisit une image parmi trois et la d\00E9crit pour que son bin\00F4me la pointe du doigt (Two big pens, one big book, two chairs).', 1);

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Se d\00E9crire en utilisant des expressions courtes ou proches des mod\00E8les rencontr\00E9s -- Exprimer simplement des informations sur soi et sur les autres.', 4)
      returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_exemple, U&'Lors de l''arriv\00E9e d''une nouvelle mascotte, les \00E9l\00E8ves se pr\00E9sentent tour \00E0 tour (Hello! My name''s Alice. I''m 6 years old. My favourite colour is purple.).', 1);

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_activite_id, v_type_sous_domaine, U&'Cours \00E9l\00E9mentaire premi\00E8re ann\00E9e', 2)
    returning id into v_annee_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Rep\00E8res phonologiques -- R\00E9aliser les sp\00E9cificit\00E9s phonologiques essentielles de la langue \00E9tudi\00E9e.', 1)
      returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_exemple, U&'Apr\00E8s avoir \00E9tudi\00E9 l''album One to Ten and Back Again, l''\00E9l\00E8ve r\00E9p\00E8te les \00E9l\00E9ments en se concentrant sur le pluriel des noms (one bow, four bows).', 1);

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Reproduire un mod\00E8le oral -- Parler de soi ou de son environnement familier en s''appuyant sur des supports visuels et en pronon\00E7ant correctement des formulations br\00E8ves ritualis\00E9es et m\00E9moris\00E9es.', 2)
      returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_exemple, U&'Le 17 mars, pour la Saint Patrick, les \00E9l\00E8ves apprennent une danse folklorique irlandaise ; un \00E9l\00E8ve meneur nomme les actions \00E0 r\00E9aliser (Turn around, hop, stamp your feet).', 1);

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Raconter -- Nommer, caract\00E9riser, d\00E9nombrer tr\00E8s simplement des personnes, des objets, des lieux, en mobilisant quelques mots ou champs lexicaux connus.', 3)
      returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_exemple, U&'Pour la webradio de l''\00E9cole, les \00E9l\00E8ves pr\00E9sentent les \00E9tapes d''une recette apprise par c\0153ur (First, we prepare three red apples. Then, we make a delicious pastry.).', 1);

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Se d\00E9crire en utilisant des expressions courtes ou proches des mod\00E8les rencontr\00E9s -- Exprimer simplement des informations sur soi et sur les autres, en utilisant et maitrisant le pr\00E9sent des verbes les plus courants.', 4)
      returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_exemple, U&'Lors d''\00E9changes de correspondance scolaire, les \00E9l\00E8ves se d\00E9crivent dans des enregistrements audio (My name''s Charlie, I live in Lyon, I''m seven years old.).', 1);

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_activite_id, v_type_sous_domaine, U&'Cours \00E9l\00E9mentaire deuxi\00E8me ann\00E9e', 3)
    returning id into v_annee_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Rep\00E8res phonologiques -- R\00E9aliser les sp\00E9cificit\00E9s phonologiques essentielles de la langue \00E9tudi\00E9e.', 1)
      returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_exemple, U&'\00C0 partir du chant Witches, Witches de Carolyn Graham, l''\00E9l\00E8ve s''exerce \00E0 prononcer le -s final marquant le pluriel selon les cas (/s/, /z/, /\026Az/).', 1);

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Reproduire un mod\00E8le oral -- Prononcer correctement des formulations br\00E8ves ritualis\00E9es et m\00E9moris\00E9es pour parler de soi ou de son environnement familier.', 2)
      returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_exemple, U&'Lors d''une s\00E9quence EPS sur le savoir rouler \00E0 v\00E9lo, les \00E9l\00E8ves d\00E9crivent l''\00E9quipement de leur v\00E9lo \00E0 l''aide d''une formulation m\00E9moris\00E9e (Look at my bike! It''s got a basket and a bell.).', 1);

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Raconter -- Nommer, caract\00E9riser, d\00E9nombrer tr\00E8s simplement des personnes, des objets, des lieux, en appliquant les r\00E8gles \00E9l\00E9mentaires de l''accord.', 3)
      returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_exemple, U&'Apr\00E8s avoir \00E9cout\00E9 l''album My Mum d''Anthony Browne, un \00E9l\00E8ve raconte ce qu''il en a compris (The mum is a gardener. The mum can sing. She''s really nice.).', 1);

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_objectif, U&'D\00E9crire ou se d\00E9crire en utilisant des expressions courtes ou proches des mod\00E8les rencontr\00E9s -- Exprimer simplement des informations sur soi et sur les autres, en utilisant et maitrisant le pr\00E9sent des verbes les plus courants.', 4)
      returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_exemple, U&'Une fois que l''assistant de langue s''est pr\00E9sent\00E9, les \00E9l\00E8ves de CE2 le d\00E9crivent (He''s from Ghana and he''s 25 years old. He speaks French and English.).', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_langues_id, v_type_sous_domaine, U&'Expression orale en interaction : r\00E9agir et dialoguer', 3)
  returning id into v_activite_id;

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_activite_id, v_type_sous_domaine, U&'Cours pr\00E9paratoire', 1)
    returning id into v_annee_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_objectif, U&'\00C9changer des informations simples -- Poser quelques questions simples \00E0 l''aide des pronoms interrogatifs. Utiliser les r\00E9ponses courtes.', 1)
      returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_exemple, U&'Lors de l''accueil d''un intervenant ext\00E9rieur, chaque \00E9l\00E8ve se pr\00E9sente (Hello, who are you? / I am Alice! / Hello, Alice! / Where are you from? / I am from Canada.).', 1);

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Exprimer des \00E9motions et formuler des souhaits \00E9l\00E9mentaires -- Exprimer son ressenti et ses souhaits de mani\00E8re tr\00E8s simple en utilisant une gestuelle ou des expressions du visage.', 2)
      returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_exemple, U&'Lors de l''accueil en classe, les \00E9l\00E8ves r\00E9pondent \00E0 leur professeur en associant un geste (How are you today? / I''m happy.).', 1);

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Clarifier ou faire clarifier un point -- Indiquer tr\00E8s simplement \00E0 un interlocuteur que l''on n''a pas compris en utilisant au besoin une gestuelle ou des expressions du visage.', 3)
      returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_exemple, U&'Lors d''un jeu de loto sur les animaux, les \00E9l\00E8ves jouent par groupe (Kangaroo... / Repeat, please. / Kangaroo!).', 1);

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Utiliser des proc\00E9d\00E9s tr\00E8s simples pour commencer, poursuivre et terminer une conversation br\00E8ve -- Utiliser des formules de salutation tr\00E8s simples et adapt\00E9es \00E0 son interlocuteur pour ouvrir ou clore un \00E9change.', 4)
      returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_exemple, U&'Lors de la Semaine des langues, les \00E9l\00E8ves saluent les personnels de l''\00E9cole ou leur disent au revoir dans la langue apprise (Hello! Good morning! / Goodbye! See you soon!).', 1);

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_activite_id, v_type_sous_domaine, U&'Cours \00E9l\00E9mentaire premi\00E8re ann\00E9e', 2)
    returning id into v_annee_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_objectif, U&'\00C9changer des informations simples -- Poser quelques questions simples \00E0 l''aide d''une gamme tr\00E8s r\00E9duite de pronoms interrogatifs.', 1)
      returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_exemple, U&'\00C0 partir de cartes d''identit\00E9 d''\00E9l\00E8ves vivant dans diff\00E9rentes villes du monde, un \00E9l\00E8ve en interroge un autre (What''s your name? / My name''s Billy. / Where do you live? / I live in Boston.).', 1);

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Exprimer des \00E9motions et formuler des souhaits \00E9l\00E9mentaires -- Exprimer son ressenti et ses souhaits de mani\00E8re tr\00E8s simple en utilisant des blocs lexicalis\00E9s, une gestuelle ou les expressions du visage.', 2)
      returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_exemple, U&'Lors d''un rituel, un \00E9l\00E8ve demande \00E0 son bin\00F4me comment il va, celui-ci tire une carte et exprime l''\00E9motion repr\00E9sent\00E9e (How are you today? / I''m very happy today.).', 1);

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Clarifier ou faire clarifier un point -- Indiquer tr\00E8s simplement qu''il n''a pas compris en utilisant au besoin la gestuelle ou les expressions du visage.', 3)
      returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_exemple, U&'Lors d''une s\00E9ance d''initiation \00E0 la programmation, les \00E9l\00E8ves guident un \00E9l\00E8ve robot dans un espace mat\00E9rialis\00E9 par des plots (Two steps forward. / Three? Can you repeat, please?).', 1);

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Utiliser des proc\00E9d\00E9s tr\00E8s simples pour commencer, poursuivre et terminer une conversation br\00E8ve -- Utiliser des formules de salutation tr\00E8s simples et adapt\00E9es \00E0 son interlocuteur, en situation connue et r\00E9p\00E9t\00E9e, pour ouvrir ou clore un \00E9change.', 4)
      returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_exemple, U&'\00C0 l''occasion de la Semaine des langues, les \00E9l\00E8ves se saluent ou prennent cong\00E9 en adaptant la formule au moment de la journ\00E9e (Good morning! / Good afternoon! / See you on Thursday.).', 1);

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_activite_id, v_type_sous_domaine, U&'Cours \00E9l\00E9mentaire deuxi\00E8me ann\00E9e', 3)
    returning id into v_annee_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_objectif, U&'\00C9changer des informations simples -- Poser quelques questions simples \00E0 l''aide d''une gamme tr\00E8s r\00E9duite de pronoms interrogatifs.', 1)
      returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_exemple, U&'Dans le cadre d''un projet autour de l''album What''s the Time, Mr Wolf?, les \00E9l\00E8ves jouent au jeu traditionnel du m\00EAme nom (What time is it, Mister Wolf? / It''s three o''clock! Let''s move three steps!).', 1);

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Exprimer des \00E9motions et formuler des souhaits \00E9l\00E9mentaires -- Exprimer son ressenti et ses souhaits de mani\00E8re tr\00E8s simple en utilisant des blocs lexicalis\00E9s, une gestuelle ou les expressions du visage.', 2)
      returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_exemple, U&'Lors de la visite virtuelle d''un mus\00E9e d''histoire naturelle, les \00E9l\00E8ves expriment leurs \00E9motions (Look at the skeleton of the whale. It''s fascinating!).', 1);

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Clarifier ou faire clarifier un point -- Indiquer tr\00E8s simplement qu''il n''a pas compris en utilisant au besoin la gestuelle ou les expressions du visage. Connaitre et prononcer toutes les lettres de l''alphabet pour \00E9peler un mot.', 3)
      returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_exemple, U&'Lors d''une vid\00E9o de pr\00E9sentation \00E0 leurs correspondants, chaque \00E9l\00E8ve se pr\00E9sente et \00E9p\00E8le son pr\00E9nom (Hello, my name''s Nicolas! N.I.C.O.L.A.S).', 1);

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Utiliser des proc\00E9d\00E9s tr\00E8s simples pour commencer, poursuivre et terminer une conversation br\00E8ve -- Utiliser des formules de salutation tr\00E8s simples et adapt\00E9es \00E0 son interlocuteur en situation connue et r\00E9p\00E9t\00E9e pour ouvrir ou clore un \00E9change.', 4)
      returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_exemple, U&'\00C0 partir du plan d''une grande ville o\00F9 est parl\00E9e la langue apprise, les \00E9l\00E8ves jouent une sayn\00E8te pour demander leur chemin (Can you tell me the way to the British Museum? / Go straight ahead and then turn left.).', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_langues_id, v_type_sous_domaine, U&'Compr\00E9hension de l''\00E9crit : lire et comprendre', 4)
  returning id into v_activite_id;

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_activite_id, v_type_sous_domaine, U&'Cours \00E9l\00E9mentaire deuxi\00E8me ann\00E9e', 1)
    returning id into v_annee_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Reconnaitre des mots ou des messages \00E9crits familiers -- S''appuyer sur les mots familiers d\00E8s lors qu''ils ont fait l''objet d''un travail d''appropriation des correspondances graphophon\00E9miques.', 1)
      returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_exemple, U&'\00C0 partir d''une carte postale fictive envoy\00E9e depuis l''Australie par la mascotte de la classe, l''\00E9l\00E8ve rep\00E8re le nom des animaux observ\00E9s (I can see kangaroos, koalas, snakes and crocodiles.).', 1);

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Trouver des informations dans des \00E9crits tr\00E8s simples -- Trouver des informations simples et famili\00E8res en s''appuyant sur les indices visuels ainsi que sur les mots familiers et les \00E9l\00E9ments mis en avant dans le titre du texte.', 2)
      returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_exemple, U&'\00C0 partir d''un prospectus pr\00E9sentant les activit\00E9s de la f\00EAte de l''\00E9cole, l''\00E9l\00E8ve rep\00E8re et s\00E9lectionne les ateliers qu''il souhaite r\00E9aliser (Make a card for your friend. Learn a song.).', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_langues_id, v_type_sous_domaine, U&'Expression \00E9crite : \00E9crire et r\00E9agir \00E0 l''\00E9crit', 5)
  returning id into v_activite_id;

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_activite_id, v_type_sous_domaine, U&'Cours \00E9l\00E9mentaire deuxi\00E8me ann\00E9e', 1)
    returning id into v_annee_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_objectif, U&'\00C9peler, recopier ou \00E9crire des \00E9l\00E9ments connus -- Recopier dans son cahier la date du jour, des \00E9tiquettes-mots et des \00E9l\00E9ments \00E9crits au tableau, pr\00E9lev\00E9s dans un texte court.', 1)
      returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_exemple, U&'Lors des activit\00E9s ritualis\00E9es, les \00E9l\00E8ves copient dans leur cahier la date du jour en langue \00E9trang\00E8re \00E0 partir des \00E9l\00E9ments affich\00E9s dans l''espace langues de la classe.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_langues_id, v_type_sous_domaine, U&'M\00E9diation', 6)
  returning id into v_activite_id;

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_activite_id, v_type_sous_domaine, U&'Cours pr\00E9paratoire', 1)
    returning id into v_annee_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Identifier les rep\00E8res culturels -- Mobiliser le champ lexical des besoins \00E9l\00E9mentaires \00E0 l''aide de mots isol\00E9s, si n\00E9cessaire accompagn\00E9s de gestes.', 1)
      returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_exemple, U&'Lors d''une s\00E9ance d''EPS, un \00E9l\00E8ve explique pourquoi son camarade n''y participe pas (Charlie''s sick!).', 1);

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Animer un travail collectif, coop\00E9rer et contribuer \00E0 des \00E9changes interculturels -- Utiliser des consignes \00E9l\00E9mentaires accompagn\00E9es de gestes. Exprimer sa compr\00E9hension ou son accord par des expressions simples.', 2)
      returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_exemple, U&'Lors d''une pause active, un \00E9l\00E8ve meneur de jeu indique \00E0 un camarade les actions \00E0 r\00E9aliser et les valide (Jump! Yes! Well done!).', 1);

  raise notice 'Langues vivantes (cycle 2) importees -- cycle 2 complet (hors mediation CE1/CE2).';
end $$;