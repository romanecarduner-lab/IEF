-- Import du programme officiel cycle 2 -- Francais > Grammaire et
-- orthographe (meme source que les precedents : BO du 31 octobre 2024).
-- Cinquieme et dernier sous-domaine du francais -- le francais est
-- complet une fois cette migration collee.

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
    and type_element_id = v_type_sous_domaine and libelle = 'Grammaire et orthographe';

  if v_domaine_id is not null then
    raise notice 'Grammaire et orthographe (cycle 2, francais) deja importee -- rien a faire.';
    return;
  end if;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_francais_id, v_type_sous_domaine, 'Grammaire et orthographe', 5)
  returning id into v_domaine_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_domaine_id, v_type_sous_domaine, 'Cours preparatoire', 1)
  returning id into v_annee_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Se reperer dans la phrase simple', 1)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, 'S''approprier progressivement la notion de phrase simple et ses trois marqueurs essentiels : majuscule initiale, ponctuation finale forte et sens. Comprendre que certains elements (sujet/verbe et determinants/noms/adjectifs) fonctionnent ensemble et constituent un systeme. S''appuyer sur la ponctuation pour reconnaitre les trois types de phrases (declarative, interrogative et imperative). Reconnaitre les formes negative et exclamative. Constituer des corpus par classe de mots : noms, verbes, determinants, adjectifs, pronoms personnels.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'L''eleve identifie les phrases d''un court texte a partir des majuscules et des differents points.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il sait ordonner et produire une phrase simple (repere la place des groupes).', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il manipule les types de phrases declaratives et imperatives avec la forme negative et sait expliciter le changement de sens opere par ces manipulations.', 3);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il opere des tris de mots (determinant/nom/adjectif) entendus, lus ou ecrits en fonction de leur genre et de leur nombre.', 4);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il observe les corpus que le professeur a tries par classe grammaticale et commence a elaborer des criteres de reconnaissance.', 5);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Decouvrir, comprendre et mettre en oeuvre l''orthographe grammaticale', 2)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, 'Comprendre les notions de masculin et de feminin, de singulier et de pluriel. Se familiariser avec la notion de chaine d''accords (determinant/nom/adjectif) en reperant les regularites des marques de genre et de nombre. S''initier a l''identification de la relation sujet-verbe a partir du sens et de l''observation des effets des transformations liees aux temps et aux personnes. Observer les differentes formes verbales frequentes et regulieres. Apprendre a conjuguer etre et avoir au present de l''indicatif et commencer a les mobiliser a l''ecrit.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'L''eleve observe la marque du feminin (+e) a partir d''exemples sonores : petit/petite, grand/grande, etc.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il observe la marque du pluriel (+s) a partir de l''observation de mots se terminant par la marque du pluriel, s muet precedes de leur determinant.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il opere des classements grammaticaux de groupes nominaux en fonction de leur genre ou de leur nombre.', 3);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'A partir d''un groupe nominal puis d''une phrase simple qu''il ecoute et manipule a l''ecrit, il observe les modifications.', 4);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il orthographie sous la dictee des groupes nominaux du type : une olive/des olives ; une boulangere/un boulanger.', 5);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il comprend le lien semantique entre le chat et miaule et observe les variations orthographiques entre le chat miaule et les chats miaulent.', 6);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il est capable de trouver l''orthographe d''une terminaison verbale en s''appuyant sur le sens et les analogies (nous -> ons, vous -> ez, ils -> ent, tu -> s, etc.).', 7);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_domaine_id, v_type_sous_domaine, 'Cours elementaire premiere annee', 2)
  returning id into v_annee_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Se reperer dans la phrase simple', 1)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, 'Identifier la phrase simple, en distinguer les principaux constituants et les nommer : groupe sujet (GS), verbe et complements sans distinguer ces derniers entre eux. Reconnaitre et utiliser les trois types de phrases, en lien avec la ponctuation : declarative, interrogative et imperative. Reconnaitre les formes negatives et exclamatives et savoir effectuer des transformations. Differencier et nommer les principales classes de mots : le determinant, le nom commun, le nom propre, l''adjectif, le verbe, le pronom personnel sujet.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'L''eleve progresse en lecture a voix haute en s''appuyant sur les signes de ponctuation et sur les groupes de sens.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il est capable d''operer des manipulations de phrase : deplacement, suppression, ajout, substitution, en grammaire comme en production ecrite.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il complete des listes proposees par le professeur par classes grammaticales.', 3);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il categorise un corpus de mots propose par classe grammaticale et affine les criteres de reconnaissance elabores au CP, y compris pour les noms propres.', 4);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Decouvrir, comprendre et mettre en oeuvre l''orthographe grammaticale', 2)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, 'Reconnaitre le groupe nominal (determinant/nom/adjectif) et, en ecoutant des transformations de phrases a l''oral puis en les observant a l''ecrit, comprendre le lien entre le determinant, le nom et l''adjectif dans la chaine d''accords. Identifier la relation sujet-verbe a partir de l''observation des effets des transformations liees au changement de temps et de personne dans des situations simples. Identifier le radical et la terminaison d''un verbe du premier groupe conjugue et trouver son infinitif. Apprendre a conjuguer au present, a l''imparfait, au futur puis au passe compose de l''indicatif etre et avoir et les verbes du premier groupe.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'L''eleve reconnait progressivement un determinant. Il en indique le genre et le nombre.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il utilise, en dictee, des marques d''accord pour le nom et l''adjectif epithete (pluriel en -s, feminin en -e) et commence a les mobiliser en production d''ecrits.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il mobilise differentes strategies qui permettent d''identifier le verbe et le sujet ; il relie semantiquement le sujet et le verbe et opere des transformations de personne.', 3);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il orthographie des formes verbales en situation de dictee et commence a les mobiliser en situation d''expression ecrite autonome.', 4);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il est capable de nommer l''infinitif d''un verbe conjugue a divers temps et a differentes personnes, en s''appuyant sur le reperage d''un radical commun.', 5);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_domaine_id, v_type_sous_domaine, 'Cours elementaire deuxieme annee', 3)
  returning id into v_annee_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Se reperer dans la phrase simple', 1)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, 'Identifier la phrase simple et reconnaitre ses principaux constituants : le groupe sujet, le verbe et les complements sans distinguer ces derniers entre eux. Reconnaitre et produire les trois types de phrases : declarative, interrogative et imperative. Reconnaitre et produire les formes negative et exclamative. Differencier et nommer les principales classes de mots : le determinant, le nom commun, le nom propre, l''adjectif, le verbe, le pronom personnel sujet et l''adverbe. Utiliser la ponctuation de fin de phrase et reconnaitre les marques du discours rapporte.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'L''eleve substitue a un groupe nominal sujet un pronom personnel sujet et inversement.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il transforme des phrases de differents types a la forme negative.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il observe la difference entre les mots variables et invariables et decouvre la classe grammaticale de l''adverbe ; il sait orthographier les adverbes les plus frequents et les adverbes en -ment.', 3);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il repere dans un texte les passages au discours direct.', 4);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il mobilise les termes grammaticaux pour resoudre des problemes d''orthographe, d''ecriture et de lecture.', 5);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Decouvrir, comprendre et mettre en oeuvre l''orthographe grammaticale', 2)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, 'Reperer, comprendre et mettre en oeuvre les marques d''accord au sein du groupe nominal. Identifier, dans des situations simples, la relation sujet-verbe. Apprendre a conjuguer au present, a l''imparfait, au futur et au passe compose de l''indicatif etre et avoir, les verbes du premier groupe et les verbes irreguliers du 3e groupe (faire, aller, dire, venir, pouvoir, voir, vouloir, prendre). Identifier le radical et la terminaison d''un verbe conjugue au programme et trouver son infinitif.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'L''eleve comprend la notion de chaine d''accords dans le groupe nominal et utilise des marques d''accords reguliers pour les noms et les adjectifs, ainsi que des marques de pluriels irreguliers et des marques du feminin quand elles s''entendent.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il mobilise differentes strategies pour consolider l''identification et la comprehension du lien entre le groupe sujet et le verbe, en operant des transformations de personne et de temps.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il verbalise des raisonnements orthographiques en situation de dictee ou d''ecriture et corrige des accords en fonction du signalement du professeur.', 3);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Il orthographie correctement les formes verbales etudiees en situation de dictee et d''ecriture.', 4);

end $$;