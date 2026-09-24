-- Import du programme officiel cycle 2 -- Mathematiques > Grandeurs
-- et mesures (BO du 31 octobre 2024, ensel135_annexe4.pdf).
-- CP et CE1 : texte officiel complet (longueurs, masses, monnaie,
-- repere dans le temps). CE2 : longueurs et masses completes ;
-- contenances partielle (un seul objectif, les unites litre/
-- decilitre/centilitre restent a ajouter) ; monnaie et repere dans
-- le temps CE2 PAS ENCORE INCLUS -- le texte officiel exact n'a pas
-- pu etre retrouve avec certitude, a completer dans une prochaine
-- migration plutot que d'improviser du contenu officiel sans source.

do $$
declare
  v_cycle2_id uuid;
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
  select id into v_type_sous_domaine from types_element_programme where code = 'sous_domaine';
  select id into v_type_objectif from types_element_programme where code = 'objectif';
  select id into v_type_exemple from types_element_programme where code = 'exemple_reussite';

  select id into v_maths_id from elements_programme
  where cycle_id = v_cycle2_id and libelle = U&'Math\00E9matiques'
    and type_element_id = (select id from types_element_programme where code = 'domaine');

  select id into v_domaine_id from elements_programme
  where cycle_id = v_cycle2_id and parent_id = v_maths_id
    and type_element_id = v_type_sous_domaine and libelle = U&'Grandeurs et mesures';

  if v_domaine_id is not null then
    raise notice 'Grandeurs et mesures (cycle 2) deja importe -- rien a faire.';
    return;
  end if;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_maths_id, v_type_sous_domaine, U&'Grandeurs et mesures', 2)
  returning id into v_domaine_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_domaine_id, v_type_sous_domaine, U&'Cours pr\00E9paratoire', 1)
  returning id into v_annee_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Les longueurs', 1)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Utiliser le lexique sp\00E9cifique associ\00E9 aux longueurs. Comparer des objets selon leur longueur. Comparer des segments selon leur longueur.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve comprend et utilise le lexique associ\00E9 aux longueurs : long, court, pr\00E8s, loin.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait comparer les longueurs de deux objets d\00E9pla\00E7ables en faisant co\00EFncider une extr\00E9mit\00E9 et en les superposant, et de deux objets non d\00E9pla\00E7ables en utilisant une ficelle ou une bandelette comme instrument de report de longueur.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve ordonne jusqu''\00E0 cinq baguettes ou cinq bandelettes selon leur longueur.', 3);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Savoir mesurer la longueur d''un segment en utilisant une r\00E8gle gradu\00E9e. Connaitre et utiliser les unit\00E9s m\00E8tre et centim\00E8tre et les symboles associ\00E9s (m et cm). Connaitre quelques longueurs de r\00E9f\00E9rence. Savoir qu''un m\00E8tre est \00E9gal \00E0 cent centim\00E8tres.', 2)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve utilise une r\00E8gle gradu\00E9e en centim\00E8tres pour mesurer des segments ou construire des segments d''une longueur donn\00E9e.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait dire si la longueur d''une trousse est plut\00F4t 2 cm, 20 cm ou 1 m.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait estimer la hauteur de la porte, la largeur de la classe ou la longueur du couloir.', 3);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Les masses', 2)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Utiliser le lexique associ\00E9 aux masses. Comparer des objets selon leur masse.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve comprend et utilise le lexique associ\00E9 aux masses : lourd, l\00E9ger.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve compare les masses de deux ou trois objets d''apparence identique mais de masses clairement diff\00E9rentes en les soupesant, et sait dire laquelle est la plus lourde ou la plus l\00E9g\00E8re.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait ordonner par ordre croissant les masses de deux ou trois objets en utilisant une balance du type Roberval.', 3);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'La monnaie', 3)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Utiliser le lexique sp\00E9cifique li\00E9 \00E0 la monnaie. Comparer les valeurs de deux ensembles constitu\00E9s de pi\00E8ces de monnaie ou de pi\00E8ces et de billets. D\00E9terminer la valeur en euro d''un ensemble constitu\00E9 de pi\00E8ces et de billets. Constituer une somme d''argent donn\00E9e avec des pi\00E8ces et des billets. Simuler des achats en manipulant des pi\00E8ces et des billets fictifs, rendre la monnaie. Les montants sont des nombres entiers d''euros toujours inf\00E9rieurs ou \00E9gaux \00E0 cent.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve comprend et utilise le lexique sp\00E9cifique associ\00E9 aux prix : plus cher, moins cher, rendre la monnaie, billet, pi\00E8ce, somme, reste, euros.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait comparer deux ensembles constitu\00E9s de pi\00E8ces ou de billets du point de vue de leur valeur et non de celui du nombre de pi\00E8ces ou de billets, et sait que dix pi\00E8ces de 1 euro ont la m\00EAme valeur qu''un billet de 10 euros.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve constitue une somme d''argent donn\00E9e avec le mat\00E9riel fourni, par exemple en utilisant le moins de pi\00E8ces possible.', 3);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Le rep\00E9rage dans le temps', 4)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Lire sur une horloge \00E0 aiguilles une heure donn\00E9e en heures enti\00E8res. Positionner les aiguilles d''une horloge correspondant \00E0 une heure donn\00E9e (heures enti\00E8res inf\00E9rieures ou \00E9gales \00E0 douze). Associer une heure \00E0 un moment de la journ\00E9e.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait lire des heures enti\00E8res (par exemple trois heures, neuf heures, mais aussi midi) montr\00E9es sur un cadran \00E0 aiguilles.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait positionner les aiguilles d''un cadran correspondant \00E0 une heure donn\00E9e du matin ou de l''apr\00E8s-midi.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait associer des actions famili\00E8res (se lever, aller \00E0 l''\00E9cole, d\00E9jeuner, etc.) \00E0 des heures affich\00E9es sur des horloges.', 3);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_domaine_id, v_type_sous_domaine, U&'Cours \00E9l\00E9mentaire premi\00E8re ann\00E9e', 2)
  returning id into v_annee_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Les longueurs', 1)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Connaitre et utiliser les unit\00E9s m\00E8tre, centim\00E8tre, kilom\00E8tre et les symboles associ\00E9s (m, cm et km). Choisir l''unit\00E9 la mieux adapt\00E9e pour exprimer une longueur. Connaitre les relations entre les unit\00E9s de longueur usuelles.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait que 1 m = 100 cm et 1 km = 1000 m.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait mesurer une longueur en utilisant un m\00E8tre ruban ou une r\00E8gle d''un m\00E8tre gradu\00E9e en centim\00E8tres.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait que 1 m + 46 cm = 146 cm.', 3);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Savoir mesurer la longueur d''un segment en utilisant une r\00E8gle gradu\00E9e. Comparer des longueurs. Connaitre quelques longueurs de r\00E9f\00E9rence. Estimer la longueur d''un objet du quotidien.', 2)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait encadrer la longueur d''un segment par deux nombres entiers de centim\00E8tres, par exemple : la longueur du segment est entre huit et neuf centim\00E8tres.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve connait quelques longueurs d''objets familiers et quelques distances qu''il utilise comme r\00E9f\00E9rences pour estimer d''autres longueurs.', 2);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Les masses', 2)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Savoir identifier l''objet le plus l\00E9ger (ou le plus lourd) parmi deux ou trois objets de volumes proches en les soupesant ou en utilisant une balance pour les peser. Connaitre et utiliser les unit\00E9s gramme et kilogramme et les symboles associ\00E9s (g, kg). Savoir que 1 kg est \00E9gal \00E0 1000 g. Comparer des masses. Disposer de quelques masses de r\00E9f\00E9rence.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve p\00E8se des objets pour d\00E9terminer leur masse en gramme ou en kilogramme (balance du type Roberval ou balance digitale).', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve connait la masse de quelques objets du quotidien : un paquet de sucre p\00E8se 1 kg, un sachet de levure p\00E8se environ 10 g.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait ordonner quatre masses exprim\00E9es en gramme ou en kilogramme.', 3);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'La monnaie', 3)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Connaitre le lien entre les euros et les centimes (100 centimes = 1 euro). Comparer les valeurs en euro de deux ensembles constitu\00E9s de pi\00E8ces et de billets. D\00E9terminer la valeur en euro et centime d''euro d''un ensemble constitu\00E9 de pi\00E8ces et de billets. Constituer avec des euros et des centimes d''euro une somme d''argent d''une valeur donn\00E9e. Simuler des achats en manipulant des pi\00E8ces et des billets fictifs, rendre la monnaie. Connaitre le sens de l''\00E9criture \00E0 virgule d''une somme d''argent.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait qu''une pi\00E8ce d''un euro a la m\00EAme valeur que cent pi\00E8ces d''un centime.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve compare des sommes contenues dans deux portemonnaies en distinguant le nombre de pi\00E8ces et de billets de leur valeur r\00E9elle : il comprend que trois pi\00E8ces de 2 euros valent plus que 50 pi\00E8ces de 10 centimes.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait utiliser diff\00E9rentes \00E9critures et passer de l''une \00E0 l''autre : 2 euros et 17 centimes s''\00E9crit aussi 2,17 euros ; 2 euros et 5 centimes s''\00E9crit 2,05 euros ; 85 centimes = 0,85 euro.', 3);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Le rep\00E9rage dans le temps et les dur\00E9es', 4)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Lire l''heure sur une horloge \00E0 aiguilles (heures enti\00E8res, heures et demi-heure, ou heures et quarts d''heure). Positionner les aiguilles d''une horloge correspondant \00E0 une heure donn\00E9e. Connaitre, utiliser et distinguer les heures du matin et celles de l''apr\00E8s-midi. Connaitre les unit\00E9s de mesure de dur\00E9e, heure et minute, et les symboles associ\00E9s (h et min). Comparer et mesurer des dur\00E9es \00E9coul\00E9es entre deux instants affich\00E9s sur une horloge.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Sachant qu''on parle d''un instant de l''apr\00E8s-midi, l''\00E9l\00E8ve sait lire sur une horloge \00E0 aiguilles qu''il est deux heures et quart ou 14 heures et 15 minutes, et qu''une horloge digitale afficherait alors 14:15.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve connait les relations : 1 heure = 60 minutes ; 1 demi-heure = 30 minutes ; 1 quart d''heure = 15 minutes.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait ajouter ou soustraire des dur\00E9es, par exemple : mamie a pass\00E9 un quart d''heure \00E0 tailler ses rosiers et une demi-heure \00E0 b\00EAcher son potager, combien de temps est-elle rest\00E9e dans le jardin ?', 3);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_domaine_id, v_type_sous_domaine, U&'Cours \00E9l\00E9mentaire deuxi\00E8me ann\00E9e', 3)
  returning id into v_annee_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Les longueurs', 1)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Connaitre et utiliser les unit\00E9s m\00E8tre, d\00E9cim\00E8tre, centim\00E8tre, millim\00E8tre, kilom\00E8tre et les symboles associ\00E9s (m, dm, cm, mm, km). Connaitre les relations entre les unit\00E9s de longueur. Choisir l''unit\00E9 la mieux adapt\00E9e pour exprimer une longueur. Comparer des longueurs. Tracer un segment de longueur donn\00E9e.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait que 1 cm = 10 mm et 1 m = 1000 mm.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait effectuer des conversions (cm-mm ; m-dm-cm et km-m), par exemple : 215 cm = 2 m + 1 dm + 5 cm.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve mesure la longueur de segments ou trace des segments de longueur donn\00E9e.', 3);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Disposer de quelques longueurs de r\00E9f\00E9rence. Estimer la longueur d''un objet ou une distance. Savoir ce qu''est le p\00E9rim\00E8tre d''une figure plane. Comparer le p\00E9rim\00E8tre de plusieurs polygones sans r\00E8gle gradu\00E9e, en utilisant un compas. D\00E9terminer le p\00E9rim\00E8tre d''un polygone en utilisant une r\00E8gle gradu\00E9e.', 2)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait que le p\00E9rim\00E8tre d''une figure plane est la longueur de son contour.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait reporter au compas les longueurs des c\00F4t\00E9s d''un polygone sur une droite afin d''obtenir un segment ayant une longueur \00E9gale au p\00E9rim\00E8tre du polygone.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait d\00E9terminer le p\00E9rim\00E8tre d''un polygone en mesurant la longueur de chacun de ses c\00F4t\00E9s.', 3);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Les masses', 2)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Connaitre et utiliser les unit\00E9s gramme, kilogramme et tonne et les symboles associ\00E9s (g, kg, t). Choisir l''unit\00E9 la mieux adapt\00E9e pour exprimer une masse. Connaitre les relations entre les unit\00E9s de masse usuelles. Comparer des masses. Disposer de quelques masses de r\00E9f\00E9rence. Estimer la masse d''un objet.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait convertir entre les unit\00E9s gramme et kilogramme : 1 kg = 1000 g donc 3 kg = 3000 g ; 1 t = 1000 kg donc 2 t = 2000 kg.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve compare et ordonne les masses de trois ou quatre objets en utilisant une balance de type Roberval ou \00E0 partir de masses donn\00E9es.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve estime la masse d''objets en gramme ou en kilogramme (une feuille de papier, une pomme, un dictionnaire, un seau d''eau, une voiture, etc.).', 3);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Les contenances', 3)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Comparer les contenances de diff\00E9rents objets.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait comparer perceptivement les contenances d''objets quand elles sont clairement distinctes.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait identifier l''objet ayant la plus grande (ou la plus petite) contenance parmi deux ou trois r\00E9cipients, par des transvasements.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait comparer des contenances en les mesurant \00E0 l''aide d''un \00E9talon, par exemple en d\00E9terminant le nombre de verres que contient chacun de deux r\00E9cipients.', 3);

  raise notice 'Grandeurs et mesures (cycle 2) importe (CE2 partiel).';
end $$;