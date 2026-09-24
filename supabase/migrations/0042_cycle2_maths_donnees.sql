-- Import du programme officiel cycle 2 -- Mathematiques > Organisation
-- et gestion de donnees, dernier des 4 grands domaines des
-- mathematiques cycle 2 -- extrait directement du PDF officiel fourni
-- par l'utilisatrice (Annexe 4, BO du 31 octobre 2024). Les
-- mathematiques cycle 2 sont completes une fois cette migration
-- collee.

do $$
declare
  v_cycle2_id uuid;
  v_type_sous_domaine uuid;
  v_type_objectif uuid;
  v_type_exemple uuid;
  v_maths_id uuid;
  v_domaine_id uuid;
  v_annee_id uuid;
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
    and type_element_id = v_type_sous_domaine and libelle = U&'Organisation et gestion de donn\00E9es';

  if v_domaine_id is not null then
    raise notice 'Organisation et gestion de donnees (cycle 2) deja importe -- rien a faire.';
    return;
  end if;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_maths_id, v_type_sous_domaine, U&'Organisation et gestion de donn\00E9es', 4)
  returning id into v_domaine_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_domaine_id, v_type_sous_domaine, U&'Cours pr\00E9paratoire', 1)
  returning id into v_annee_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Collecter des donn\00E9es et pr\00E9senter ces donn\00E9es sous forme d''un tableau ou d''un diagramme en barres.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve apprend \00E0 effectuer un recueil de donn\00E9es pour des populations de moins de quarante individus, \00E0 partir d''une question comme : quel est ton animal pr\00E9f\00E9r\00E9 ?', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait produire et utiliser un outil lui permettant de recueillir les r\00E9ponses de l''ensemble de la population \00E9tudi\00E9e, puis organiser les donn\00E9es recueillies dans un tableau.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait construire un diagramme en barres restituant les r\00E9sultats de son enqu\00EAte.', 3);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'\00C0 chaque \00E9tape, l''\00E9l\00E8ve sait interpr\00E9ter, lire et communiquer sur les donn\00E9es disponibles en utilisant les expressions : le plus, le moins, le plus grand, le plus petit, autant que, plus que, moins que.', 4);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Construire et compl\00E9ter un tableau \00E0 double entr\00E9e.', 2)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait qu''un tableau \00E0 double entr\00E9e permet de repr\00E9senter tous les couples qu''il est possible de former \00E0 partir de deux crit\00E8res, par exemple la forme et la couleur.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait qu''une ligne et une colonne d''un tableau \00E0 double entr\00E9e permettent d''identifier le contenu de la case situ\00E9e \00E0 leur intersection.', 2);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_domaine_id, v_type_sous_domaine, U&'Cours \00E9l\00E9mentaire premi\00E8re ann\00E9e', 2)
  returning id into v_annee_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Produire un tableau ou un diagramme en barres pour pr\00E9senter des donn\00E9es recueillies.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve m\00E8ne une enqu\00EAte sur un caract\00E8re qualitatif pouvant prendre quelques valeurs (de deux \00E0 cinq), recueille les donn\00E9es pour une population de moins de cent individus, compile les r\00E9sultats dans un tableau et produit un diagramme en barres pour pr\00E9senter les donn\00E9es recueillies. Un axe vertical fournit l''\00E9chelle pour les barres, il est gradu\00E9 de un en un.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Lire et interpr\00E9ter les donn\00E9es d''un diagramme en barres. Lire et interpr\00E9ter les donn\00E9es d''un tableau \00E0 double entr\00E9e.', 2)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait r\00E9pondre \00E0 des questions dont les r\00E9ponses se lisent sur un diagramme en barres, par exemple : quelle est la couleur la plus fr\00E9quente ? Combien d''\00E9l\00E8ves viennent \00E0 pied \00E0 l''\00E9cole ?', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait r\00E9pondre \00E0 des questions dont les r\00E9ponses figurent dans un tableau \00E0 double entr\00E9e, par exemple : combien de gar\00E7ons viennent \00E0 l''\00E9cole en v\00E9lo ?', 2);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_domaine_id, v_type_sous_domaine, U&'Cours \00E9l\00E9mentaire deuxi\00E8me ann\00E9e', 3)
  returning id into v_annee_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Produire un tableau ou un diagramme en barres pour pr\00E9senter des donn\00E9es recueillies, y compris des caract\00E8res quantitatifs discrets (nombre de fr\00E8res et soeurs, \00E2ge, etc.), pas seulement qualitatifs.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve m\00E8ne une enqu\00EAte, recueille les donn\00E9es, compile les r\00E9sultats dans un tableau et produit un diagramme en barres pour pr\00E9senter les donn\00E9es recueillies, en utilisant une \00E9chelle adapt\00E9e aux donn\00E9es pour l''axe vertical.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve utilise des donn\00E9es fournies sous la forme d''un texte ou d''un tableau pour produire un diagramme en barres.', 2);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_objectif, U&'Lire et interpr\00E9ter les donn\00E9es d''un tableau \00E0 double entr\00E9e ou d''un diagramme en barres. R\00E9soudre des probl\00E8mes en utilisant les donn\00E9es d''un tableau \00E0 double entr\00E9e ou d''un diagramme en barres.', 2)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait trouver dans un tableau ou sur un diagramme en barres les r\00E9ponses \00E0 des questions comme : quelle est la couleur la plus fr\00E9quente ? Combien d''\00E9l\00E8ves viennent \00E0 pied \00E0 l''\00E9cole ?', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait compl\00E9ter un tableau \00E0 double entr\00E9e dont certaines cases, dont le total, sont \00E0 calculer \00E0 partir des autres.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'L''\00E9l\00E8ve sait r\00E9soudre un probl\00E8me du type : les 175 \00E9l\00E8ves d''une \00E9cole habitent dans quatre villes diff\00E9rentes, compl\00E9ter le diagramme en barres avec la barre manquante \00E0 partir du total et des autres effectifs.', 3);

  raise notice 'Organisation et gestion de donnees (cycle 2) importe -- mathematiques cycle 2 completes.';
end $$;