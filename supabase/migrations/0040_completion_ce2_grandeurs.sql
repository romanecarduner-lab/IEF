-- Complete le CE2 de Mathematiques > Grandeurs et mesures avec les
-- trois blocs manques a l'import precedent (le texte officiel exact
-- n'avait pas pu etre recupere) : le reste de "Les contenances"
-- (unites litre/decilitre/centilitre), "La monnaie" et "Le reperage
-- dans le temps et les durees", transcrits depuis le PDF officiel
-- fourni par l'utilisatrice.

do $$
declare
  v_cycle2_id uuid;
  v_type_sous_domaine uuid;
  v_type_objectif uuid;
  v_type_exemple uuid;
  v_maths_id uuid;
  v_grandeurs_id uuid;
  v_ce2_id uuid;
  v_contenances_id uuid;
  v_theme_id uuid;
  v_objectif_id uuid;
  v_deja_complet boolean;
begin
  select id into v_cycle2_id from cycles where libelle = 'Cycle 2 (CP, CE1, CE2)';
  select id into v_type_sous_domaine from types_element_programme where code = 'sous_domaine';
  select id into v_type_objectif from types_element_programme where code = 'objectif';
  select id into v_type_exemple from types_element_programme where code = 'exemple_reussite';

  select id into v_maths_id from elements_programme
  where cycle_id = v_cycle2_id and libelle = U&'Math\00E9matiques'
    and type_element_id = (select id from types_element_programme where code = 'domaine');

  select id into v_grandeurs_id from elements_programme
  where cycle_id = v_cycle2_id and parent_id = v_maths_id
    and type_element_id = v_type_sous_domaine and libelle = U&'Grandeurs et mesures';

  select id into v_ce2_id from elements_programme
  where cycle_id = v_cycle2_id and parent_id = v_grandeurs_id
    and type_element_id = v_type_sous_domaine and libelle = U&'Cours \00E9l\00E9mentaire deuxi\00E8me ann\00E9e';

  if v_ce2_id is null then
    raise exception 'CE2 de Grandeurs et mesures introuvable -- la migration precedente n''a pas ete executee.';
  end if;

  select id into v_contenances_id from elements_programme
  where cycle_id = v_cycle2_id and parent_id = v_ce2_id
    and type_element_id = v_type_sous_domaine and libelle = U&'Les contenances';

  select exists(
    select 1 from elements_programme
    where cycle_id = v_cycle2_id and parent_id = v_ce2_id
      and type_element_id = v_type_sous_domaine and libelle = U&'La monnaie'
  ) into v_deja_complet;

  if v_deja_complet then
    raise notice 'CE2 de Grandeurs et mesures deja complete -- rien a faire.';
    return;
  end if;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_contenances_id, v_type_objectif, U&'Connaitre et utiliser les unit\00E9s litre, d\00E9cilitre et centilitre et les symboles associ\00E9s (L, dL et cL). Savoir que 1 L est \00E9gal \00E0 10 dL et \00E9galement \00E0 100 cL.', 2)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve mesure des contenances en litre, d\00E9cilitre et centilitre en utilisant un verre gradu\00E9 ou en utilisant un r\00E9cipient de contenance connue comme une bouteille d''un litre ou d''un demi-litre.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait estimer la contenance d''un r\00E9cipient de la vie courante : verre, bouteille, arrosoir.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait effectuer des conversions en utilisant les unit\00E9s litre, d\00E9cilitre et centilitre : 1 L = 10 dL ; 1 L = 100 cL ; 780 cL = 700 cL + 80 cL = 7 L + 80 cL.', 3);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_ce2_id, v_type_sous_domaine, U&'La monnaie', 4)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Simuler des achats en manipulant des pi\00E8ces et des billets fictifs. Rendre la monnaie.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve est en mesure de constituer un montant donn\00E9 avec des pi\00E8ces et des billets. Les nombres de pi\00E8ces et de billets disponibles peuvent \00EAtre des contraintes utiles \00E0 la r\00E9flexion.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait rendre la monnaie en proc\00E9dant par ajouts successifs (rendre la monnaie sur 5 euros pour un achat de 3,68 euros : le compl\00E9ment \00E0 100 de 68 est 32, donc je rends 32 centimes pour arriver \00E0 4 euros, plus 1 euro pour arriver \00E0 5 euros).', 2);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Poser et effectuer des additions de montants en euro.', 2)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait poser et effectuer des additions pour des calculs comme les suivants : 4,56 euros + 15,30 euros ; 43,45 euros + 68 euros ; 43,45 euros + 68 centimes ; 143 euros + 3,67 euros + 54 centimes.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Poser et effectuer des soustractions de montants en euro.', 3)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait poser et effectuer des soustractions pour des calculs comme les suivants : 74,56 euros - 15,30 euros ; 143,45 euros - 68 euros ; 74,36 euros - 12,50 euros.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_ce2_id, v_type_sous_domaine, U&'Le rep\00E9rage dans le temps et les dur\00E9es', 5)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Lire l''heure sur une horloge \00E0 aiguilles. Positionner les aiguilles d''une horloge correspondant \00E0 une heure donn\00E9e en heures enti\00E8res ou en heures et minutes.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve lit l''heure sur un cadran \00E0 aiguilles ou sur un affichage digital (huit heures et demie, neuf heures, dix heures trente-cinq, sept heures moins le quart, sept heures quinze, quatre heures moins vingt, quinze heures quarante-deux, midi, etc.).', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve positionne les aiguilles des heures et des minutes de cinq heures et quart, deux heures et demie, treize heures vingt, quatre heures moins le quart ou six heures dix-huit minutes.', 2);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Comparer et mesurer des dur\00E9es \00E9coul\00E9es entre deux instants affich\00E9s sur une horloge (pour des intervalles de temps situ\00E9s dans une m\00EAme journ\00E9e). R\00E9soudre des probl\00E8mes \00E0 une ou deux \00E9tapes impliquant des dur\00E9es.', 2)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait d\00E9terminer la dur\00E9e qui s''\00E9coule entre 8h et 30 minutes et 8h et 50 minutes, et entre 15h et 40 minutes et 16h et 5 minutes ; il sait dire laquelle de ces deux dur\00E9es est la plus longue.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait d\00E9terminer le nombre de minutes qu''il y a dans deux heures et vingt minutes.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait utiliser un axe chronologiquement orient\00E9 pour positionner des instants et rep\00E9rer une dur\00E9e, notamment dans le cadre de la r\00E9solution de probl\00E8mes.', 3);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Exemple : Lucie est partie de chez elle \00E0 8h30, elle est rentr\00E9e \00E0 12h30, combien de temps est-elle sortie ?', 4);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Exemple : le train est parti \00E0 7h10, il a mis 1 heure et 30 minutes pour arriver \00E0 la premi\00E8re gare et il est arriv\00E9 \00E0 la deuxi\00E8me gare 40 minutes plus tard, \00E0 quelle heure le train est-il arriv\00E9 dans la deuxi\00E8me gare ?', 5);

  raise notice 'CE2 de Grandeurs et mesures complete (contenances, monnaie, temps).';
end $$;