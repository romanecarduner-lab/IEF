-- Import du programme officiel Sciences et technologie cycle 2 (BO
-- n24 du 11 juin 2026), applicable au CP des la rentree 2026-2027 --
-- ce texte couvre deja integralement CP/CE1/CE2. Structure : domaine
-- Sciences et technologie > sous-domaine (4 grands domaines) > annee
-- > theme nomme (sauf le dernier domaine, sans sous-theme nomme) >
-- objectif > exemple.

do $$
declare
  v_cycle2_id uuid;
  v_type_domaine uuid;
  v_type_sous_domaine uuid;
  v_type_objectif uuid;
  v_type_exemple uuid;
  v_sciences_id uuid;
  v_grand_domaine_id uuid;
  v_annee_id uuid;
  v_theme_id uuid;
  v_objectif_id uuid;
begin
  select id into v_cycle2_id from cycles where libelle = 'Cycle 2 (CP, CE1, CE2)';
  select id into v_type_domaine from types_element_programme where code = 'domaine';
  select id into v_type_sous_domaine from types_element_programme where code = 'sous_domaine';
  select id into v_type_objectif from types_element_programme where code = 'objectif';
  select id into v_type_exemple from types_element_programme where code = 'exemple_reussite';

  select id into v_sciences_id from elements_programme
  where cycle_id = v_cycle2_id and type_element_id = v_type_domaine
    and libelle = U&'Sciences et technologie';

  if v_sciences_id is not null then
    raise notice 'Sciences et technologie (cycle 2) deja importee -- rien a faire.';
    return;
  end if;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, null, v_type_domaine, U&'Sciences et technologie', 9)
  returning id into v_sciences_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_sciences_id, v_type_sous_domaine, U&'La mati\00E8re, les mesures, l''\00E9lectricit\00E9', 1)
  returning id into v_grand_domaine_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_grand_domaine_id, v_type_sous_domaine, U&'Cours pr\00E9paratoire', 1)
  returning id into v_annee_id;

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Masse, volumes et mesure de temp\00E9rature', 1)
    returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Comparer les masses de diff\00E9rents objets. Utiliser le vocabulaire associ\00E9 aux masses.', 1)
      returning id into v_objectif_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve compare et classe des objets (boule de p\00E2te \00E0 modeler, contenant rempli de sucre, sable, farine, graines) dont les masses peuvent \00EAtre diff\00E9renci\00E9es en les soupesant, et en utilisant une balance de Roberval ou une balance \00E0 solides et \00E0 liquides.', 1);

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Lire la valeur de la temp\00E9rature avec un thermom\00E8tre \00E0 liquide.', 2)
      returning id into v_objectif_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve lit sur un thermom\00E8tre gradu\00E9 la temp\00E9rature dans la classe, en mettant son \0153il au niveau du m\00E9nisque, et utilise le vocabulaire sp\00E9cifique, en particulier l''unit\00E9 degr\00E9 Celsius.', 1);

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'\00C9tats physiques de la mati\00E8re', 2)
    returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Reconnaitre et identifier les \00E9tats solides et liquides de l''eau.', 1)
      returning id into v_objectif_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve identifie l''\00E9tat physique de l''eau (solide ou liquide) dans le contexte des ph\00E9nom\00E8nes naturels (cours d''eau, mer, cascade, pluie, nuage, brouillard, gr\00EAle, neige, glace, banquise, glacier).', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_grand_domaine_id, v_type_sous_domaine, U&'Cours \00E9l\00E9mentaire premi\00E8re ann\00E9e', 2)
  returning id into v_annee_id;

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Masse et volumes', 1)
    returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Mesurer les masses des objets avec une balance, comparer et classer les masses gr\00E2ce \00E0 la mesure.', 1)
      returning id into v_objectif_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve mesure la masse d''objets \00E0 l''aide d''une balance de Roberval en utilisant des objets de masse connue ou des masses marqu\00E9es, et compare et classe les objets dont il a mesur\00E9 la masse.', 1);

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'\00C9tats physiques de la mati\00E8re', 2)
    returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Observer le changement d''\00E9tat physique de l''eau (solide et liquide) et sa r\00E9versibilit\00E9. Nommer le changement d''\00E9tat (solidification et fusion). Constater la conservation de la masse lors d''un changement d''\00E9tat. Constater que le volume de l''eau ne se conserve pas lors de sa solidification. R\00E9aliser des exp\00E9riences mettant en \00E9vidence la mat\00E9rialit\00E9 de l''air.', 1)
      returning id into v_objectif_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve identifie l''\00E9tat physique de l''eau avant et apr\00E8s le changement d''\00E9tat et nomme le changement d''\00E9tat ; il p\00E8se une masse d''eau avant et apr\00E8s cong\00E9lation et constate la conservation de sa masse alors qu''elle occupe plus d''espace \00E0 l''\00E9tat solide.', 1);
      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'En plongeant verticalement un verre, ouverture vers le bas, dans un saladier rempli d''eau, l''\00E9l\00E8ve interpr\00E8te l''absence d''eau dans le verre par l''existence d''une mati\00E8re qui occupe cet espace : l''air. Il transvase de l''air d''un r\00E9cipient \00E0 un autre et interpr\00E8te le vent comme un d\00E9placement d''air.', 2);

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'L''\00E9lectricit\00E9', 3)
    returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_objectif, U&'R\00E9aliser un circuit \00E9lectrique \00E0 une boucle associant un g\00E9n\00E9rateur (pile), un interrupteur, un r\00E9cepteur (ampoule) pour mettre en \00E9vidence la circulation du courant \00E9lectrique. Tester des mat\00E9riaux pour d\00E9terminer leur caract\00E8re isolant ou conducteur.', 1)
      returning id into v_objectif_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve construit un circuit \00E9lectrique \00E0 une boucle incluant un interrupteur, identifie sur un dessin si le circuit est ouvert ou ferm\00E9, et associe le caract\00E8re conducteur d''un mat\00E9riau \00E0 sa capacit\00E9 \00E0 conserver le circuit ferm\00E9.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_grand_domaine_id, v_type_sous_domaine, U&'Cours \00E9l\00E9mentaire deuxi\00E8me ann\00E9e', 3)
  returning id into v_annee_id;

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Masse, volumes et mesure du temps', 1)
    returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Convertir des unit\00E9s de masse. Comparer les contenances de diff\00E9rents objets. Comparer des volumes de liquide en utilisant un verre gradu\00E9 ou un r\00E9cipient de contenance connue.', 1)
      returning id into v_objectif_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve r\00E9alise des conversions entre les unit\00E9s gramme et kilogramme, mesure le volume d''un \00E9chantillon liquide avec un verre gradu\00E9, et classe par ordre croissant les volumes de plusieurs \00E9chantillons liquides.', 1);

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Comparer, estimer, mesurer des dur\00E9es.', 2)
      returning id into v_objectif_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve construit un sablier et identifie les param\00E8tres susceptibles d''affecter la dur\00E9e d''\00E9coulement et les fait varier.', 1);
      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve constate la r\00E9gularit\00E9 de ses observations (deux sabliers identiques mesurent la m\00EAme dur\00E9e \00E0 quelques secondes pr\00E8s) et formule la loi : plus il y a de grains dans le sablier, plus la dur\00E9e d''\00E9coulement est importante, les autres param\00E8tres \00E9tant identiques.', 2);

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'\00C9tats physiques de la mati\00E8re', 2)
    returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Diff\00E9rencier les \00E9tats physiques solide (forme et volume propre) et liquide (volume propre, absence de forme propre et surface horizontale).', 1)
      returning id into v_objectif_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve d\00E9termine et justifie l''\00E9tat physique (liquide ou solide) d''un objet en s''appuyant sur ses propri\00E9t\00E9s relatives \00E0 la forme et au volume.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_sciences_id, v_type_sous_domaine, U&'Les \00EAtres vivants dans leur environnement', 2)
  returning id into v_grand_domaine_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_grand_domaine_id, v_type_sous_domaine, U&'Cours pr\00E9paratoire', 1)
  returning id into v_annee_id;

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Unit\00E9 et diversit\00E9 du vivant', 1)
    returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Caract\00E9riser et justifier \00E0 l''aide de crit\00E8res simples ce qui est vivant, non vivant ou \00E9labor\00E9 par des \00EAtres vivants.', 1)
      returning id into v_objectif_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve trie des collections d''objets et \00E9tablit des cat\00E9gories (vivant, non vivant, \00E9labor\00E9 par des \00EAtres vivants : nid, lait, \0153ufs, laine, fibres v\00E9g\00E9tales, soie), en justifiant son tri par des crit\00E8res comme la mobilit\00E9, la croissance, la reproduction, l''alimentation, la perception.', 1);

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Observer et d\00E9crire son environnement proche', 2)
    returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Observer son environnement proche : d\00E9crire les \00EAtres vivants qui y vivent et les caract\00E9ristiques du milieu de vie. Se rep\00E9rer dans son environnement proche.', 1)
      returning id into v_objectif_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Dans un environnement proche (cour d''\00E9cole, jardin p\00E9dagogique, parc, for\00EAt, prairie, mare, mer), l''\00E9l\00E8ve rep\00E8re et nomme quelques \00EAtres vivants (animaux, v\00E9g\00E9taux, champignons), r\00E9alise des dessins d''observation, et identifie le milieu de vie de chacune des esp\00E8ces observ\00E9es.', 1);
      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve se rep\00E8re en positionnant les principaux \00E9l\00E9ments sur un plan ou une maquette.', 2);

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Agir pour prot\00E9ger l''environnement', 3)
    returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Constater quelques modifications de l''environnement proche par des activit\00E9s humaines. Identifier et mettre en \0153uvre quelques gestes simples favorables \00E0 la protection de l''environnement proche de l''\00E9cole. D\00E9velopper un rapport sensible \00E0 la nature. Prendre conscience des possibilit\00E9s d''agir pour prot\00E9ger l''environnement.', 1)
      returning id into v_objectif_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve identifie les transformations de l''environnement li\00E9es aux activit\00E9s humaines, adopte au quotidien un comportement respectueux de son environnement (\00E9conomie d''eau, tri des d\00E9chets, \00E9conomie d''\00E9nergie, r\00E9cup\00E9ration des piles usag\00E9es), et d\00E9crit ses \00E9motions lors de sa confrontation \00E0 la nature.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_grand_domaine_id, v_type_sous_domaine, U&'Cours \00E9l\00E9mentaire premi\00E8re ann\00E9e', 2)
  returning id into v_annee_id;

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Nutrition des \00EAtres vivants', 1)
    returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_objectif, U&'D\00E9terminer des besoins essentiels pour la croissance d''une plante (eau et lumi\00E8re) par une d\00E9marche exp\00E9rimentale. D\00E9crire les diff\00E9rents organes v\00E9g\00E9tatifs d''une plante (racine, tige, feuille).', 1)
      returning id into v_objectif_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve d\00E9termine des besoins nutritionnels \00E0 partir de l''observation de plantes cultiv\00E9es avec ou sans eau, avec ou sans lumi\00E8re, et nomme les diff\00E9rentes parties d''une plante \00E0 partir d''observations ou de photographies.', 1);

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Identifier le r\00E9gime alimentaire d''animaux.', 2)
      returning id into v_objectif_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'\00C0 partir d''observations, d''\00E9levages ou de traces, l''\00E9l\00E8ve associe les aliments consomm\00E9s au r\00E9gime alimentaire des animaux \00E9tudi\00E9s (herbivores, carnivores, omnivores).', 1);

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Sens et perception chez les animaux', 2)
    returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Associer des organes sensoriels et la perception du milieu chez les animaux (vision, audition, odorat, gout, \00E9quilibre, toucher).', 1)
      returning id into v_objectif_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve identifie diff\00E9rentes modalit\00E9s sensorielles \00E0 partir de photos d''animaux, de vid\00E9os ou de textes documentaires.', 1);

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Observer et d\00E9crire son environnement proche', 3)
    returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Observer le changement de peuplement de l''environnement proche au cours des saisons. Relier la pr\00E9sence d''esp\00E8ces avec les caract\00E9ristiques de l''environnement. Cat\00E9goriser diff\00E9rentes relations entre les \00EAtres vivants.', 1)
      returning id into v_objectif_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve constate des diff\00E9rences dans le peuplement de l''environnement proche selon les saisons, relie les caract\00E9ristiques du milieu (humidit\00E9, luminosit\00E9, temp\00E9rature) aux esp\00E8ces pr\00E9sentes, et d\00E9crit les relations entre \00EAtres vivants (source d''alimentation, habitat, protection, transport).', 1);

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Agir pour prot\00E9ger l''environnement', 4)
    returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_objectif, U&'S''impliquer dans une action de pr\00E9servation de l''environnement proche de l''\00E9cole. D\00E9velopper un rapport sensible \00E0 la nature.', 1)
      returning id into v_objectif_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve participe \00E0 une action visant \00E0 favoriser la biodiversit\00E9 ou \00E0 pr\00E9server l''environnement (installation de nichoirs ou de mangeoires) et d\00E9crit ses \00E9motions lors de sa confrontation \00E0 la nature.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_grand_domaine_id, v_type_sous_domaine, U&'Cours \00E9l\00E9mentaire deuxi\00E8me ann\00E9e', 3)
  returning id into v_annee_id;

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Unit\00E9 et diversit\00E9 du vivant', 1)
    returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_objectif, U&'D\00E9crire les caract\00E9ristiques des \00EAtres vivants (biologie, \00E9cologie, classification).', 1)
      returning id into v_objectif_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve recherche et organise les informations recueillies dans diff\00E9rentes rubriques (biologie, \00E9cologie, classification), \00E0 partir de sorties et de documents, et r\00E9alise des fiches d''identit\00E9 d''\00EAtres vivants.', 1);

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Reproduction, croissance et d\00E9veloppement', 2)
    returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Ordonner les \00E9tapes de la vie d''une plante \00E0 fleurs (germination, croissance, formation de la fleur, formation du fruit, dispersion des graines). Mesurer la croissance d''un \00EAtre vivant au cours du temps. Distinguer chez les animaux les formes juv\00E9nile, larvaire et adulte, et les modalit\00E9s de croissance continue ou discontinue.', 1)
      returning id into v_objectif_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve positionne les diff\00E9rentes \00E9tapes de vie d''une plante sur une frise chronologique et utilise un dispositif de mesure pour \00E9valuer la croissance d''une plante ou d''un animal au cours du temps.', 1);
      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve d\00E9crit les diff\00E9rences entre forme juv\00E9nile, larvaire et adulte \00E0 partir d''observations directes d''un \00E9levage, et exploite des mesures pour mettre en \00E9vidence la croissance continue (mammif\00E8res) ou discontinue (insectes).', 2);

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Locomotion chez les animaux', 3)
    returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_objectif, U&'D\00E9crire les organes locomoteurs et les associer \00E0 un mode de locomotion. D\00E9crire les similitudes de forme entre les structures locomotrices et les relier au mode de d\00E9placement dans un milieu de vie donn\00E9.', 1)
      returning id into v_objectif_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve identifie les organes locomoteurs par l''observation d''\00EAtres vivants en mouvement, et met en relation la forme de l''organe locomoteur, le milieu de vie et le mode de d\00E9placement (aile, patte, nageoire).', 1);

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Observer et d\00E9crire son environnement proche', 4)
    returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Observer des environnements vari\00E9s pour \00E9largir la connaissance des \00EAtres vivants, de leurs interactions et de leurs milieux de vie. \00C9laborer une courte chaine alimentaire. Envisager le sol comme un milieu vivant.', 1)
      returning id into v_objectif_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Au cours de sorties ou d''une classe de d\00E9couverte, l''\00E9l\00E8ve nomme les \00EAtres vivants, leur groupe dans la classification du vivant, et d\00E9crit leur mode de vie.', 1);
      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve construit une courte chaine alimentaire et d\00E9couvre la diversit\00E9 des \00EAtres vivants du sol (vers de terre, insectes, myriapodes, cloportes, champignons).', 2);

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Agir pour prot\00E9ger l''environnement', 5)
    returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Identifier les cons\00E9quences positives et n\00E9gatives de certaines activit\00E9s humaines sur un environnement. S''impliquer dans un projet collectif de pr\00E9servation de l''environnement en lien avec la transition \00E9cologique.', 1)
      returning id into v_objectif_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'\00C0 partir d''une \00E9tude de cas simple, l''\00E9l\00E8ve observe et d\00E9crit les effets de certaines activit\00E9s humaines sur l''environnement (modification de la biodiversit\00E9, pollution) et prend une place active dans un projet collectif visant \00E0 prot\00E9ger l''environnement.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_sciences_id, v_type_sous_domaine, U&'Le corps humain et la sant\00E9', 3)
  returning id into v_grand_domaine_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_grand_domaine_id, v_type_sous_domaine, U&'Cours pr\00E9paratoire', 1)
  returning id into v_annee_id;

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Alimentation', 1)
    returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_objectif, U&'D\00E9couvrir et nommer les cat\00E9gories d''aliments et leur origine, en utilisant le vocabulaire associ\00E9.', 1)
      returning id into v_objectif_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve cat\00E9gorise diff\00E9rents aliments (fruits et l\00E9gumes, viandes/poissons/\0153ufs, produits laitiers, f\00E9culents et c\00E9r\00E9ales, mati\00E8res grasses, boissons) et associe des exemples d''aliments \00E0 leur origine (animale, v\00E9g\00E9tale, min\00E9rale, transform\00E9e).', 1);

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Croissance et mouvement', 2)
    returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_objectif, U&'D\00E9crire le sch\00E9ma corporel et nommer les principales articulations et quelques os associ\00E9s du squelette. Rep\00E9rer sur soi et sur une maquette simple les \00E9l\00E9ments permettant la r\00E9alisation d''un mouvement corporel.', 1)
      returning id into v_objectif_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve localise et nomme les parties du corps, les articulations et quelques os sur lui-m\00EAme, une maquette ou des documents, et distingue les articulations de rotation (cou, \00E9paule, poignet) des articulations de flexion/extension (coude, genou).', 1);

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Sant\00E9 et hygi\00E8ne de vie', 3)
    returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Observer son rythme d''activit\00E9 quotidien. Identifier quelques r\00E8gles d''hygi\00E8ne de vie au quotidien et les relier \00E0 sa sant\00E9.', 1)
      returning id into v_objectif_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve repr\00E9sente les moments de sa journ\00E9e sur une frise chronologique en les reliant \00E0 l''intensit\00E9 de l''activit\00E9, et fait le lien entre les r\00E8gles d''hygi\00E8ne de vie (sommeil, alimentation, activit\00E9 physique, lavage, \00E9crans) et leur b\00E9n\00E9fice pour la sant\00E9.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_grand_domaine_id, v_type_sous_domaine, U&'Cours \00E9l\00E9mentaire premi\00E8re ann\00E9e', 2)
  returning id into v_annee_id;

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Alimentation', 1)
    returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Identifier les apports sp\00E9cifiques des aliments (source d''\00E9nergie, d''eau, de min\00E9raux, de mati\00E8re). \00C9tablir la notion d''\00E9quilibre alimentaire.', 1)
      returning id into v_objectif_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve associe les aliments \00E0 leurs apports sp\00E9cifiques et mobilise les principes d''une alimentation \00E9quilibr\00E9e pour analyser et composer des menus.', 1);

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Croissance et mouvement', 2)
    returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Utiliser des instruments de mesure pour suivre la croissance du corps, en particulier du squelette. Comparer la croissance de diff\00E9rentes personnes pour prendre conscience de la diversit\00E9 morphologique. Observer les modifications de la dentition au cours de la croissance.', 1)
      returning id into v_objectif_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve suit la croissance de certains organes (pied, main) avec un m\00E8tre-ruban, et analyse des donn\00E9es de taille, masse et pointure pour prendre conscience de la diversit\00E9 entre individus et respecter les diff\00E9rences.', 1);
      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve identifie la structure des dents et observe les diff\00E9rences entre dents de lait et dents d\00E9finitives.', 2);

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Sant\00E9 et hygi\00E8ne de vie', 3)
    returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Identifier quelques r\00E8gles d''hygi\00E8ne de vie au quotidien et les relier \00E0 sa sant\00E9. Prendre conscience du r\00F4le que joue l''attention cognitive dans les apprentissages.', 1)
      returning id into v_objectif_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve identifie les \00E9l\00E9ments cl\00E9s de l''hygi\00E8ne buccodentaire (\00E9tapes et dur\00E9e du brossage, protection de l''\00E9mail et des gencives).', 1);
      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve d\00E9couvre ce qu''est l''attention et identifie des facteurs qui favorisent la concentration ou peuvent constituer des sources de distraction.', 2);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_grand_domaine_id, v_type_sous_domaine, U&'Cours \00E9l\00E9mentaire deuxi\00E8me ann\00E9e', 3)
  returning id into v_annee_id;

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Croissance et mouvement', 1)
    returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Mod\00E9liser un mouvement de flexion/extension pour identifier le r\00F4le des muscles et des articulations. Observer les changements corporels pendant l''activit\00E9 physique. Relier l''activit\00E9 physique avec la variation du rythme respiratoire et du rythme cardiaque.', 1)
      returning id into v_objectif_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve manipule ou fabrique un mod\00E8le de membre pour comprendre le r\00F4le de la contraction des muscles et des articulations, et identifie les muscles qui permettent de plier et de tendre le bras.', 1);
      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve compare, au repos et apr\00E8s une activit\00E9 physique, diff\00E9rents param\00E8tres corporels (respiration, pouls, transpiration) et mesure le nombre de mouvements respiratoires et le pouls avant, pendant et apr\00E8s des exercices.', 2);

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Sant\00E9 et hygi\00E8ne de vie', 2)
    returning id into v_theme_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Constater le lien entre la pratique physique r\00E9guli\00E8re et le bien-\00EAtre. Se familiariser avec quelques notions sur le fonctionnement du cerveau pour mieux apprendre.', 1)
      returning id into v_objectif_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve exprime ses \00E9motions apr\00E8s des activit\00E9s physiques et identifie le b\00E9n\00E9fice d''une activit\00E9 physique r\00E9guli\00E8re ; il met en place des m\00E9thodes d''apprentissage (concentration, r\00E9flexion, entrainement, r\00E9p\00E9tition, relecture).', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_sciences_id, v_type_sous_domaine, U&'Les objets techniques au c\0153ur de la soci\00E9t\00E9', 4)
  returning id into v_grand_domaine_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_grand_domaine_id, v_type_sous_domaine, U&'Cours pr\00E9paratoire', 1)
  returning id into v_annee_id;

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Identifier qu''un objet technique est obtenu par intervention des \00EAtres humains.', 1)
    returning id into v_objectif_id;

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'\00C0 partir d''un ensemble d''objets propos\00E9s (stylo, branche d''arbre, feuille, gomme, r\00E8gle), l''\00E9l\00E8ve fait un tri entre objets techniques et non techniques en pointant leurs caract\00E9ristiques.', 1);
    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve comprend que certains objets techniques sont fabriqu\00E9s directement \00E0 partir de mat\00E9riaux bruts, alors que d''autres le sont apr\00E8s plusieurs transformations complexes.', 2);

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Identifier des activit\00E9s de la vie quotidienne faisant appel \00E0 des objets techniques r\00E9pondant \00E0 un besoin.', 2)
    returning id into v_objectif_id;

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve observe dans des situations du quotidien les objets techniques utilis\00E9s (comment s''habiller en fonction de la m\00E9t\00E9o, comment se d\00E9placer) et identifie \00E0 quels besoins ils apportent des solutions.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_grand_domaine_id, v_type_sous_domaine, U&'Cours \00E9l\00E9mentaire premi\00E8re ann\00E9e', 2)
  returning id into v_annee_id;

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Identifier les diff\00E9rentes parties d''un objet technique en les caract\00E9risant par leur forme, leur mat\00E9riau et leur fonction.', 1)
    returning id into v_objectif_id;

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve observe et nomme les diff\00E9rentes parties d''un objet technique (doublure et fermetures d''un manteau, coque et sangle d''un casque de v\00E9lo) et relie les caract\00E9ristiques des parties \00E0 leurs r\00F4les.', 1);

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Diff\00E9rencier les objets selon qu''ils utilisent ou non une source d''\00E9nergie \00E9lectrique. Identifier le cas \00E9ch\00E9ant l''int\00E9r\00EAt de l''utilisation de l''\00E9nergie \00E9lectrique.', 2)
    returning id into v_objectif_id;

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve trie des objets techniques suivant l''utilisation ou non d''une source d''\00E9nergie \00E9lectrique, et compare par exemple un batteur \00E9lectrique et un batteur manuel pour indiquer l''int\00E9r\00EAt de l''\00E9nergie \00E9lectrique.', 1);

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_annee_id, v_type_objectif, U&'R\00E9aliser une maquette simple avec un circuit \00E9lectrique. Identifier les composants et leurs fonctions.', 3)
    returning id into v_objectif_id;

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve r\00E9alise une maquette d''objet technique utilisant un circuit \00E9lectrique simple (\00E9clairage d''une voiture ou d''un lampadaire) et assemble correctement une pile, des c\00E2bles, un interrupteur et une ampoule.', 1);

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Commander un robot avec des consignes simples en programmant un d\00E9placement.', 4)
    returning id into v_objectif_id;

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve obtient le d\00E9placement d''un robot en lui donnant des consignes simples (avancer, pivoter).', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_grand_domaine_id, v_type_sous_domaine, U&'Cours \00E9l\00E9mentaire deuxi\00E8me ann\00E9e', 3)
  returning id into v_annee_id;

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Identifier les dispositifs permettant la saisie, le traitement et la restitution d''informations (clavier, processeur, \00E9cran).', 1)
    returning id into v_objectif_id;

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve observe et nomme les diff\00E9rents \00E9l\00E9ments d''un ordinateur et fait le lien avec des technologies plus compactes (tablettes, smartphones).', 1);

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Utiliser un ordinateur ou une tablette num\00E9rique pour saisir un texte. Utiliser un moteur de recherche.', 2)
    returning id into v_objectif_id;

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve saisit un texte \00E0 l''aide d''un logiciel de traitement de texte, utilise le correcteur orthographique, sauvegarde son travail, et exploite un moteur de recherche pour obtenir une information.', 1);

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Comprendre qu''un objet technique peut \00EAtre un assemblage de pi\00E8ces. Identifier les diff\00E9rentes pi\00E8ces d''un objet technique en r\00E9alisant des assemblages simples.', 3)
    returning id into v_objectif_id;

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve identifie les pi\00E8ces d''un objet technique en le d\00E9montant puis en le remontant (pince \00E0 linge, essoreuse \00E0 salade, stylo \00E0 bille, lampe de poche).', 1);

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Comprendre que, pour un besoin identifi\00E9, il existe une diversit\00E9 d''objets y r\00E9pondant.', 4)
    returning id into v_objectif_id;

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve prend conscience de la vari\00E9t\00E9 d''objets techniques r\00E9pondant \00E0 un besoin, par exemple en \00E9tudiant diff\00E9rents types de cordes \00E0 sauter.', 1);

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Initier \00E0 la programmation d''objets techniques par des algorithmes simples.', 5)
    returning id into v_objectif_id;

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve r\00E9alise un programme par blocs permettant \00E0 un robot de se d\00E9placer en suivant un parcours simple impos\00E9, et identifie le programme correspondant au d\00E9placement observ\00E9 d''un robot.', 1);

  raise notice 'Sciences et technologie (cycle 2) importee.';
end $$;