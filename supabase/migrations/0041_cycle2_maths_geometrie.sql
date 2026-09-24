-- Import du programme officiel cycle 2 -- Mathematiques > Espace et
-- geometrie, extrait directement du PDF officiel fourni par
-- l'utilisatrice (Annexe 4, BO du 31 octobre 2024).

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
    and type_element_id = v_type_sous_domaine and libelle = U&'Espace et g\00E9om\00E9trie';

  if v_domaine_id is not null then
    raise notice 'Espace et geometrie (cycle 2) deja importe -- rien a faire.';
    return;
  end if;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_maths_id, v_type_sous_domaine, U&'Espace et g\00E9om\00E9trie', 3)
  returning id into v_domaine_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_domaine_id, v_type_sous_domaine, U&'Cours pr\00E9paratoire', 1)
  returning id into v_annee_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Les solides', 1)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Reconnaitre les solides usuels suivants : cube, boule, c\00F4ne, cylindre, pav\00E9. Nommer un cube, un pav\00E9 et une boule. D\00E9crire un cube ou un pav\00E9 en utilisant le terme face, connaitre le nombre et la nature des faces d''un cube et d''un pav\00E9. Construire des cubes et des pav\00E9s.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Un ensemble de solides \00E9tant donn\00E9, l''\00E9l\00E8ve sait identifier lesquels sont des boules, des cubes, des cylindres, des pav\00E9s ou des c\00F4nes.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait rep\00E9rer des solides simples dans son environnement : une boite \00E0 chaussures a la forme d''un pav\00E9, une boite de conserve a la forme d''un cylindre, une balle de tennis a la forme d''une boule.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Un cube ou un pav\00E9 lui \00E9tant donn\00E9, l''\00E9l\00E8ve sait le nommer et le d\00E9crire en parlant de ses faces : nombre de faces et nature des faces (carr\00E9 ou rectangle).', 3);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'\00C0 partir d''un mod\00E8le, l''\00E9l\00E8ve assemble les diff\00E9rentes faces d''un cube ou d''un pav\00E9 pour le reproduire.', 4);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'La g\00E9om\00E9trie plane', 2)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Reconnaitre des formes planes (disque, carr\00E9, rectangle et triangle) dans un assemblage et dans son environnement proche. Nommer le disque, le carr\00E9, le rectangle et le triangle. Donner une premi\00E8re description du carr\00E9, du rectangle, du triangle en utilisant les termes sommet et c\00F4t\00E9.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Un ensemble de formes planes lui \00E9tant donn\00E9 (pi\00E8ces d''un puzzle g\00E9om\00E9trique comme le tangram, figures d\00E9coup\00E9es en carton, etc.), l''\00E9l\00E8ve sait les identifier.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Un triangle, un carr\00E9 ou un rectangle lui \00E9tant donn\00E9, l''\00E9l\00E8ve sait le nommer et justifier sa r\00E9ponse en donnant son nombre de c\00F4t\00E9s et en mentionnant les longueurs de c\00F4t\00E9s \00E9gales pour le carr\00E9 et le rectangle.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait donner le nombre de sommets et le nombre de c\00F4t\00E9s d''un polygone qui lui est pr\00E9sent\00E9.', 3);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Rep\00E9rer visuellement des alignements. Utiliser la r\00E8gle pour rep\00E9rer ou v\00E9rifier des alignements. Utiliser la r\00E8gle comme instrument de trac\00E9. Construire un carr\00E9, un rectangle, un triangle ou un assemblage de ces figures sur du papier quadrill\00E9 ou point\00E9.', 2)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait dire si trois points sont align\00E9s ou non en utilisant la r\00E8gle dans les cas o\00F9 la r\00E9ponse n''est pas perceptible de fa\00E7on \00E9vidente.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve trace une droite passant par deux points \00E0 l''aide d''une r\00E8gle.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve trace des figures simples \00E0 l''aide de gabarits et de pochoirs, puis reproduit, compl\00E8te et construit des figures simples, d''abord \00E0 main lev\00E9e puis avec une r\00E8gle.', 3);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Le rep\00E9rage dans l''espace', 3)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Connaitre et utiliser le vocabulaire li\00E9 aux positions relatives. Situer des personnes ou des objets les uns par rapport aux autres ou par rapport \00E0 d''autres rep\00E8res dans la classe. Construire et utiliser des repr\00E9sentations de la classe pour localiser, m\00E9moriser et communiquer un emplacement.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve comprend et utilise le vocabulaire : gauche, droite, sur, sous, entre, devant, derri\00E8re, au-dessus, en dessous.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait retrouver un objet ou un \00E9l\00E8ve dont la position dans la classe a \00E9t\00E9 d\00E9crite oralement.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait rep\00E9rer la position de ses camarades sur un plan de la classe.', 3);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Construire et reproduire des assemblages de solides \00E0 partir d''un mod\00E8le en trois dimensions ou de repr\00E9sentations planes. Se d\00E9placer et d\00E9crire des d\00E9placements dans la classe en s''orientant et en utilisant des rep\00E8res. Construire et utiliser un plan de la classe pour communiquer un d\00E9placement. Utiliser et produire une suite d''instructions qui codent un d\00E9placement en utilisant un vocabulaire spatial pr\00E9cis.', 2)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve comprend et utilise les instructions suivantes : avancer, reculer, tourner \00E0 droite, tourner \00E0 gauche, monter, descendre.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait coder un d\00E9placement qu''un autre \00E9l\00E8ve doit ensuite effectuer, par exemple : avancer de deux pas, tourner \00E0 droite, reculer de trois pas.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Si un robot est disponible, l''\00E9l\00E8ve peut programmer son d\00E9placement sur un tapis quadrill\00E9 (avancer d''une case, pivoter d''un quart de tour \00E0 droite ou \00E0 gauche). Les d\00E9placements \00E0 programmer comprennent au maximum dix instructions, dont deux virages.', 3);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_domaine_id, v_type_sous_domaine, U&'Cours \00E9l\00E9mentaire premi\00E8re ann\00E9e', 2)
  returning id into v_annee_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Les solides', 1)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Reconnaitre les solides usuels suivants : cube, boule, c\00F4ne, pyramide, cylindre, pav\00E9. Nommer un cube, une boule, un pav\00E9, un c\00F4ne ou une pyramide. D\00E9crire un cube, un pav\00E9 ou une pyramide en utilisant les termes face, sommet et ar\00EAte. Connaitre le nombre et la nature des faces d''un cube ou d''un pav\00E9. Construire un cube, un pav\00E9 droit ou une pyramide.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Un pav\00E9, un cube ou une pyramide \00E0 base carr\00E9e lui \00E9tant donn\00E9, l''\00E9l\00E8ve sait le nommer, d\00E9crire ses faces (carr\00E9s, rectangles, triangles) et donner le nombre de ses ar\00EAtes et de ses sommets.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait d\00E9nombrer les faces, les ar\00EAtes et les sommets d''un poly\00E8dre qui lui est pr\00E9sent\00E9.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'\00C0 partir d''un mod\00E8le, l''\00E9l\00E8ve reproduit un poly\00E8dre en assemblant ses faces ou ses ar\00EAtes et ses sommets.', 3);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'La g\00E9om\00E9trie plane', 2)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Utiliser le vocabulaire g\00E9om\00E9trique appropri\00E9. Reconnaitre, nommer et d\00E9crire un cercle, un carr\00E9, un rectangle, un triangle, un triangle rectangle en utilisant le vocabulaire appropri\00E9. Connaitre les propri\00E9t\00E9s des angles et des \00E9galit\00E9s de longueur pour les carr\00E9s et les rectangles.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve utilise \00E0 bon escient le vocabulaire g\00E9om\00E9trique usuel : carr\00E9, rectangle, triangle, triangle rectangle, c\00F4t\00E9, sommet, angle, disque, cercle, centre, point, droite, segment, milieu d''un segment, angle droit, angle aigu, angle obtus.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait dire qu''un rectangle a quatre sommets, quatre angles droits, quatre c\00F4t\00E9s et que les c\00F4t\00E9s oppos\00E9s ont la m\00EAme longueur.', 2);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Reproduire ou construire un carr\00E9, un rectangle, un triangle, un triangle rectangle et un cercle ou un assemblage de ces figures. Utiliser la r\00E8gle pour v\00E9rifier des alignements et l''\00E9querre pour v\00E9rifier qu''un angle est droit. Utiliser la r\00E8gle gradu\00E9e, l''\00E9querre et le compas comme instruments de trac\00E9. Connaitre et utiliser le code pour les angles droits.', 2)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Sur du papier quadrill\00E9, point\00E9 ou uni, l''\00E9l\00E8ve sait compl\00E9ter ou tracer un carr\00E9, un rectangle, un triangle ou un triangle rectangle avec une r\00E8gle et une \00E9querre.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait tracer un cercle avec un compas, notamment le cercle de centre un point donn\00E9 et passant par un autre point donn\00E9.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait trouver le milieu d''un segment par pliage, et indiquer qu''un angle est droit en utilisant le code usuel.', 3);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Le rep\00E9rage dans l''espace', 3)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Connaitre et utiliser le vocabulaire li\00E9 aux positions relatives. Situer des personnes ou des objets les uns par rapport aux autres ou par rapport \00E0 d''autres rep\00E8res dans un espace familier. Construire et utiliser des repr\00E9sentations d''un espace familier pour localiser, m\00E9moriser ou communiquer un emplacement.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve comprend et utilise le vocabulaire : \00E0 gauche, \00E0 droite, sur, sous, entre, devant, derri\00E8re, au-dessus, en dessous, pr\00E8s, loin.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve produit un plan de l''\00E9cole sur lequel il positionne sa classe, la cantine, les toilettes, le bureau du directeur ou de la directrice, etc.', 2);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Construire des assemblages de cubes et de pav\00E9s. Comprendre, utiliser et produire une suite d''instructions qui codent un d\00E9placement en utilisant un vocabulaire spatial pr\00E9cis.', 2)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait repr\00E9senter sur un plan de la ville, du quartier ou de l''\00E9cole un itin\00E9raire qu''il a effectu\00E9.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Si un robot est disponible, l''\00E9l\00E8ve sait programmer son d\00E9placement sur un tapis quadrill\00E9. Les d\00E9placements \00E0 programmer comprennent au maximum quinze instructions, dont quatre virages.', 2);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_domaine_id, v_type_sous_domaine, U&'Cours \00E9l\00E9mentaire deuxi\00E8me ann\00E9e', 3)
  returning id into v_annee_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Les solides', 1)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Nommer un cube, une boule, un pav\00E9, un c\00F4ne, une pyramide ou un cylindre. D\00E9crire un cube, un pav\00E9 ou une pyramide en utilisant les termes face, sommet et ar\00EAte. Connaitre le nombre et la nature des faces d''un cube ou d''un pav\00E9. Connaitre la nature des faces d''une pyramide. Construire un cube, un pav\00E9 ou une pyramide. Construire un cube \00E0 partir d''un patron.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Un pav\00E9, un cube ou une pyramide \00E0 base polygonale lui \00E9tant donn\00E9, l''\00E9l\00E8ve sait le nommer et justifier sa nature en indiquant le nombre et la nature de ses faces et le nombre de ses sommets et de ses ar\00EAtes.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait que les faces d''une pyramide sont des triangles ayant un sommet commun, \00E0 l''exception \00E9ventuelle de la base, un polygone ayant trois c\00F4t\00E9s ou plus.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait dire si un assemblage de polygones est ou non un patron d''un cube, en argumentant sur le nombre de faces, la nature des faces et la position des faces les unes par rapport aux autres.', 3);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'La g\00E9om\00E9trie plane', 2)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Utiliser le vocabulaire g\00E9om\00E9trique appropri\00E9. Reconnaitre, nommer et d\00E9crire le carr\00E9, le rectangle, le triangle, le triangle rectangle et le losange. Connaitre les propri\00E9t\00E9s des angles et les \00E9galit\00E9s de longueur pour les carr\00E9s, les rectangles et les losanges.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve utilise \00E0 bon escient le vocabulaire g\00E9om\00E9trique usuel : polygone, triangle, quadrilat\00E8re, pentagone, hexagone, losange, diagonale, longueur et largeur du rectangle, disque, cercle, centre, rayon, diam\00E8tre.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait dire qu''un losange a quatre sommets et quatre c\00F4t\00E9s de m\00EAme longueur, et qu''un quadrilat\00E8re est un polygone ayant quatre c\00F4t\00E9s et quatre sommets.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait dire qu''un quadrilat\00E8re n''est pas d''une nature donn\00E9e en s''appuyant sur une propri\00E9t\00E9, par exemple : ce n''est pas un carr\00E9 car l''un de ses angles n''est pas un angle droit.', 3);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Reproduire ou construire un carr\00E9, un rectangle, un triangle, un triangle rectangle et un cercle ou des assemblages de ces figures, avec une r\00E8gle gradu\00E9e, une \00E9querre ou un compas. Connaitre et utiliser le codage d''un angle droit et celui qui indique que des segments ont la m\00EAme longueur.', 2)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait construire sur papier uni un rectangle de longueur 7 cm et de largeur 3 cm, un carr\00E9 de c\00F4t\00E9 6 cm avec un cercle de rayon 4 cm centr\00E9 sur un de ses sommets, ou un triangle rectangle dont les c\00F4t\00E9s de l''angle droit mesurent 10 cm et 4 cm.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait indiquer sur un rectangle les codes pour les quatre angles droits et des codes signalant l''\00E9galit\00E9 des longueurs des c\00F4t\00E9s oppos\00E9s.', 2);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Reconnaitre si une figure poss\00E8de un ou plusieurs axes de sym\00E9trie en utilisant des pliages ou du papier calque. Compl\00E9ter, sur une feuille quadrill\00E9e ou point\00E9e, une figure simple pour la rendre sym\00E9trique par rapport \00E0 un axe donn\00E9.', 3)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve reconnait des figures ayant un axe de sym\00E9trie et rep\00E8re les \00E9ventuels axes de sym\00E9trie sur des repr\00E9sentations planes d''objets usuels (coeur, tr\00E8fle, panneaux routiers, lettres majuscules, etc.).', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve compl\00E8te une figure sur une feuille quadrill\00E9e ou point\00E9e pour la rendre sym\00E9trique, l''axe \00E9tant vertical ou horizontal.', 2);

  raise notice 'Espace et geometrie (cycle 2) importe.';
end $$;