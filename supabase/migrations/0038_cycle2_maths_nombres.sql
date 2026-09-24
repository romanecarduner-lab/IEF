-- Import du programme officiel cycle 2 -- Mathematiques > Nombres,
-- calcul et resolution de problemes (BO du 31 octobre 2024,
-- ensel135_annexe4.pdf). Premier des 4 grands domaines des
-- mathematiques cycle 2. Les exemples les plus dependants de schemas
-- visuels sont resumes plutot que retranscrits caractere pour
-- caractere ; le contenu mathematique et pedagogique de fond reste
-- fidele au texte officiel. Accents correctement encodes en U&''.

do $$
declare
  v_cycle2_id uuid;
  v_type_domaine uuid;
  v_type_sous_domaine uuid;
  v_type_objectif uuid;
  v_type_exemple uuid;
  v_maths_id uuid;
  v_domaine_id uuid;
  v_annee_id uuid;
  v_theme_id uuid;
  v_objectif_id uuid;
begin
  select id into v_cycle2_id from cycles where libelle = 'Cycle 2 (CP, CE1, CE2)';

  select id into v_type_domaine from types_element_programme where code = 'domaine';
  select id into v_type_sous_domaine from types_element_programme where code = 'sous_domaine';
  select id into v_type_objectif from types_element_programme where code = 'objectif';
  select id into v_type_exemple from types_element_programme where code = 'exemple_reussite';

  -- Domaine "Mathematiques" : cree seulement s'il n'existe pas deja
  -- (les autres sous-domaines -- Grandeurs et mesures, Espace et
  -- geometrie, Organisation et gestion de donnees -- viendront s'y
  -- ajouter dans des migrations suivantes).
  select id into v_maths_id from elements_programme
  where cycle_id = v_cycle2_id and type_element_id = v_type_domaine
    and libelle = U&'Math\00E9matiques';

  if v_maths_id is null then
    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, null, v_type_domaine, U&'Math\00E9matiques', 2)
    returning id into v_maths_id;
  end if;

  select id into v_domaine_id from elements_programme
  where cycle_id = v_cycle2_id and parent_id = v_maths_id
    and type_element_id = v_type_sous_domaine and libelle = U&'Nombres, calcul et r\00E9solution de probl\00E8mes';

  if v_domaine_id is not null then
    raise notice 'Nombres, calcul et resolution de problemes (cycle 2) deja importe -- rien a faire.';
    return;
  end if;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_maths_id, v_type_sous_domaine, U&'Nombres, calcul et r\00E9solution de probl\00E8mes', 1)
  returning id into v_domaine_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_domaine_id, v_type_sous_domaine, U&'Cours pr\00E9paratoire', 1)
  returning id into v_annee_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Les nombres entiers', 1)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Comparer et d\00E9nombrer des collections en les organisant. Construire des collections de cardinal donn\00E9. Connaitre la suite \00E9crite et la suite orale des nombres jusqu''\00E0 cent. Connaitre et utiliser diverses repr\00E9sentations d''un nombre et passer de l''une \00E0 l''autre. Connaitre la valeur des chiffres en fonction de leur position (unit\00E9s, dizaines).', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Face \00E0 une collection compos\00E9e de trois barres de dix cubes et quatre cubes isol\00E9s, l''\00E9l\00E8ve reconnait qu''il y a trente-quatre cubes et verbalise : trois dizaines et quatre unit\00E9s, cela fait trente-quatre.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait compter, \00E0 l''oral et \00E0 l''\00E9crit, de un en un, de deux en deux et de dix en dix en partant de n''importe quel nombre, y compris \00E0 rebours.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait \00E9crire en chiffres un nombre dict\00E9 et lire un nombre \00E9crit en chiffres.', 3);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait associer diff\00E9rentes repr\00E9sentations d''un m\00EAme nombre : mat\00E9riel manipul\00E9, \00E9criture en chiffres (35), nom \00E0 l''oral (trente-cinq), \00E9criture en unit\00E9s de num\00E9ration (trois dizaines et cinq unit\00E9s), d\00E9composition additive (30 + 5), \00E9criture en lettres.', 4);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait expliquer, en s''appuyant sur la num\00E9ration, pourquoi 23 n''est pas le m\00EAme nombre que 32 bien que les \00E9critures des deux nombres soient compos\00E9es des m\00EAmes chiffres.', 5);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Comparer, encadrer, intercaler des nombres entiers en utilisant les symboles =, < et >. Ordonner des nombres dans l''ordre croissant ou d\00E9croissant. Savoir placer des nombres sur une demi-droite gradu\00E9e de un en un.', 2)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve comprend et utilise les expressions : \00E9gal \00E0, autant que, plus que, plus grand que, moins que, plus petit que.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait comparer deux nombres en prenant appui sur des repr\00E9sentations de collections, et placer le symbole qui convient (= ou < ou >) entre deux nombres.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait ordonner cinq nombres dans l''ordre croissant et dans l''ordre d\00E9croissant.', 3);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait associer un nombre \00E0 un point sur une demi-droite gradu\00E9e, en faisant le lien avec la distance qui s\00E9pare ce point de l''origine du rep\00E8re.', 4);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Connaitre les nombres ordinaux jusqu''\00E0 vingti\00E8me. Rep\00E9rer un rang ou une position dans une file orient\00E9e ou dans une liste d''objets ou de personnes. Faire le lien entre le rang d''un objet dans une liste et le nombre d''\00E9l\00E9ments qui le pr\00E9c\00E8dent. Utiliser les nombres ordinaux dans le cadre de l''\00E9tude de suites de symboles, de formes, de lettres ou de nombres.', 3)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve utilise les nombres ordinaux pour indiquer une position dans une liste ou une file d''attente : la voiture blanche est la quatri\00E8me voiture.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait rep\00E9rer le nombre qui occupe une position donn\00E9e dans une liste de nombres, et \00E9noncer le rang d''un nombre donn\00E9.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait r\00E9pondre \00E0 des questions sur des suites r\00E9p\00E9titives (ex. dans la suite ABABAB..., quelle est la dix-neuvi\00E8me lettre ?).', 3);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Les quatre op\00E9rations', 2)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Comprendre le sens de l''addition et de la soustraction. Comprendre et utiliser les symboles +, - et =.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve montre sa compr\00E9hension du sens de l''addition et de la soustraction lors de la r\00E9solution de probl\00E8mes.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'La soustraction est comprise comme l''op\00E9ration inverse de l''addition : 32 + 15 = 47, donc 47 - 32 = 15 et 47 - 15 = 32.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve comprend que l''ordre des termes n''a pas d''importance pour l''addition, mais qu''il n''en est pas de m\00EAme pour la soustraction.', 3);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait que le symbole = ne peut \00EAtre plac\00E9 qu''entre deux termes \00E9gaux.', 4);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Poser et effectuer des additions en colonnes.', 2)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait poser une addition de deux ou trois nombres \00E0 un ou deux chiffres, en positionnant les unit\00E9s sous les unit\00E9s et les dizaines sous les dizaines, et en calculer le r\00E9sultat.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Comprendre le sens de la multiplication.', 3)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve montre sa compr\00E9hension du sens de la multiplication lors de la r\00E9solution de probl\00E8mes.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve comprend et utilise le mot fois dans le cadre d''additions it\00E9r\00E9es : pour trois paquets de vingt biscuits, il dit trois fois vingt biscuits et \00E9crit 20 + 20 + 20.', 2);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'M\00E9moriser des faits num\00E9riques', 3)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Connaitre dans les deux sens les tables d''addition.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait donner oralement et par \00E9crit l''un des trois nombres d''une \00E9galit\00E9 du type A + B = C, o\00F9 A et B sont compris entre 0 et 10. \00C0 la fin du CP, il peut compl\00E9ter huit \00E9galit\00E9s \00E0 trou de ce type en une minute.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Connaitre les doubles et les moiti\00E9s de nombres usuels.', 2)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait donner oralement ou par \00E9crit les doubles des nombres de 1 \00E0 10 et des dizaines enti\00E8res 20, 30, 40, 50, ainsi que les moiti\00E9s des nombres pairs de 2 \00E0 20 et des dizaines enti\00E8res 40, 60, 80, 100.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Utiliser ses connaissances en num\00E9ration pour calculer mentalement', 4)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Ajouter ou soustraire 1 ou 2 \00E0 un nombre. Ajouter ou soustraire 10 \00E0 un nombre. Ajouter ou soustraire 20, 30, 40, 50, 60, 70, 80 ou 90 \00E0 un nombre.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait que, pour ajouter 1 \00E0 un nombre, il peut \00E9noncer le nombre qui vient juste apr\00E8s dans la suite \00E9crite des nombres.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait qu''ajouter ou soustraire 10 \00E0 un nombre, c''est ajouter ou soustraire une dizaine. Par exemple pour 37 - 10, il enl\00E8ve une dizaine aux trois dizaines, ce qui donne 27.', 2);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Apprendre des proc\00E9dures de calcul mental', 5)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Trouver le compl\00E9ment d''un nombre \00E0 la dizaine sup\00E9rieure. Ajouter un nombre inf\00E9rieur \00E0 9 \00E0 un nombre. Ajouter 9 \00E0 un nombre. Ajouter deux nombres inf\00E9rieurs \00E0 100. D\00E9terminer la moiti\00E9 d''un nombre pair. Soustraire un nombre inf\00E9rieur \00E0 10 \00E0 un nombre entier de dizaines.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Pour trouver le compl\00E9ment de 74 \00E0 la dizaine sup\00E9rieure, l''\00E9l\00E8ve dit : 74, c''est 7 dizaines et 4 unit\00E9s, le compl\00E9ment \00E0 10 de 4 est 6, il faut donc ajouter 6 unit\00E9s.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Pour ajouter 9 \00E0 un nombre, l''\00E9l\00E8ve sait qu''il peut ajouter 10 puis soustraire 1.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Pour d\00E9terminer la moiti\00E9 de 46, l''\00E9l\00E8ve d\00E9compose : 46 = 40 + 6, la moiti\00E9 de 40 est 20, la moiti\00E9 de 6 est 3, donc 20 + 3 = 23.', 3);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'La r\00E9solution de probl\00E8mes', 6)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'R\00E9soudre des probl\00E8mes additifs en une \00E9tape du type parties-tout.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait r\00E9soudre des probl\00E8mes de parties-tout en une \00E9tape en s''appuyant, tant que des proc\00E9dures de calcul ne sont pas disponibles, sur des manipulations d''objets tangibles ou des repr\00E9sentations sch\00E9matiques.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Exemple : L\00E9a a 53 euros dans son portemonnaie. Elle ach\00E8te un livre \00E0 7 euros. Combien lui reste-t-il ?', 2);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'R\00E9soudre des probl\00E8mes additifs en deux \00E9tapes (champ num\00E9rique inf\00E9rieur ou \00E9gal \00E0 30).', 2)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Exemple : il y avait 29 enfants dans un bus. Au premier arr\00EAt, 12 enfants sont descendus. Au deuxi\00E8me arr\00EAt, 7 enfants sont mont\00E9s. Combien y a-t-il d''enfants dans le bus maintenant ?', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'R\00E9soudre des probl\00E8mes multiplicatifs en une \00E9tape (champ num\00E9rique inf\00E9rieur ou \00E9gal \00E0 30), y compris des probl\00E8mes de partage \00E9quitable (recherche du nombre de parts ou de la valeur d''une part).', 3)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait r\00E9soudre des probl\00E8mes multiplicatifs consistant \00E0 rechercher la valeur d''un tout compos\00E9 de plusieurs parties de m\00EAme valeur, en s''appuyant si besoin sur des manipulations d''objets tangibles.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Exemple : trois enfants se partagent 18 images, chacun doit avoir le m\00EAme nombre d''images, combien d''images aura chaque enfant ?', 2);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_domaine_id, v_type_sous_domaine, U&'Cours \00E9l\00E9mentaire premi\00E8re ann\00E9e', 2)
  returning id into v_annee_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Les nombres entiers', 1)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'D\00E9nombrer des collections en les organisant. Construire des collections de cardinal donn\00E9. Connaitre et utiliser la relation entre unit\00E9s et dizaines, entre dizaines et centaines, entre unit\00E9s et centaines.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve d\00E9nombre des collections en utilisant des groupes de dix ou de cent, y compris quand une unit\00E9 de num\00E9ration d\00E9passe dix (ex. 9 dizaines, 23 unit\00E9s et 4 centaines).', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait r\00E9soudre un probl\00E8me comme : j''ai besoin de 235 timbres, vendus par plaques de cent, carnets de dix ou \00E0 l''unit\00E9 ; propose quatre commandes diff\00E9rentes permettant d''obtenir exactement ce nombre.', 2);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Connaitre la suite \00E9crite et la suite orale des nombres jusqu''\00E0 mille. Connaitre et utiliser diverses repr\00E9sentations d''un nombre et passer de l''une \00E0 l''autre. Connaitre la valeur des chiffres en fonction de leur position dans un nombre.', 2)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait \00E9crire en chiffres un nombre dict\00E9, le lire, et l''\00E9crire en lettres.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve comprend et utilise diff\00E9rentes \00E9critures possibles pour un m\00EAme nombre : mat\00E9riel (six plaques, trois barres, cinq cubes), \00E9criture en chiffres (635), nom \00E0 l''oral, \00E9critures en unit\00E9s de num\00E9ration, d\00E9composition du type (6 x 100) + (3 x 10) + (5 x 1), d\00E9composition additive 600 + 30 + 5, \00E9criture en lettres.', 2);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Comparer, encadrer, intercaler des nombres entiers en utilisant les symboles =, < et >. Ordonner des nombres dans l''ordre croissant ou d\00E9croissant. Savoir placer des nombres sur une demi-droite gradu\00E9e.', 3)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait ordonner dans l''ordre croissant ou d\00E9croissant un ensemble pouvant aller jusqu''\00E0 cinq nombres.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait intercaler et positionner des nombres manquants sur une bande num\00E9rique lacunaire.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait faire le lien entre le nombre associ\00E9 \00E0 un point et la distance entre ce point et l''origine de la demi-droite, en lien avec la mesure de longueurs \00E0 l''aide d''une r\00E8gle gradu\00E9e.', 3);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Connaitre les nombres ordinaux jusqu''\00E0 cent. Rep\00E9rer un rang ou une position dans une file orient\00E9e ou une liste. Utiliser les nombres ordinaux dans le cadre de suites de symboles, de lettres ou de nombres, y compris des suites \00E9volutives.', 4)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Dans une \00E9tape du Tour de France parcourue par 167 cyclistes, l''\00E9l\00E8ve sait dire combien de cyclistes sont arriv\00E9s avant le quarante-huiti\00E8me coureur.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait r\00E9pondre \00E0 des questions sur des suites \00E9volutives, par exemple dans la suite 1, 2, 4, 7, 11, 16..., quel est le onzi\00E8me nombre ?', 2);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Les fractions', 2)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Savoir interpr\00E9ter, repr\00E9senter, \00E9crire et lire les fractions 1/2, 1/3, 1/4, 1/5, 1/6, 1/8 et 1/10.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve comprend que la fraction 1/8 d''une ficelle, d''une bande de papier ou d''une figure correspond \00E0 une part du tout lors du partage de ce tout en huit parts \00E9gales.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait partager le contenu d''une bouteille d''eau en quatre parts \00E9gales dans quatre verres et dire qu''il y a un quart du contenu de la bouteille dans chaque verre.', 2);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Savoir interpr\00E9ter, repr\00E9senter, \00E9crire et lire des fractions inf\00E9rieures ou \00E9gales \00E0 1, avec un d\00E9nominateur \00E9gal \00E0 2, 3, 4, 5, 6, 8 ou 10.', 2)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait que trois huiti\00E8mes s''\00E9crit 3/8 et correspond \00E0 trois parts d''un tout partag\00E9 en huit parts \00E9gales.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait expliquer pourquoi 5/5 = 1.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait qu''\00E0 partir d''un tout donn\00E9, une m\00EAme fraction peut \00EAtre repr\00E9sent\00E9e de diff\00E9rentes mani\00E8res.', 3);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Connaitre et utiliser les mots d\00E9nominateur et num\00E9rateur. Comparer des fractions ayant le m\00EAme d\00E9nominateur. Comparer des fractions dont le num\00E9rateur est 1.', 3)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait que le d\00E9nominateur indique le nombre total de parts \00E9gales et le num\00E9rateur le nombre de parts colori\00E9es.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait dire et expliquer pourquoi 1/5 est plus petit que 1/3, en s''appuyant sur deux partages distincts d''un m\00EAme tout.', 2);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Additionner et soustraire des fractions de m\00EAme d\00E9nominateur.', 4)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait calculer 2/3 - 1/3 ou 1/5 + 2/5, en s''appuyant sur des manipulations, des repr\00E9sentations et la verbalisation.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait trouver le compl\00E9ment d''une fraction d''un tout par rapport \00E0 ce tout.', 2);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Les quatre op\00E9rations', 3)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Poser et effectuer des additions et des soustractions en colonnes.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait poser une addition de deux ou trois nombres \00E0 un, deux ou trois chiffres et en calculer le r\00E9sultat.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve connait un algorithme de soustraction pos\00E9e (par cassage ou par compensation).', 2);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Comprendre et utiliser le symbole x. Comprendre et savoir que la multiplication est commutative.', 2)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Pour le probl\00E8me Jan a sept paquets de biscuits, vingt biscuits par paquet, l''\00E9l\00E8ve dit Jan a sept fois vingt biscuits et \00E9crit 7 x 20 biscuits = 140 biscuits.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve constate qu''un potager de huit colonnes de quatre salades peut aussi \00EAtre vu comme quatre rang\00E9es de huit salades, et g\00E9n\00E9ralise : l''ordre des facteurs n''a pas d''importance dans une multiplication.', 2);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Connaitre la notion de parit\00E9 d''un nombre.', 3)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait dire si un nombre est pair ou impair, et donner tous les nombres pairs compris entre deux bornes.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'M\00E9moriser des faits num\00E9riques', 4)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Connaitre dans les deux sens les tables d''addition et les tables de multiplication. Connaitre des faits multiplicatifs usuels (doubles et moiti\00E9s \00E9tendus, multiples de 25).', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'\00C0 la fin du CE1, l''\00E9l\00E8ve peut compl\00E9ter douze \00E9galit\00E9s \00E0 trou d''addition, et huit de multiplication, en une minute.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve connait les multiples de 25 : 1 x 25 = 25, 2 x 25 = 50, 3 x 25 = 75, 4 x 25 = 100.', 2);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Utiliser ses connaissances en num\00E9ration pour calculer mentalement', 5)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Ajouter ou soustraire un nombre entier de dizaines ou de centaines \00E0 un nombre. Multiplier par 10 un nombre inf\00E9rieur \00E0 100.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve s''appuie sur la num\00E9ration pour effectuer rapidement et mentalement des calculs comme 234 + 60 ou 354 + 500.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait que, lors d''une multiplication par 10, chaque chiffre du nombre initial prend une valeur dix fois plus grande.', 2);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Apprendre des proc\00E9dures de calcul mental', 6)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Ajouter 9, 19 ou 29 \00E0 un nombre. Soustraire 9 \00E0 un nombre. Soustraire un nombre inf\00E9rieur \00E0 9 \00E0 un nombre. D\00E9terminer la moiti\00E9 d''un nombre pair. Calculer le produit d''un nombre compris entre 11 et 19 par un nombre inf\00E9rieur \00E0 10 en d\00E9composant le plus grand des deux facteurs.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait ajouter 9, 19 ou 29 \00E0 un nombre en ajoutant 10, 20 ou 30 puis en retranchant 1.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait verbaliser : 13 fois 7, c''est 10 fois 7 plus 3 fois 7, soit 70 + 21 = 91.', 2);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'La r\00E9solution de probl\00E8mes', 7)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'R\00E9soudre des probl\00E8mes additifs en une \00E9tape de type parties-tout, avec appui possible sur un sch\00E9ma en barre.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Exemple : dans mes deux coffres, j''ai 227 billes, j''en ai 113 dans mon coffre vert, combien en ai-je dans mon coffre rouge ?', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'R\00E9soudre des probl\00E8mes additifs de comparaison en une \00E9tape.', 2)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Exemple : L\00E9o a 188 billes, Lucie en a 75 de plus que L\00E9o, combien Lucie a-t-elle de billes ?', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'R\00E9soudre des probl\00E8mes additifs en deux \00E9tapes.', 3)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Exemple : \00E0 la p\00E2tisserie, madame Martin ach\00E8te une tarte \00E0 17 euros et un g\00E2teau \00E0 26 euros, elle donne un billet de 50 euros, combien la vendeuse va-t-elle lui rendre ?', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'R\00E9soudre des probl\00E8mes multiplicatifs en une \00E9tape, y compris de partage \00E9quitable (recherche du nombre de parts ou de la valeur d''une part).', 4)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Exemple : il y a 60 \00E9l\00E8ves en CE1, le professeur constitue des \00E9quipes de 5 \00E9l\00E8ves, combien y aura-t-il d''\00E9quipes ?', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'R\00E9soudre des probl\00E8mes mixtes en deux \00E9tapes (une \00E9tape additive et une \00E9tape multiplicative).', 5)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Exemple : Abi ach\00E8te sept litres d''huile \00E0 deux euros le litre et donne vingt euros au vendeur, combien le vendeur va-t-il lui rendre ?', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_domaine_id, v_type_sous_domaine, U&'Cours \00E9l\00E9mentaire deuxi\00E8me ann\00E9e', 3)
  returning id into v_annee_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Les nombres entiers', 1)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'D\00E9nombrer des collections. Construire des collections de cardinal donn\00E9. Connaitre et utiliser les relations entre les unit\00E9s de num\00E9ration jusqu''\00E0 dix-mille.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait r\00E9soudre un probl\00E8me comme : une entreprise a besoin de 1235 filtres \00E0 air, vendus uniquement par lots de cent, combien de lots doit-elle acheter pour en avoir suffisamment ?', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Connaitre la suite \00E9crite et la suite orale des nombres jusqu''\00E0 dix-mille. Connaitre et utiliser diverses repr\00E9sentations d''un nombre. Connaitre la valeur des chiffres en fonction de leur position dans un nombre.', 2)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve comprend et utilise diff\00E9rentes \00E9critures possibles pour un m\00EAme nombre : mat\00E9riel de num\00E9ration, \00E9criture en chiffres (4635), nom \00E0 l''oral, \00E9critures en unit\00E9s de num\00E9ration, d\00E9composition multiplicative et additive, \00E9criture en lettres.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Comparer, encadrer, intercaler des nombres entiers en utilisant les symboles =, < et >. Ordonner des nombres dans l''ordre croissant ou d\00E9croissant. Savoir placer des nombres sur une demi-droite gradu\00E9e.', 3)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait ordonner dans l''ordre croissant ou d\00E9croissant un ensemble pouvant aller jusqu''\00E0 cinq nombres, et placer un nombre sur une portion de demi-droite gradu\00E9e de un en un, de dix en dix, de cent en cent ou de mille en mille.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Les fractions', 2)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Savoir \00E9tablir des \00E9galit\00E9s de fractions inf\00E9rieures ou \00E9gales \00E0 1.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait expliquer pourquoi six huiti\00E8mes d''un tout est \00E9gal \00E0 trois quarts de ce tout, en s''appuyant sur des manipulations et des repr\00E9sentations g\00E9om\00E9triques.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Partager une unit\00E9 de longueur en fractions d''unit\00E9 et mesurer des longueurs non enti\00E8res par rapport \00E0 cette unit\00E9.', 2)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Une unit\00E9 de longueur \00E9tant donn\00E9e, l''\00E9l\00E8ve sait construire par pliage une r\00E8gle gradu\00E9e en quarts d''unit\00E9.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait mesurer des longueurs de bandes ou de segments en utilisant une r\00E8gle gradu\00E9e en fractions d''unit\00E9.', 2);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Comparer des fractions inf\00E9rieures \00E0 1 (m\00EAme d\00E9nominateur, m\00EAme num\00E9rateur, ou d\00E9nominateur multiple de l''autre).', 3)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait comparer 5/12 et 7/12, puis 5/12 et 5/8, puis 7/12 et 5/6, en justifiant sa r\00E9ponse.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Additionner et soustraire des fractions, y compris quand le d\00E9nominateur de l''une est un multiple du d\00E9nominateur de l''autre.', 4)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Exemple : Marc a fait un g\00E2teau, il en a mang\00E9 un dixi\00E8me, Ange en a mang\00E9 trois dixi\00E8mes et Sa\00EFd deux dixi\00E8mes, quelle fraction du g\00E2teau reste-t-il ?', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Les quatre op\00E9rations', 3)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Comprendre et utiliser les mots terme, somme et diff\00E9rence, facteur, produit et multiple.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve comprend et utilise des phrases comme : la somme de 12 et de 25 est 37 ; 3 et 25 sont les facteurs de la multiplication 3 x 25 ; 75 est un multiple de 25.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Poser et effectuer des additions et des soustractions en colonnes, avec des nombres entiers jusqu''\00E0 10 000 et avec des nombres d\00E9cimaux pour la monnaie.', 2)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait traiter les additions et les soustractions pos\00E9es avec des nombres entiers inf\00E9rieurs ou \00E9gaux \00E0 10 000, et avec des nombres d\00E9cimaux pour r\00E9soudre des probl\00E8mes li\00E9s \00E0 la monnaie.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Comprendre le sens de la division et utiliser le symbole divis\00E9 par.', 3)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve comprend que la division est l''op\00E9ration inverse de la multiplication : 7 x 13 = 91, donc 91 divis\00E9 par 7 = 13 et 91 divis\00E9 par 13 = 7.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Poser et effectuer des multiplications d''un nombre \00E0 deux ou trois chiffres par un nombre \00E0 un ou deux chiffres.', 4)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait calculer 16 x 548 en posant l''op\00E9ration avec le nombre ayant le moins de chiffres sur la deuxi\00E8me ligne.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'M\00E9moriser des faits num\00E9riques', 4)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Connaitre dans les deux sens les tables d''addition et de multiplication. Connaitre des faits multiplicatifs usuels \00E9tendus (doubles, moiti\00E9s, d\00E9compositions multiplicatives de 60).', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve connait les d\00E9compositions multiplicatives de 60 : 1x60, 2x30, 3x20, 4x15, 5x12, 6x10. \00C0 la fin du CE2, il peut compl\00E9ter douze \00E9galit\00E9s \00E0 trou de ce type en une minute.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Utiliser ses connaissances en num\00E9ration pour calculer mentalement', 5)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Multiplier un nombre entier par 10 ou par 100.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait que, lors d''une multiplication par 10, chaque chiffre du nombre initial prend une valeur dix fois plus grande.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Apprendre des proc\00E9dures de calcul mental', 6)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Ajouter ou soustraire 8, 9, 18, 19, 28, 29, 38 ou 39 \00E0 un nombre. Multiplier un nombre entier par 4 ou par 8. Multiplier un nombre inf\00E9rieur \00E0 10 par un nombre entier de dizaines. Calculer le produit d''un nombre compris entre 11 et 99 par un nombre inf\00E9rieur \00E0 10.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait que multiplier par 4 revient \00E0 multiplier par 2 puis encore par 2 ; que multiplier par 8 revient \00E0 multiplier par 2 trois fois de suite.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait verbaliser : 23 fois 7, c''est 20 fois 7 plus 3 fois 7.', 2);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'La r\00E9solution de probl\00E8mes', 7)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'R\00E9soudre des probl\00E8mes additifs en une \00E9tape de types parties-tout et comparaison, y compris avec des nombres sup\00E9rieurs \00E0 1000, des prix \00E0 virgule, ou des fractions de m\00EAme d\00E9nominateur.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Exemple : un album peut contenir 350 photos, Lucie a 287 photos et L\00E9o en a 72, l''album peut-il contenir toutes les photos de Lucie et L\00E9o ?', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'R\00E9soudre des probl\00E8mes additifs en deux \00E9tapes, y compris des probl\00E8mes de comparaison n\00E9cessitant une \00E9tape suppl\00E9mentaire.', 2)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Exemple : L\00E9o a 188 billes, Lucie en a 75 de plus que L\00E9o, combien les deux enfants ont-ils de billes en tout ?', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'R\00E9soudre des probl\00E8mes multiplicatifs en une \00E9tape, avec un champ num\00E9rique \00E9tendu.', 3)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Exemple : la maitresse de CE2 a achet\00E9 six dictionnaires pour la classe, elle a pay\00E9 72 euros, quel est le prix d''un dictionnaire ?', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'R\00E9soudre des probl\00E8mes mixtes en deux ou trois \00E9tapes.', 4)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Exemple : dans un restaurant, il y a 4 tables de 6 personnes et 7 tables de 4 personnes, combien ce restaurant peut-il recevoir de clients ?', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'R\00E9soudre des probl\00E8mes de comparaison multiplicative en une \00E9tape.', 5)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve comprend le sens des locutions fois plus et fois moins et les distingue des locutions de plus et de moins. Exemple : une trottinette coute quatre fois plus cher qu''un casque qui coute 32 euros, combien coute la trottinette ?', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'R\00E9soudre des probl\00E8mes mettant en jeu des produits cart\00E9siens.', 6)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Exemple : une poup\00E9e est livr\00E9e avec trois pantalons et sept tee-shirts, de combien de fa\00E7ons est-il possible d''habiller la poup\00E9e ? L''\00E9l\00E8ve sait produire un tableau ou un arbre pour d\00E9nombrer les solutions.', 1);

  raise notice 'Nombres, calcul et resolution de problemes (cycle 2) importe.';
end $$;