-- Import du programme officiel EPS cycle 2 (BO n22 du 28 mai 2026),
-- applicable au CP des la rentree 2026-2027. Ce texte couvre deja
-- integralement les trois annees (CP/CE1/CE2) meme si son
-- application officielle pour CE1/CE2 n'intervient qu'en 2027-2028 :
-- il n'y aura donc pas besoin d'y revenir avec le bloc groupe 2020
-- pour ces deux annees. Structure : domaine (4 grands domaines
-- moteurs) > annee > theme nomme > objectif > exemple.

do $$
declare
  v_cycle2_id uuid;
  v_type_domaine uuid;
  v_type_sous_domaine uuid;
  v_type_objectif uuid;
  v_type_exemple uuid;
  v_eps_id uuid;
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

  select id into v_eps_id from elements_programme
  where cycle_id = v_cycle2_id and type_element_id = v_type_domaine
    and libelle = U&'\00C9ducation physique et sportive';

  if v_eps_id is not null then
    raise notice 'EPS (cycle 2) deja importee -- rien a faire.';
    return;
  end if;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, null, v_type_domaine, U&'\00C9ducation physique et sportive', 7)
  returning id into v_eps_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_eps_id, v_type_sous_domaine, U&'Se d\00E9placer pour agir dans l''espace et sur une dur\00E9e', 1)
  returning id into v_grand_domaine_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_grand_domaine_id, v_type_sous_domaine, U&'Cours pr\00E9paratoire', 1)
  returning id into v_annee_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Se d\00E9placer le plus vite ou le plus longtemps possible', 1)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'D\00E9couvrir une diversit\00E9 de signaux de d\00E9part. Courir vite de fa\00E7on \00E9quilibr\00E9e.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve identifie le signal de d\00E9part (sonore, visuel, tactile) et s''\00E9lance avec r\00E9activit\00E9, en regardant loin devant lui et en restant dans l''espace d\00E9volu \00E0 sa course.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Courir et franchir sans ralentir des obstacles horizontaux.', 2)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve franchit plusieurs obstacles horizontaux (type rivi\00E8re) sans ralentir sa course, avec le pied droit puis le pied gauche, puis en alternant le pied d''impulsion.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Courir longtemps en limitant les arr\00EAts.', 3)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve r\00E9duit le nombre d''arr\00EAts dans un espace de course am\00E9nag\00E9 autorisant des zones de marche (contrats de course) ; les \00E9l\00E8ves courent en groupe pour parcourir la plus grande distance possible sur une dur\00E9e donn\00E9e.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Se d\00E9placer pour sauter le plus haut ou le plus loin possible', 2)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Varier les impulsions pour sauter loin ou haut.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve saute vers l''avant et sans \00E9lan pour franchir un obstacle horizontal en variant les impulsions (pieds joints, un pied puis l''autre), et saute pour atteindre des zones de plus en plus hautes ou \00E9loign\00E9es.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Se d\00E9placer pour lancer le plus loin possible', 3)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Lancer loin et de mani\00E8re vari\00E9e diff\00E9rents objets.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve lance des objets vari\00E9s (balle, vortex, cerceaux) en visant des zones plus ou moins \00E9loign\00E9es, de mani\00E8re diff\00E9rente (\00E0 deux mains, \00E0 une main), en mobilisant ses jambes et en basculant le haut du corps vers l''avant.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Se d\00E9placer pour s''orienter dans l''espace', 4)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Rep\00E9rer des \00E9l\00E9ments visibles pour se situer dans un espace connu.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve identifie et nomme les symboles pr\00E9sents sur un plan et les reconnait sur le terrain, se situe sur un plan en reconnaissant des \00E9l\00E9ments remarquables situ\00E9s \00E0 proximit\00E9, trouve une balise facilement identifiable \00E0 l''aide d''un plan.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Recueillir et appr\00E9cier des r\00E9sultats', 5)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Explorer et utiliser des outils de mesure concrets.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve rep\00E8re la zone qui mat\00E9rialise le r\00E9sultat de son action motrice ou celle d''un camarade, et mesure ses progr\00E8s gr\00E2ce \00E0 des rep\00E8res concrets qui mat\00E9rialisent le r\00E9sultat de ses actions.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_grand_domaine_id, v_type_sous_domaine, U&'Cours \00E9l\00E9mentaire premi\00E8re ann\00E9e', 2)
  returning id into v_annee_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Se d\00E9placer le plus vite ou le plus longtemps possible', 1)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Se pr\00E9parer au signal de d\00E9part. Courir vite et de fa\00E7on coordonn\00E9e.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve est immobile avant le d\00E9part et attentif au signal ; il court vite en slalomant entre des petits objets, en variant la direction de ses d\00E9placements.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Courir et franchir sans ralentir des obstacles verticaux.', 2)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve franchit un obstacle vertical plac\00E9 en de\00E7\00E0 de la hauteur de son genou sans ralentir sa course, avec le pied droit puis le pied gauche.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Courir longtemps sans s''arr\00EAter.', 3)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve court sans s''arr\00EAter sur une dur\00E9e de course donn\00E9e et r\00E9ussit un contrat de course adapt\00E9 \00E0 ses capacit\00E9s.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Se d\00E9placer pour sauter le plus haut ou le plus loin possible', 2)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Construire une impulsion avec un pied d''appel pour sauter loin ou haut.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve r\00E9alise des foul\00E9es bondissantes vers l''avant, effectue une succession de bonds vers le haut, et identifie le pied avec lequel il pr\00E9f\00E8re sauter.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Se d\00E9placer pour lancer le plus loin possible', 3)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Lancer loin et dans l''axe diff\00E9rents objets.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve lance un objet loin en le faisant passer au-dessus d''un obstacle vertical, dans les limites de la zone de lancer.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Se d\00E9placer pour s''orienter dans l''espace', 4)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Rep\00E9rer des \00E9l\00E9ments visibles pour s''orienter dans un espace connu.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve oriente son plan \00E0 l''aide des \00E9l\00E9ments remarquables situ\00E9s sur le terrain, ajuste l''orientation de son plan \00E0 chaque changement de direction, et se situe sur le plan \00E0 chaque arr\00EAt.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Recueillir et appr\00E9cier des r\00E9sultats', 5)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Identifier la mesure d''un r\00E9sultat pour progresser.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve rel\00E8ve et communique les r\00E9sultats obtenus, et compare les r\00E9sultats d''un essai \00E0 l''autre pour mesurer les progr\00E8s.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_grand_domaine_id, v_type_sous_domaine, U&'Cours \00E9l\00E9mentaire deuxi\00E8me ann\00E9e', 3)
  returning id into v_annee_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Se d\00E9placer le plus vite ou le plus longtemps possible', 1)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'R\00E9agir vite au signal de d\00E9part. Courir vite et de fa\00E7on coordonn\00E9e.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve r\00E9agit vite \00E0 un signal sonore et court vite en adaptant sa foul\00E9e aux contraintes (espaces diff\00E9rents entre des lattes, des plots), sans ralentir.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Courir et franchir sans ralentir des obstacles verticaux.', 2)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve franchit plusieurs obstacles verticaux plac\00E9s en de\00E7\00E0 de la hauteur de son genou sans ralentir sa course, en alternant le pied d''impulsion.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Courir longtemps sans s''arr\00EAter.', 3)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve court sans s''arr\00EAter sur une dur\00E9e de course de plus en plus longue, et choisit un contrat de course adapt\00E9 \00E0 ses capacit\00E9s.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Se d\00E9placer pour sauter le plus haut ou le plus loin possible', 2)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Construire une impulsion avec un pied d''appel pour sauter loin ou haut.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve identifie son pied d''appel pr\00E9f\00E9rentiel en comparant les distances atteintes ou les hauteurs franchies, effectue des sauts exclusivement avec son pied d''appel, et mobilise ses bras pour sauter plus loin ou plus haut.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Se d\00E9placer pour lancer le plus loin possible', 3)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Lancer loin et dans l''axe diff\00E9rents objets.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve lance \00E0 deux mains un petit ballon lest\00E9 avec une pouss\00E9e du bas vers le haut, ou lance une balle, un vortex ou un petit javelot en mousse avec une flexion du bras dite \00E0 bras cass\00E9.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Se d\00E9placer pour s''orienter dans l''espace', 4)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Rep\00E9rer des \00E9l\00E9ments visibles pour s''orienter dans un espace connu.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve trouve deux balises facilement identifiables \00E0 moins de vingt m\00E8tres de sa position \00E0 l''aide d''un plan, et marche pour mieux s''orienter (l''orientation prime sur la course).', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Recueillir et appr\00E9cier des r\00E9sultats', 5)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Identifier la mesure d''un r\00E9sultat pour progresser.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve applique des principes pour s''am\00E9liorer d''un essai \00E0 l''autre et comprend l''int\00E9r\00EAt de la mesure d''un r\00E9sultat pour modifier son attitude et son action.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_eps_id, v_type_sous_domaine, U&'Construire des \00E9quilibres pour s''adapter \00E0 des environnements inhabituels', 2)
  returning id into v_grand_domaine_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_grand_domaine_id, v_type_sous_domaine, U&'Cours pr\00E9paratoire', 1)
  returning id into v_annee_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Construire des \00E9quilibres dans des environnements terrestres', 1)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Explorer un nouvel \00E9quilibre avec le corps qui roule vers l''avant.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve effectue une roulade avant \00E0 partir d''un contre haut avec le menton coll\00E9 \00E0 la poitrine, en variant sa position de d\00E9part (jambes tendues, \00E0 genoux, accroupi).', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Explorer un nouvel \00E9quilibre de suspension en l''air avec le corps droit.', 2)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve effectue un saut avec le corps droit sur une surface plane apr\00E8s une impulsion sur deux pieds, et se r\00E9ceptionne en \00E9quilibre.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Explorer un nouvel \00E9quilibre avec le corps qui se renverse. Explorer un nouvel \00E9quilibre avec le corps en mouvement sur une surface r\00E9duite.', 3)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve se d\00E9place sur plusieurs m\00E8tres en quadrup\00E9die avec le bassin au-dessus de la ligne des \00E9paules, et se d\00E9place sur un banc avec les bras \00E9cart\00E9s, sans tomber.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Explorer un nouvel \00E9quilibre vertical en se d\00E9pla\00E7ant sur un support vertical (espalier, mur d''escalade, corde).', 4)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'En situation de grimpe (hauteur inf\00E9rieure \00E0 trois m\00E8tres), l''\00E9l\00E8ve ose se d\00E9placer sur un parcours constitu\00E9 de plusieurs grosses prises, en limitant les arr\00EAts ou les retours au sol.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Construire des \00E9quilibres avec un moyen de locomotion', 2)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Rouler et glisser, avec un moyen de locomotion, en ligne droite.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve maintient son \00E9quilibre sur un moyen de locomotion (v\00E9lo, roller, patinette) pour r\00E9aliser un parcours en ligne droite, regarde devant lui, freine puis s''arr\00EAte en posant un pied au sol.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Construire des \00E9quilibres dans un environnement aquatique', 3)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Explorer le milieu aquatique et d\00E9couvrir une nouvelle locomotion.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve entre et sort seul dans l''eau, s''\00E9loigne progressivement du bord, se d\00E9place avec les \00E9paules immerg\00E9es, et accepte de mettre la t\00EAte sous l''eau en bloquant sa respiration.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Agir en toute s\00E9curit\00E9', 4)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Respecter les r\00E8gles pour ne pas se mettre en danger.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve connait et respecte les positions de d\00E9part et d''arriv\00E9e, attend le signal de d\00E9part avant de s''engager dans le parcours, connait et respecte les limites de la zone dans laquelle il \00E9volue.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_grand_domaine_id, v_type_sous_domaine, U&'Cours \00E9l\00E9mentaire premi\00E8re ann\00E9e', 2)
  returning id into v_annee_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Construire des \00E9quilibres dans des environnements terrestres', 1)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Construire un nouvel \00E9quilibre avec le corps qui roule vers l''avant.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve effectue une roulade avant sur une surface plane avec le menton coll\00E9 \00E0 la poitrine, dans l''axe, et termine en \00E9quilibre.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Construire un nouvel \00E9quilibre de suspension en l''air avec le corps droit.', 2)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve effectue un saut avec le corps droit depuis un contre haut apr\00E8s une impulsion sur deux pieds et se r\00E9ceptionne en \00E9quilibre dans un cerceau.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Construire un nouvel \00E9quilibre avec le corps qui se renverse. Construire un nouvel \00E9quilibre avec le corps en mouvement sur une surface r\00E9duite.', 3)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'En position renvers\00E9e et les jambes en appui sur un contre haut, l''\00E9l\00E8ve aligne ses mains et ses \00E9paules (position de la planche), et se d\00E9place sans tomber sur une poutre avec les bras \00E9cart\00E9s.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Construire un nouvel \00E9quilibre vertical en se d\00E9pla\00E7ant sur un support vertical.', 4)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve se d\00E9place vers le haut puis en travers\00E9e d''un point A \00E0 un point B sans retour au sol, en dissociant et coordonnant les actions des bras et des jambes.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Construire des \00E9quilibres avec un moyen de locomotion', 2)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Rouler et glisser, avec un moyen de locomotion, dans des situations vari\00E9es.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve roule et glisse sur des parcours en effectuant des virages \00E0 droite et \00E0 gauche, p\00E9dale sur des trajectoires vari\00E9es, et retire ses pieds des p\00E9dales.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Construire des \00E9quilibres dans un environnement aquatique', 3)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Accepter l''action de l''eau sur son corps et construire un nouvel \00E9quilibre horizontal.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve touche le fond avec les pieds puis se laisse remonter passivement \00E0 la surface en bloquant sa respiration, se maintient un court instant en position verticale sans appui, et exp\00E9rimente la flottaison sur le ventre et sur le dos.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Agir en toute s\00E9curit\00E9', 4)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Identifier les dangers propres \00E0 l''activit\00E9 et adapter son comportement.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve reconnait des situations dangereuses pour lui ou pour les autres et adopte les comportements appropri\00E9s : il pr\00E9vient le professeur, n''engage pas un parcours o\00F9 un camarade est d\00E9j\00E0 impliqu\00E9, apporte son aide \00E0 un camarade en difficult\00E9.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_grand_domaine_id, v_type_sous_domaine, U&'Cours \00E9l\00E9mentaire deuxi\00E8me ann\00E9e', 3)
  returning id into v_annee_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Construire des \00E9quilibres dans des environnements terrestres', 1)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Construire un nouvel \00E9quilibre avec le corps qui roule vers l''avant.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve effectue une roulade avant sur une surface plane en variant sa position de d\00E9part, et adopte des positions d''arriv\00E9e diff\00E9rentes (sur deux pieds, sur un pied, accroupi, assis).', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Construire un nouvel \00E9quilibre de suspension en l''air avec le corps droit.', 2)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve effectue un saut avec le corps droit apr\00E8s une course d''\00E9lan r\00E9duite et une impulsion \00E0 deux pieds sur un tremplin, et se r\00E9ceptionne en \00E9quilibre.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Construire un nouvel \00E9quilibre avec le corps qui se renverse. Construire un nouvel \00E9quilibre avec le corps en mouvement sur une surface r\00E9duite.', 3)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'En position renvers\00E9e et les jambes en appui sur un contre haut, l''\00E9l\00E8ve aligne ses mains, ses \00E9paules et son bassin (position \00E0 l''\00E9querre), et se d\00E9place en alternant une pose des mains et une pose des pieds (saut de lapin).', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Construire un nouvel \00E9quilibre vertical en se d\00E9pla\00E7ant sur un support vertical.', 4)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve grimpe sur des parcours en travers\00E9e d''un point A \00E0 un point B avec des prises plus petites et plus espac\00E9es, en d\00E9pla\00E7ant les pieds avant les mains.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Construire des \00E9quilibres avec un moyen de locomotion', 2)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Rouler et glisser, avec un moyen de locomotion, dans des situations vari\00E9es.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve se d\00E9place en utilisant le pas du patineur, roule ou glisse entre deux plots en levant un pied, effectue un virage \00E0 droite puis \00E0 gauche, et roule en suivant un autre \00E9l\00E8ve sans le d\00E9passer.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Construire des \00E9quilibres dans un environnement aquatique', 3)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Accepter l''action de l''eau sur son corps et construire un nouvel \00E9quilibre horizontal.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve saute dans l''eau, touche le fond puis remonte passivement en bloquant sa respiration, s''allonge et flotte sur le ventre puis sur le dos en se d\00E9pla\00E7ant sur quelques m\00E8tres.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Agir en toute s\00E9curit\00E9', 4)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Identifier les dangers propres \00E0 l''activit\00E9 et adapter son comportement.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait renoncer si le parcours lui parait trop difficile et pr\00E9cise la nature du danger potentiel ; dans un espace am\00E9nag\00E9 et s\00E9curis\00E9, il s''engage dans l''activit\00E9 sans appr\00E9hension.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_eps_id, v_type_sous_domaine, U&'S''exprimer avec son corps pour \00E9prouver et partager des \00E9motions', 3)
  returning id into v_grand_domaine_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_grand_domaine_id, v_type_sous_domaine, U&'Cours pr\00E9paratoire', 1)
  returning id into v_annee_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'D\00E9velopper une motricit\00E9 \00E0 vis\00E9e artistique', 1)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Explorer des actions \00E0 vis\00E9e artistique.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Dans les activit\00E9s de danse, l''\00E9l\00E8ve mobilise tout son corps (bras, jambes, t\00EAte, mains, buste) ; dans les arts du cirque et activit\00E9s gymniques, il explore l''amplitude gestuelle.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Explorer l''espace sc\00E9nique.', 2)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Dans les activit\00E9s de danse, l''\00E9l\00E8ve adapte ses d\00E9placements en fonction de l''espace d\00E9limit\00E9 (danser tr\00E8s grand ou tr\00E8s petit) et occupe tout l''espace sans contact avec les autres.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Cr\00E9er des enchainements simples et m\00E9moris\00E9s', 2)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Reproduire un enchainement artistique.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve respecte le contenu de la phrase dans\00E9e ou de l''enchainement acrobatique, et reproduit le d\00E9but, le milieu et la fin d''une phrase chor\00E9graphi\00E9e.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'\00C9prouver et exprimer des \00E9motions', 3)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Explorer la posture d''artiste.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve accepte d''\00EAtre regard\00E9, salue le public \00E0 la fin de la prestation, et son expression corporelle traduit une \00E9motion (sauter de joie, taper des pieds de col\00E8re).', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Appr\00E9cier et d\00E9crire une prestation \00E0 l''aide d''un vocabulaire appropri\00E9.', 2)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve s''approprie un vocabulaire sp\00E9cifique pour d\00E9crire une prestation et est respectueux, silencieux et attentif pendant la prestation de ses camarades.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_grand_domaine_id, v_type_sous_domaine, U&'Cours \00E9l\00E9mentaire premi\00E8re ann\00E9e', 2)
  returning id into v_annee_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'D\00E9velopper une motricit\00E9 \00E0 vis\00E9e artistique', 1)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Reproduire des actions \00E0 vis\00E9e artistique.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Dans les activit\00E9s de danse, l''\00E9l\00E8ve reproduit des proc\00E9d\00E9s chor\00E9graphiques simples (r\00E9p\00E9tition, unisson, cascade) en s''appuyant sur une phrase musicale.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Varier ses actions dans l''espace sc\00E9nique.', 2)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Dans les activit\00E9s de danse, l''\00E9l\00E8ve reproduit des chor\00E9graphies simples en s''appuyant sur des rep\00E8res spatiaux (devant de sc\00E8ne, fond de sc\00E8ne).', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Cr\00E9er des enchainements simples et m\00E9moris\00E9s', 2)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'S''approprier un enchainement artistique.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Dans les activit\00E9s de danse, l''\00E9l\00E8ve s''approprie et m\00E9morise une phrase compos\00E9e de deux \00E0 trois mouvements ; dans les arts du cirque ou activit\00E9s gymniques, il marque le d\00E9but et la fin de l''enchainement.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'\00C9prouver et exprimer des \00E9motions', 3)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Construire une posture d''artiste.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve reste \00E0 l''\00E9coute de l''autre dans une prestation individuelle ou collective, et surmonte ses appr\00E9hensions pour r\00E9aliser l''int\00E9gralit\00E9 de sa prestation devant un public.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Appr\00E9cier une prestation selon deux ou trois crit\00E8res.', 2)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve spectateur observe avec attention ses camarades et verbalise ce qu''il a appr\00E9ci\00E9 ou non dans une prestation \00E0 partir de rep\00E8res simples.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_grand_domaine_id, v_type_sous_domaine, U&'Cours \00E9l\00E9mentaire deuxi\00E8me ann\00E9e', 3)
  returning id into v_annee_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'D\00E9velopper une motricit\00E9 \00E0 vis\00E9e artistique', 1)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Reproduire des actions \00E0 vis\00E9e artistique.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Dans les activit\00E9s de danse, en fonction des rythmes entendus, l''\00E9l\00E8ve varie ses mouvements et leur vitesse en suivant des chemins de natures vari\00E9es.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Varier ses actions dans l''espace sc\00E9nique.', 2)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Dans son num\00E9ro d''arts du cirque, l''\00E9l\00E8ve utilise la largeur, la hauteur et la profondeur pour occuper l''espace et prendre en compte le public.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Cr\00E9er des enchainements simples et m\00E9moris\00E9s', 2)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'S''approprier un enchainement artistique.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve effectue un choix d''\00E9l\00E9ments artistiques en respectant une structuration d\00E9finie (un d\00E9but, un milieu, une fin), et modifie l''amplitude de ses mouvements pour traduire une \00E9motion.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'\00C9prouver et exprimer des \00E9motions', 3)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Construire une posture d''artiste.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve prend en compte le public (se placer, se pr\00E9senter, s''exprimer) et joue un personnage.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Appr\00E9cier une prestation selon deux ou trois crit\00E8res.', 2)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve commence \00E0 justifier son appr\00E9ciation en exploitant un support (figures gymniques, code) et pr\00E9cise ce qu''il a appr\00E9ci\00E9 ou non en proposant une am\00E9lioration.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_eps_id, v_type_sous_domaine, U&'Coop\00E9rer et s''opposer pour apprendre \00E0 jouer en respectant les r\00E8gles et les autres', 4)
  returning id into v_grand_domaine_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_grand_domaine_id, v_type_sous_domaine, U&'Cours pr\00E9paratoire', 1)
  returning id into v_annee_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'D\00E9velopper des habilet\00E9s motrices dans des situations d''opposition individuelles et collectives', 1)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Maitriser des actions d''opposition simples.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Dans un jeu collectif, l''\00E9l\00E8ve court, s''arr\00EAte et change de direction, lance et attrape \00E0 deux mains ; dans un jeu de combat de pr\00E9hension, il est solide sur ses appuis et accepte le contact.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Explorer la zone de jeu dans toutes ses dimensions.', 2)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'En situation de jeu, l''\00E9l\00E8ve se d\00E9place pour explorer toutes les zones possibles et identifie les limites du terrain ou de l''aire de jeu.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Faire des choix pour marquer', 2)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Se situer pour agir seul ou \00E0 plusieurs.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve reconnait ses partenaires et ses adversaires, diff\00E9rencie jouer avec et jouer contre, et connait les diff\00E9rents r\00F4les dans une \00E9quipe (porteur de balle, attaquant, d\00E9fenseur).', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Respecter les r\00E8gles du jeu, les partenaires et les adversaires', 3)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Explorer les r\00E8gles du jeu.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve connait le but du jeu et les consignes pour agir, reformule les principales r\00E8gles avec ses propres mots, et associe les fautes aux principales r\00E8gles du jeu.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Explorer les interactions dans le jeu.', 2)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve contr\00F4le ses \00E9motions dans la victoire comme dans la d\00E9faite, et accepte de jouer avec les autres.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_grand_domaine_id, v_type_sous_domaine, U&'Cours \00E9l\00E9mentaire premi\00E8re ann\00E9e', 2)
  returning id into v_annee_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'D\00E9velopper des habilet\00E9s motrices dans des situations d''opposition individuelles et collectives', 1)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Maitriser et contr\00F4ler des actions d''opposition simples.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Dans un jeu collectif avec ballon, l''\00E9l\00E8ve \00E0 l''arr\00EAt passe le ballon avec pr\00E9cision \00E0 un partenaire proche ; dans un jeu de combat, il contr\00F4le son adversaire pour l''immobiliser au sol.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'S''adapter \00E0 la zone de jeu.', 2)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve organise ses d\00E9placements dans le respect de la zone de jeu ; dans un jeu de raquettes, il r\00E9alise un parcours avec la balle pos\00E9e sur la raquette sans la faire tomber.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Faire des choix pour marquer', 2)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Prendre des rep\00E8res au service d''un projet d''action individuel ou collectif.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Dans un jeu collectif, l''\00E9l\00E8ve se reconnait dans un r\00F4le d''attaquant ou de d\00E9fenseur, rep\00E8re la possession du ballon et change rapidement de r\00F4le, ajuste sa frappe ou ses passes en fonction de la distance.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Respecter les r\00E8gles du jeu, les partenaires et les adversaires', 3)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Comprendre et respecter les r\00E8gles du jeu.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve identifie diff\00E9rentes r\00E8gles et sait les nommer, reformule le but du jeu \00E0 l''aide du vocabulaire sp\00E9cifique, identifie et respecte le r\00F4le d''arbitre.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Accepter l''opposition tout en respectant l''autre.', 2)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve reconnait la d\00E9faite sans comportement d\00E9plac\00E9 envers l''adversaire, et salue ou serre la main avant et apr\00E8s la confrontation.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_grand_domaine_id, v_type_sous_domaine, U&'Cours \00E9l\00E9mentaire deuxi\00E8me ann\00E9e', 3)
  returning id into v_annee_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'D\00E9velopper des habilet\00E9s motrices dans des situations d''opposition individuelles et collectives', 1)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Maitriser et contr\00F4ler des actions d''opposition simples.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Dans un jeu de raquettes, l''\00E9l\00E8ve r\00E9ussit \00E0 \00E9changer un ballon de baudruche, une balle en mousse, de part et d''autre d''un filet ; dans un jeu de combat, il est actif au sol pour ne pas se faire retourner.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'S''adapter \00E0 la zone de jeu.', 2)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Dans un jeu collectif avec ballon, l''\00E9l\00E8ve s''\00E9loigne ou se rapproche de ses partenaires pour se d\00E9marquer ; dans un jeu de combat, il adapte son action pour ne pas sortir de la zone de combat.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Faire des choix pour marquer', 2)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Prendre des rep\00E8res au service d''un projet d''action individuel ou collectif.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Dans un jeu collectif, l''\00E9l\00E8ve r\00E9alise avec un partenaire une action de mont\00E9e de balle pour se rapprocher de la cible, et identifie un espace libre pour offrir une solution de passe (d\00E9marquage).', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Respecter les r\00E8gles du jeu, les partenaires et les adversaires', 3)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Comprendre et respecter les r\00E8gles du jeu.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve arbitre et attribue des points en fonction des actions, \00E9coute et s''exprime \00E0 l''oral pour comprendre et se faire comprendre sur les actions de jeu.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Accepter l''opposition tout en respectant l''autre.', 2)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve encourage son partenaire ou f\00E9licite l''adversaire, accepte les d\00E9cisions de l''arbitre, et joue en respectant les r\00E8gles sans arbitre (autoarbitrage).', 1);

  raise notice 'EPS (cycle 2) importee.';
end $$;