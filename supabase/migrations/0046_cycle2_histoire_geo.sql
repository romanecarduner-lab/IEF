-- Import du programme officiel Histoire-geographie cycle 2 (BO n22
-- du 28 mai 2026), applicable au CP des la rentree 2026-2027 -- ce
-- texte couvre deja integralement CP/CE1/CE2. Structure : domaine
-- Histoire-geographie > sous-domaine (Histoire | Geographie) > annee
-- > theme nomme (avec sa question) > objectif > exemple (attendus,
-- reperes et mots-cles combines).

do $$
declare
  v_cycle2_id uuid;
  v_type_domaine uuid;
  v_type_sous_domaine uuid;
  v_type_objectif uuid;
  v_type_exemple uuid;
  v_hg_id uuid;
  v_discipline_id uuid;
  v_annee_id uuid;
  v_theme_id uuid;
begin
  select id into v_cycle2_id from cycles where libelle = 'Cycle 2 (CP, CE1, CE2)';
  select id into v_type_domaine from types_element_programme where code = 'domaine';
  select id into v_type_sous_domaine from types_element_programme where code = 'sous_domaine';
  select id into v_type_objectif from types_element_programme where code = 'objectif';
  select id into v_type_exemple from types_element_programme where code = 'exemple_reussite';

  select id into v_hg_id from elements_programme
  where cycle_id = v_cycle2_id and type_element_id = v_type_domaine
    and libelle = U&'Histoire-g\00E9ographie';

  if v_hg_id is not null then
    raise notice 'Histoire-geographie (cycle 2) deja importee -- rien a faire.';
    return;
  end if;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, null, v_type_domaine, U&'Histoire-g\00E9ographie', 8)
  returning id into v_hg_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_hg_id, v_type_sous_domaine, U&'Histoire', 1)
  returning id into v_discipline_id;

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_discipline_id, v_type_sous_domaine, U&'Cours pr\00E9paratoire', 1)
    returning id into v_annee_id;

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Th\00E8me 1 : Les manifestations naturelles du temps (Comment des manifestations naturelles permettent-elles d''observer le temps qui passe ?) -- Observer des manifestations naturelles du temps.', 1)
    returning id into v_theme_id;

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_theme_id, v_type_exemple, U&'Attendus : expliquer l''alternance du jour et de la nuit en manipulant un globe terrestre ; nommer les saisons, donner leurs caract\00E9ristiques. Rep\00E8res : l''alternance jour/nuit, les saisons en fonction du lieu de vie de l''\00E9l\00E8ve. Mots-cl\00E9s : globe terrestre, jour, nuit, rotation de la terre, saisons.', 1);

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Th\00E8me 2 : Les repr\00E9sentations humaines du temps (Comment les hommes et les femmes se rep\00E8rent-ils dans le temps ? Comment le repr\00E9sentent-ils ?) -- Connaitre la structure du calendrier gr\00E9gorien. D\00E9couvrir diff\00E9rentes repr\00E9sentations du temps : lin\00E9aire et cyclique. Connaitre des outils de mesure du temps.', 2)
    returning id into v_theme_id;

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_theme_id, v_type_exemple, U&'Attendus : savoir que l''ann\00E9e est divis\00E9e en mois, le mois en semaines, la semaine en jours, la journ\00E9e en heures ; rep\00E9rer, ordonner et nommer les jours de la semaine ; utiliser divers types de calendriers ; observer et utiliser des outils de mesure du temps (sablier, pendule, montre, r\00E9veil). Rep\00E8res : l''ann\00E9e (12 mois), la semaine (7 jours), la journ\00E9e (24 heures). Mots-cl\00E9s : ann\00E9e, calendrier, frise, heure, journ\00E9e, mois, montre, pendule, r\00E9veil, sablier, semaine.', 1);

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Th\00E8me 3 : Situer des \00E9v\00E8nements dans le temps (Comment situer des \00E9v\00E8nements dans le temps ?) -- Connaitre les notions d''ant\00E9riorit\00E9, de simultan\00E9it\00E9, de post\00E9riorit\00E9. Comprendre la repr\00E9sentation du temps pass\00E9 et son irr\00E9versibilit\00E9.', 3)
    returning id into v_theme_id;

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_theme_id, v_type_exemple, U&'Attendus : situer et planifier sur un calendrier des \00E9v\00E8nements en utilisant les temps verbaux et marqueurs temporels adapt\00E9s (hier, avant-hier / demain, apr\00E8s-demain) ; se rep\00E9rer au travers des diff\00E9rentes g\00E9n\00E9rations \00E0 partir d''exemples d''arbres g\00E9n\00E9alogiques ; compl\00E9ter une frise chronologique de la journ\00E9e ou de la vie de l''\00E9l\00E8ve. Rep\00E8res : \00E9v\00E8nements de la vie de la classe (anniversaires, f\00EAtes, comm\00E9morations, projets de classe). Mots-cl\00E9s : arbre g\00E9n\00E9alogique, comm\00E9moration, frise chronologique, futur, g\00E9n\00E9ration, pass\00E9, pr\00E9sent.', 1);

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_discipline_id, v_type_sous_domaine, U&'Cours \00E9l\00E9mentaire premi\00E8re ann\00E9e', 2)
    returning id into v_annee_id;

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Th\00E8me 1 : Du pass\00E9 proche au pass\00E9 lointain (Comment situer des \00E9v\00E8nements dans le pass\00E9 ?) -- Comprendre la diff\00E9rence entre le pass\00E9 proche et le pass\00E9 lointain. Employer le lexique relatif au temps (hier, autrefois, il y a dix jours, dix ans, cent ans, etc.).', 1)
    returning id into v_theme_id;

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_theme_id, v_type_exemple, U&'Attendus : identifier et positionner sur une frise chronologique des \00E9v\00E8nements r\00E9cents et des \00E9v\00E8nements plus anciens. Rep\00E8res : ann\00E9es, d\00E9cennies, si\00E8cles, mill\00E9naires. Mots-cl\00E9s : ann\00E9e, d\00E9cennie, mill\00E9naire, si\00E8cle.', 1);

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Th\00E8me 2 : Les grandes p\00E9riodes de l''histoire (Comment les hommes et les femmes construisent-ils des rep\00E8res temporels pour situer des \00E9v\00E8nements dans un temps historique ?) -- Construire une premi\00E8re repr\00E9sentation du temps long et savoir distinguer de grandes p\00E9riodes historiques. Connaitre des figures de chaque p\00E9riode historique.', 2)
    returning id into v_theme_id;

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_theme_id, v_type_exemple, U&'Attendus : situer sur une frise chronologique des figures de chaque p\00E9riode historique ; rep\00E9rer et m\00E9moriser sur une frise les grandes p\00E9riodes de l''histoire. Rep\00E8res : par convention en Europe, Pr\00E9histoire (environ 3 millions d''ann\00E9es \00E0 3000 av. J.-C.), Antiquit\00E9 (3000 av. J.-C. \00E0 476 ap. J.-C.), Moyen \00C2ge (476 \00E0 1492), Temps modernes (1492 \00E0 1789), \00E9poque contemporaine (1789 \00E0 nos jours). Mots-cl\00E9s : \00E9v\00E8nement historique, figure historique, p\00E9riode de l''histoire.', 1);

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Th\00E8me 3 : Les traces du pass\00E9 (Comment connait-on le pass\00E9 ?) -- Comprendre que le pass\00E9 laisse des traces. Utiliser les traces du pass\00E9 pour le comprendre. Connaitre les m\00E9tiers d''arch\00E9ologue, d''historien et d''historienne.', 3)
    returning id into v_theme_id;

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_theme_id, v_type_exemple, U&'Attendus : identifier et situer dans le temps les traces du pass\00E9 (fossiles, ossements, grottes, ruines, monuments, objets, \00E9crits, images, \0153uvres d''art, t\00E9moignages). Mots-cl\00E9s : arch\00E9ologue, archiviste, historien, historienne, trace du pass\00E9.', 1);

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_discipline_id, v_type_sous_domaine, U&'Cours \00E9l\00E9mentaire deuxi\00E8me ann\00E9e', 3)
    returning id into v_annee_id;

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Th\00E8me 1 : La vie des femmes et des hommes au Pal\00E9olithique et au N\00E9olithique (Quelles sont les \00E9volutions des modes de vie \00E0 la Pr\00E9histoire ?) -- Connaitre le mode de vie nomade au Pal\00E9olithique. Comprendre le mode de vie s\00E9dentaire au N\00E9olithique (agriculture, culture et \00E9levage, utilisation des premiers m\00E9taux).', 1)
    returning id into v_theme_id;

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_theme_id, v_type_exemple, U&'Attendus : d\00E9crire le mode de vie des chasseurs-cueilleurs au Pal\00E9olithique ; d\00E9crire une peinture pari\00E9tale ou une gravure rupestre ; expliquer les diff\00E9rences de mode de vie des femmes et des hommes entre le Pal\00E9olithique et le N\00E9olithique. Rep\00E8res : vers 10000-9000 av. J.-C. la naissance de l''agriculture, 3200 av. J.-C. \00D6tzi, vers 3000 av. J.-C. apparition de l''\00E9criture, un site arch\00E9ologique pr\00E9historique sur le territoire fran\00E7ais. Mots-cl\00E9s : agriculture, art pari\00E9tal, art rupestre, N\00E9olithique, nomadisme, Pal\00E9olithique, s\00E9dentarit\00E9.', 1);

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Th\00E8me 2 : Vivre \00E0 Rome et en Gaule romaine du Ier si\00E8cle avant J.-C. au IIe si\00E8cle apr\00E8s J.-C. (Comment vivait-on \00E0 Rome et dans l''empire ?) -- Connaitre la vie quotidienne des habitantes et habitants de Rome (se loger, se nourrir, se d\00E9placer, se divertir). Comprendre que la soci\00E9t\00E9 antique est hi\00E9rarchis\00E9e. Connaitre l''\00E9tendue de l''empire romain au IIe si\00E8cle apr\00E8s J.-C. Connaitre la vie quotidienne des habitants de la Gaule romaine.', 2)
    returning id into v_theme_id;

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_theme_id, v_type_exemple, U&'Attendus : d\00E9finir l''usage d''un monument caract\00E9ristique de la ville de Rome ; rep\00E9rer sur une carte l''\00E9tendue de l''empire romain \00E0 son apog\00E9e ; localiser la Gaule dans l''empire ; expliquer que le monde gallo-romain m\00EAle les cultures gauloise et romaine. Rep\00E8res : 52 av. J.-C. si\00E8ge d''Al\00E9sia et d\00E9faite de Vercing\00E9torix, 27 av. J.-C. \00E0 14 ap. J.-C. r\00E8gne de l''empereur Auguste, un site arch\00E9ologique gallo-romain. Mots-cl\00E9s : amphith\00E9\00E2tre, aqueduc, forum, gallo-romain, palais, Rome, temple, therme, villa.', 1);

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Th\00E8me 3 : La construction du royaume de France, Xe-XVe si\00E8cles (Comment les Cap\00E9tiens et les Valois ont-ils construit le royaume de France ?) -- Connaitre et comprendre les grandes \00E9tapes de la construction du royaume de France et les moyens d''affirmation de l''autorit\00E9 du roi.', 3)
    returning id into v_theme_id;

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_theme_id, v_type_exemple, U&'Attendus : rep\00E9rer les grandes \00E9tapes de la construction du royaume de France \00E0 partir de cartes ; d\00E9crire la c\00E9r\00E9monie du sacre ; nommer et situer sur une frise les dynasties royales (Cap\00E9tiens, Valois), quelques rois (Philippe Auguste) et quelques grandes figures f\00E9minines (Ali\00E9nor d''Aquitaine, Blanche de Castille). Rep\00E8res : 987 \00E9lection d''Hugues Capet, XIVe-XVe si\00E8cles guerre de Cent Ans. Mots-cl\00E9s : dynastie, guerre, imp\00F4t, monarchie, monnaie, royaume, sacre.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_hg_id, v_type_sous_domaine, U&'G\00E9ographie', 2)
  returning id into v_discipline_id;

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_discipline_id, v_type_sous_domaine, U&'Cours pr\00E9paratoire', 1)
    returning id into v_annee_id;

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Th\00E8me 1 : Autour de l''\00E9cole (Comment se rep\00E9rer dans la classe, dans l''\00E9cole et dans son espace proche ?) -- Connaitre les \00E9l\00E9ments d''organisation de la classe et de l''\00E9cole. Comprendre que l''espace se repr\00E9sente. Explorer les locaux de l''\00E9cole pour s''y rep\00E9rer. Identifier les diff\00E9rents rep\00E8res autour de l''\00E9cole, du quartier ou de la commune.', 1)
    returning id into v_theme_id;

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_theme_id, v_type_exemple, U&'Attendus : nommer les \00E9l\00E9ments d''organisation de la classe et les situer les uns par rapport aux autres ; faire le plan de la classe ; se d\00E9placer dans l''\00E9cole en s''orientant et en utilisant un plan ; d\00E9crire un trajet entre un lieu de l''espace proche et l''\00E9cole. Rep\00E8res : \00E0 gauche/\00E0 droite/au-dessus/en dessous/devant/derri\00E8re/\00E0 c\00F4t\00E9 ; la classe, la cour, les couloirs, le portail. Mots-cl\00E9s : plan, rue, route, quartier, village, trajet.', 1);

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Th\00E8me 2 : Des repr\00E9sentations du monde (Quels sont les principaux rep\00E8res \00E0 l''\00E9chelle mondiale ?) -- Identifier la diff\00E9rence entre continents et oc\00E9ans. Comprendre comment et pourquoi passer du globe au planisph\00E8re. Comprendre que le monde est peupl\00E9.', 2)
    returning id into v_theme_id;

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_theme_id, v_type_exemple, U&'Attendus : reconnaitre un planisph\00E8re ; reconnaitre et localiser les continents et les oc\00E9ans ; situer la France ; localiser les grands foyers de peuplement. Rep\00E8res : terres \00E9merg\00E9es/oc\00E9ans, Nord/Sud/Est/Ouest, les continents, oc\00E9ans Atlantique, Pacifique, Indien, la France, les grands foyers de peuplement. Mots-cl\00E9s : continent, oc\00E9an, pays.', 1);

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_discipline_id, v_type_sous_domaine, U&'Cours \00E9l\00E9mentaire premi\00E8re ann\00E9e', 2)
    returning id into v_annee_id;

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Th\00E8me 1 : La Terre est peupl\00E9e (O\00F9 les \00EAtres humains vivent-ils dans le monde ?) -- Connaitre les grands foyers de peuplement (fortes densit\00E9s) en remobilisant les rep\00E8res acquis depuis le CP. Connaitre les principales villes dans le monde. Comprendre la diff\00E9rence entre ville et campagne.', 1)
    returning id into v_theme_id;

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_theme_id, v_type_exemple, U&'Attendus : localiser les grands foyers de peuplement sur un planisph\00E8re ; m\00E9moriser et localiser les principales villes \00E0 l''\00E9chelle mondiale ; expliquer la diff\00E9rence entre ville et village. Rep\00E8res : une ville tr\00E8s peupl\00E9e de chaque continent. Mots-cl\00E9s : campagne, village, ville.', 1);

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Th\00E8me 2 : D\00E9couvrir les lieux o\00F9 vivent les \00EAtres humains (Quelles sont les caract\00E9ristiques principales des lieux de vie des \00EAtres humains ?) -- Connaitre les trois grandes zones climatiques (tropicale, temp\00E9r\00E9e, froide). Connaitre les principaux types de v\00E9g\00E9tation (for\00EAt, prairie, d\00E9sert). Connaitre les diff\00E9rents types de relief (montagne, plaine, plateau, vall\00E9e). Connaitre la diff\00E9rence entre un fleuve et une rivi\00E8re.', 2)
    returning id into v_theme_id;

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_theme_id, v_type_exemple, U&'Attendus : caract\00E9riser les zones climatiques, types de v\00E9g\00E9tation et de relief ; localiser sur un planisph\00E8re les zones climatiques, chaines de montagne, d\00E9serts et grands fleuves ; reconnaitre une for\00EAt temp\00E9r\00E9e et tropicale, un d\00E9sert chaud et froid ; d\00E9crire un paysage \00E0 partir d''une photographie. Rep\00E8res : zone tropicale/temp\00E9r\00E9e/froide, for\00EAts amazonienne/du bassin du Congo/indon\00E9sienne, principaux d\00E9serts (Antarctique, Sahara), trois plus longs fleuves (Amazone, Mississippi, Nil), cinq massifs montagneux (Andes, Alpes, Atlas, Himalaya, Rocheuses). Mots-cl\00E9s : climat, m\00E9t\00E9o, d\00E9sert, fleuve, rivi\00E8re, for\00EAt, plaine, plateau, montagne.', 1);

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_discipline_id, v_type_sous_domaine, U&'Cours \00E9l\00E9mentaire deuxi\00E8me ann\00E9e', 3)
    returning id into v_annee_id;

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Th\00E8me 1 : L''in\00E9gale r\00E9partition de la population en France (O\00F9 vit la population en France ?) -- Connaitre la r\00E9partition de la population en France.', 1)
    returning id into v_theme_id;

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_theme_id, v_type_exemple, U&'Attendus : localiser les espaces de fortes et de faibles densit\00E9s sur une carte de France ; localiser et nommer les cinq principales agglom\00E9rations nationales ; localiser et nommer les grandes chaines de montagne et quelques grands fleuves. Rep\00E8res : les principaux massifs (Alpes, Corse, Jura, Massif Central, Pyr\00E9n\00E9es, Vosges, un massif ultramarin) et grands fleuves fran\00E7ais (Garonne, Loire, Maroni, Rhin, Rh\00F4ne, Seine). Mots-cl\00E9s : peuplement, population.', 1);

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Th\00E8me 2 : Se loger en France (Quelles sont les principales caract\00E9ristiques des espaces r\00E9sidentiels en France ?) -- Connaitre et comprendre la diversit\00E9 des paysages r\00E9sidentiels en France.', 2)
    returning id into v_theme_id;

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_theme_id, v_type_exemple, U&'Attendus : reconnaitre et d\00E9crire les \00E9l\00E9ments constitutifs des espaces r\00E9sidentiels. Rep\00E8res : un centre-ville historique, un quartier r\00E9cent d''habitation, un grand ensemble, un lotissement pavillonnaire, un village. Mots-cl\00E9s : centre-ville, grand ensemble, lotissement pavillonnaire.', 1);

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Th\00E8me 3 : Travailler en France (Quelles sont les principales caract\00E9ristiques paysag\00E8res des activit\00E9s en France ?) -- Connaitre et comprendre la diversit\00E9 paysag\00E8re des activit\00E9s en France.', 3)
    returning id into v_theme_id;

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_theme_id, v_type_exemple, U&'Attendus : reconnaitre et d\00E9crire un paysage industriel, agricole, d''activit\00E9 commerciale, de quartier d''affaires, de station touristique. Mots-cl\00E9s : exploitation agricole, station touristique, usine.', 1);

  raise notice 'Histoire-geographie (cycle 2) importee.';
end $$;