-- Import du programme officiel cycle 2 -- Francais > Oral (meme source
-- que Lecture/Ecriture : BO du 31 octobre 2024). Troisieme des cinq
-- sous-domaines du francais.

do $$
declare
  v_cycle2_id uuid;
  v_type_sous_domaine uuid;
  v_type_objectif uuid;
  v_type_exemple uuid;
  v_francais_id uuid;
  v_domaine_id uuid;
  v_annee_id uuid;
  v_theme_id uuid;
  v_objectif_id uuid;
begin
  select id into v_cycle2_id from cycles where libelle = 'Cycle 2 (CP, CE1, CE2)';
  select id into v_type_sous_domaine from types_element_programme where code = 'sous_domaine';
  select id into v_type_objectif from types_element_programme where code = 'objectif';
  select id into v_type_exemple from types_element_programme where code = 'exemple_reussite';

  select id into v_francais_id from elements_programme
  where cycle_id = v_cycle2_id and libelle = 'Francais'
    and type_element_id = (select id from types_element_programme where code = 'domaine');

  select id into v_domaine_id from elements_programme
  where cycle_id = v_cycle2_id and parent_id = v_francais_id
    and type_element_id = v_type_sous_domaine and libelle = 'Oral';

  if v_domaine_id is not null then
    raise notice 'Oral (cycle 2, francais) deja importe -- rien a faire.';
    return;
  end if;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_francais_id, v_type_sous_domaine, 'Oral', 3)
  returning id into v_domaine_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_domaine_id, v_type_sous_domaine, 'Cours preparatoire', 1)
  returning id into v_annee_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Ecouter pour comprendre', 1)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, 'Comprendre un message entendu de quelques minutes et memoriser quelques informations importantes.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'L''eleve adopte une posture d''ecoute pour memoriser une consigne ou un message important.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il realise l''action demandee par un discours injonctif : consigne, recette de cuisine, notice de montage, regle du jeu, etc.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il sait repondre, apres plusieurs ecoutes d''un texte narratif, a la question : Que raconte ce texte ?', 3);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il sait repondre, apres plusieurs ecoutes d''un bref document audio ou d''une lecture oralisee d''un texte documentaire, a la question : Quelles informations as-tu retenues ?', 4);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Dire pour etre compris', 2)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, 'Mener une breve production orale pour rapporter, raconter, decrire ou expliquer, en utilisant quelques organisateurs du discours et en mobilisant le lexique appris ; s''ecouter pour progresser et proposer des reformulations ; oraliser un texte memorise ou prepare en tenant compte de son auditoire.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'En groupe restreint, l''eleve est capable de prendre la parole en regardant ses camarades et en veillant a se faire comprendre d''eux.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il est capable de decrire des images ou de raconter avec ses propres mots une histoire entendue, en utilisant des connecteurs tels que parce que, alors, ensuite.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il restitue un poeme en articulant distinctement et d''une voix audible.', 3);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Participer a des echanges', 3)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, 'Participer aux echanges en respectant les regles, en ecoutant les autres et en donnant son avis ; prendre conscience des ecarts de niveau de langue selon les situations de communication.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'L''eleve attend la fin d''une prise de parole pour parler.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il est capable d''exprimer une idee en lien avec le sujet de l''echange en reutilisant des expressions comme : Je souhaite prendre la parole pour... ; Je suis d''accord...', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il mesure que l''on ne parle pas de la meme maniere en classe et dans la cour.', 3);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_domaine_id, v_type_sous_domaine, 'Cours elementaire premiere annee', 2)
  returning id into v_annee_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Ecouter pour comprendre', 1)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, 'Maintenir une attention active pendant quelques minutes pour reperer, memoriser, classer ou ordonner les informations importantes entendues a l''oral.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'L''eleve est capable d''ecoute active : il prend le temps de comprendre les informations entendues.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il realise l''action demandee par un discours injonctif : consigne, recette de cuisine, notice de montage, regle du jeu, etc.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il recapitule une lecon orale, par exemple en sciences, en ordonnant les informations.', 3);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Dire pour etre compris', 2)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, 'Utiliser a l''oral l''ensemble des temps verbaux pour raconter, decrire, expliquer, comparer ou exposer ; utiliser les criteres definis pour evaluer sa prestation ou celle des autres et progresser dans la production de differents types de discours.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'L''eleve est capable de prendre la parole en groupe : il s''adresse directement a ses camarades et se fait comprendre.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il est capable de reinvestir, pendant 5 minutes maximum, les tournures linguistiques et les postures apprises lors des seances dediees a l''enseignement des differents types de discours.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il utilise des termes comme d''abord, pour commencer, ensuite, donc, par consequent, enfin, pour terminer, pour conclure.', 3);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il presente une demarche scientifique en utilisant le lexique appris.', 4);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Participer a des echanges', 3)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, 'Respecter le propos au cours des echanges au sein d''un groupe ; adapter le registre de langue utilise (familier, courant, soutenu) a la situation de communication proposee.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'L''eleve exprime et justifie un accord ou un desaccord en utilisant des expressions fournies par le professeur : Je ne suis pas d''accord avec... ; Je ne partage pas l''avis de...', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il participe a des jeux de role et adapte son registre de langue de facon appropriee (vocabulaire et syntaxe).', 2);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_domaine_id, v_type_sous_domaine, 'Cours elementaire deuxieme annee', 3)
  returning id into v_annee_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Ecouter pour comprendre', 1)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, 'Reperer, memoriser et relier entre elles plusieurs informations importantes pour construire la coherence d''un message entendu de plus en plus long et complexe (5 minutes maximum), en evaluant son degre de comprehension.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'L''eleve ecoute une interview d''un ou d''une artiste ou d''un ou d''une scientifique et, apres plusieurs ecoutes et a la suite de consignes claires, reformule l''essentiel de ce qu''il a appris du locuteur en question.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il ecoute une histoire et est capable d''en inventer la fin.', 2);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Dire pour etre compris', 2)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, 'Mener une production orale de plus en plus longue et structuree pour raconter, expliquer, argumenter, justifier ; maintenir l''interet de son auditoire lors des differentes prestations orales.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'L''eleve est capable de reinvestir les tournures linguistiques et les postures apprises lors des seances dediees a l''enseignement des differentes formes de discours.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il produit des phrases de plus en plus complexes et mobilise un lexique de plus en plus varie et abstrait.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il presente un expose de quelques minutes construit en classe en prenant appui sur un support.', 3);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il explique un raisonnement en mathematiques ou en sciences : une demarche, le choix d''une procedure, etc.', 4);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il est capable d''expliciter une erreur commise.', 5);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il evite les tics verbaux, les mots familiers, varie les connecteurs et veille au niveau de langue adopte lors des prestations orales.', 6);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Participer a des echanges', 3)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, 'Tenir compte de ce qui a deja ete dit lors des interventions au sein d''un groupe ; utiliser un registre de langue et adopter des postures adaptees aux situations proposees (jeux de roles).', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'L''eleve est capable de reformuler ce qui a ete dit par un camarade et de s''appuyer sur ce propos pour faire progresser l''echange.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il utilise des expressions fournies par le professeur : Pour completer ce qu''a dit... ; Je souhaite revenir sur ce qu''a dit... ; Pour reprendre les propos de...', 2);

end $$;