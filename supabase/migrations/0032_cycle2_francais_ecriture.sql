-- Import du programme officiel cycle 2 -- Francais > Ecriture (meme
-- source que Lecture : BO du 31 octobre 2024). Deuxieme des cinq
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
    and type_element_id = v_type_sous_domaine and libelle = 'Ecriture';

  if v_domaine_id is not null then
    raise notice 'Ecriture (cycle 2, francais) deja importee -- rien a faire.';
    return;
  end if;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_francais_id, v_type_sous_domaine, 'Ecriture', 2)
  returning id into v_domaine_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_domaine_id, v_type_sous_domaine, 'Cours preparatoire', 1)
  returning id into v_annee_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Apprendre a ecrire en ecriture cursive', 1)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, 'Apprendre a ecrire en ecriture cursive tous les graphemes etudies selon la progression en decodage ; apprendre a les enchainer, avec fluidite, avec d''autres lettres dans des syllabes, mots, phrases.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'L''eleve respecte la forme et la taille de la lettre, le sens de rotation du trace et l''enchainement des lettres.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il est capable d''enchainer plusieurs lettres sans lever le crayon (sauf devant les lettres rondes : a, c, d, g, o, q, x).', 2);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Encoder puis ecrire sous dictee', 2)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, 'Des le debut de l''annee : encoder des syllabes simples puis des mots selon la progression des CGP. Des la fin de la 2e periode : ecrire des mots dictes avec des lettres muettes apprises. En fin d''annee : ecrire sous la dictee des mots et des phrases.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Dans le cadre des lecons sur les graphemes, l''eleve realise des dictees de lettres, syllabes, mots puis phrases a partir de la periode 2.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il oralise ce qu''il ecrit et segmente la chaine orale (la phrase en mots, les mots en syllabes et phonemes).', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il utilise l''analogie (il recourt au mot vendredi pour ecrire la preposition en).', 3);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'A partir de la periode 2, il mobilise des connaissances orthographiques lors des activites d''encodage.', 4);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il utilise les outils presents dans la classe (frise alphabetique, repertoire de mots, affichages, etc.).', 5);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Copier et acquerir des strategies de copie', 3)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, 'Des le debut de l''annee : copier des syllabes simples puis des mots avec lettres muettes. Des la fin de la periode 1 : copier une phrase en lien avec les CGP etudiees, commencer a verbaliser et a utiliser des strategies de copie, commencer a savoir se relire apres copie. En fin d''annee : copier trois ou quatre phrases sans erreur et de facon lisible.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'L''eleve transforme en cursive un mot puis une phrase a partir de modeles en ecriture scripte.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il copie un ecrit place a distance et comptabilise le nombre de recours au modele pour obtenir une version conforme.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il rectifie seul les oublis de mots et les erreurs de ponctuation en fin d''annee.', 3);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il verbalise et met en place des strategies de copies (segmenter l''empan, memorisation par ex.).', 4);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Produire des ecrits', 4)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, 'Des le debut de l''annee : ecrire des graphemes, des syllabes, des mots puis quelques phrases avec l''aide du professeur. Des la 2e periode : produire des ecrits courts porteurs de sens, d''une a cinq lignes. En fin d''annee : commencer a acquerir une methodologie de production ecrite (planification, mise en mots, relectures et revisions).', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'L''eleve compose des phrases a l''aide d''etiquettes mobiles qu''il sait dechiffrer.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il participe a une dictee a l''adulte, en petit groupe, en adaptant son debit de parole.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il complete et modifie des listes analogiques en lien avec ses apprentissages en lecture, grammaire, orthographe et vocabulaire.', 3);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il respecte les deux marqueurs de la phrase : majuscule et ponctuation finale forte, en fin d''annee.', 4);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Apres la lecture d''un recit a structure repetitive, il ecrit un nouvel episode en respectant la structure imposee.', 5);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_domaine_id, v_type_sous_domaine, 'Cours elementaire premiere annee', 2)
  returning id into v_annee_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Apprendre a ecrire en ecriture cursive', 1)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, 'Des la periode 1 : memoriser le trace norme et la transcription de toutes les lettres minuscules scriptes en lettres minuscules cursives. A partir de la periode 2 : reconnaitre les lettres dans les quatre ecritures ; apprendre le trace norme des lettres majuscules cursives par familles de gestes.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'L''eleve exerce tous les jours le geste d''ecriture cursive minuscule en revisant les graphemes par famille de gestes.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il transcrit de l''ecriture scripte en ecriture cursive.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'En fin d''annee, il reconnait toutes les majuscules des lettres cursives et sait les tracer.', 3);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Encoder puis ecrire sous dictee', 2)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, 'Orthographier correctement les mots frequents, reguliers puis irreguliers ; realiser des accords en genre et en nombre dans le groupe nominal et dans le groupe verbal.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'L''eleve realise des dictees en lien avec l''etude des graphemes avec ou sans appui du cahier ou ils sont consignes.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il realise des dictees en lien avec l''etude de la langue et se familiarise avec divers types de dictee.', 2);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Copier et acquerir des strategies de copie', 3)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, 'Automatiser le geste d''ecriture cursive par la copie de textes en temps limite ; acquerir des strategies de copie et en mesurer l''efficacite. A l''issue de la periode 1 : copier quatre a cinq phrases courtes. A partir de la periode 3 : copier cinq ou six lignes sans erreur. A la fin de l''annee : recopier sans effort une dizaine de lignes en respectant la ponctuation et la mise en page.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'L''eleve sait transcrire cinq ou six phrases dans un cahier en enchainant plusieurs lettres sans rompre le geste.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il sait mobiliser differentes strategies de copie : lettre a lettre, syllabe par syllabe, mot a mot, groupe de mots par groupe de mots, etc.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il commence a comparer l''efficacite relative de ces strategies, selon les situations.', 3);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il relit son ecrit et corrige l''orthographe en fonction du texte et des indications du professeur.', 4);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Produire des ecrits', 4)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, 'Des les premieres semaines : rediger une phrase simple a partir d''une phrase prototypique. Des la periode 1 : ecrire un texte court de une a trois phrases. Au cours des periodes 1 a 5 : inserer des connecteurs pour rendre coherent l''enchainement de plusieurs phrases. En fin d''annee : ecrire un texte de six ou sept phrases maximum en assurant la coherence syntaxique et logique du texte produit.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'L''eleve modifie un passage d''un texte lu en prenant appui sur un corpus de mots.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il se sert de brouillons pour ecrire : listes, pistes, cartes mentales, etc.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors de l''etude d''une oeuvre, il ecrit la suite d''un passage en sequencant les actions : D''abord... Puis... Enfin...', 3);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'A l''ecoute de son texte, il indique s''il y a des omissions, des incoherences et des repetitions.', 4);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'En fin d''annee, il ecrit des phrases de reponses dans de nombreuses situations de classe, par exemple en mathematiques.', 5);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_domaine_id, v_type_sous_domaine, 'Cours elementaire deuxieme annee', 3)
  returning id into v_annee_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Apprendre a ecrire en ecriture cursive', 1)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, 'Des la periode 1 : automatiser l''ecriture de toutes les lettres minuscules et majuscules en cursive.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'L''eleve ecrit et transcrit avec fluidite toutes les lettres cursives minuscules et majuscules.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Encoder puis ecrire sous dictee', 2)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, 'A la fin de l''annee : orthographier correctement les mots frequents, reguliers et irreguliers et des phrases selon les accords etudies dans le cadre de dictees.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'L''eleve realise des dictees en lien avec l''etude de la langue en mobilisant diverses connaissances enseignees.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il transcrit correctement les phonemes pouvant s''ecrire a l''aide de plusieurs graphemes dans differents mots frequents.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il orthographie les chaines d''accord dans la phrase.', 3);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Copier et acquerir des strategies de copie', 3)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, 'En fin d''annee : copier une dizaine de lignes sans erreur en conjuguant vitesse et exactitude et en respectant les mises en page complexes.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'L''eleve utilise systematiquement des strategies de copie pour exercer la vitesse, l''exactitude, l''endurance et la mise en page.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il sait copier en respectant la mise en page du texte.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il se relit et est capable de reperer des omissions ou erreurs orthographiques ou de ponctuation.', 3);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Produire des ecrits', 4)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, 'Developper tout au long de l''annee les competences qui lui permettront en fin d''annee d''ecrire pour transmettre un message, de rediger des phrases entrainant les automatismes appris en grammaire et orthographe, d''ecrire un texte d''une dizaine de lignes de differents types, et de relire son texte methodiquement.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'L''eleve ecrit un message correctement orthographie pour etre compris par le lecteur.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il utilise un brouillon pour organiser ses idees et s''appuie sur un cahier de regles ou sur des affichages.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il mobilise des connecteurs temporels et logiques.', 3);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il ecrit des dialogues, des recits, des poemes en tenant compte des differentes caracteristiques des types et genres de textes.', 4);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il ecrit des questions, des reponses et des hypotheses.', 5);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il parvient a identifier les groupes nominaux et verbaux dans son texte et eventuellement a corriger les erreurs d''accords.', 6);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il ameliore son texte en fonction des indications du professeur.', 7);

end $$;