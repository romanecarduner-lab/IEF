-- Import du programme officiel cycle 2 -- Education a la vie
-- affective et relationnelle (fevrier 2025). Quatrieme et dernier
-- domaine commun a tout le cycle 2 (les 4 matieres communes CP-CE1-
-- CE2 sont completes une fois cette migration collee). Structure :
-- annee > axe (les 3 axes communs au programme) > objectif
-- d'apprentissage (notions et competences) > demarches d'activites.

do $$
declare
  v_cycle2_id uuid;
  v_type_domaine uuid;
  v_type_sous_domaine uuid;
  v_type_objectif uuid;
  v_type_exemple uuid;
  v_vie_affective_id uuid;
  v_annee_id uuid;
  v_axe_id uuid;
  v_objectif_id uuid;
begin
  select id into v_cycle2_id from cycles where libelle = 'Cycle 2 (CP, CE1, CE2)';
  select id into v_type_domaine from types_element_programme where code = 'domaine';
  select id into v_type_sous_domaine from types_element_programme where code = 'sous_domaine';
  select id into v_type_objectif from types_element_programme where code = 'objectif';
  select id into v_type_exemple from types_element_programme where code = 'exemple_reussite';

  select id into v_vie_affective_id from elements_programme
  where cycle_id = v_cycle2_id and type_element_id = v_type_domaine
    and libelle = U&'\00C9ducation \00E0 la vie affective et relationnelle';

  if v_vie_affective_id is not null then
    raise notice 'Education a la vie affective et relationnelle (cycle 2) deja importee -- rien a faire.';
    return;
  end if;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, null, v_type_domaine, U&'\00C9ducation \00E0 la vie affective et relationnelle', 6)
  returning id into v_vie_affective_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_vie_affective_id, v_type_sous_domaine, U&'Cours pr\00E9paratoire', 1)
  returning id into v_annee_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Se conna\00EEtre, vivre et grandir avec son corps', 1)
  returning id into v_axe_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_axe_id, v_type_objectif, U&'Conna\00EEtre son corps. Comprendre ce qu''est l''intimit\00E9. Nommer les parties du corps, dont les parties intimes, avec un vocabulaire scientifique pr\00E9cis. Identifier les points communs et les diff\00E9rences physiques entre les filles et les gar\00E7ons. D\00E9finir ce qu''est son intimit\00E9 (corps, pens\00E9es, \00E9crits) et celle des autres. Comprendre que toute personne a le droit au respect de son intimit\00E9.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Identifier, \00E0 partir de documents vari\00E9s, des changements communs aux enfants au cours de leur d\00E9veloppement, depuis la naissance jusqu''\00E0 l''\00E2ge de six ans, et apprendre \00E0 nommer les parties du corps avec un vocabulaire scientifique.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'\00C0 partir de textes et d''albums, s''interroger sur ce qu''est l''intimit\00E9 et sur la mani\00E8re de l''exprimer ; rep\00E9rer, \00E0 partir de situations de la vie quotidienne, des espaces o\00F9 la question de l''intimit\00E9 et du respect du corps se pose.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Apprendre comment r\00E9agir si quelqu''un ne respecte pas son intimit\00E9, par exemple par un contact non souhait\00E9.', 3);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Rencontrer les autres et construire des relations, s''y \00E9panouir', 2)
  returning id into v_axe_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_axe_id, v_type_objectif, U&'Comprendre la diversit\00E9 des \00E9motions et des sentiments : les siens et ceux des autres. Comprendre, identifier et nommer ses sentiments et ses \00E9motions, savoir les g\00E9rer. Exprimer ses sentiments et ses \00E9motions de fa\00E7on appropri\00E9e. R\00E9soudre des conflits de fa\00E7on constructive.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Fabriquer des affiches repr\00E9sentant des sentiments et des \00E9motions, avec les mots correspondants rencontr\00E9s au fil de l''ann\00E9e. Identifier les \00E9motions des personnages sur des images ou photographies.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Lire et comprendre des \0153uvres vari\00E9es de litt\00E9rature jeunesse : rep\00E9rer la diversit\00E9 d''expression des \00E9motions et des sentiments, comprendre le lien entre les actions des personnages et leurs \00E9motions.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Participer \00E0 des temps de m\00E9diation de conflits avec un adulte et apprendre \00E0 exprimer ce que l''on ressent sans agressivit\00E9 envers l''autre.', 3);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Trouver sa place dans la soci\00E9t\00E9, y \00EAtre libre et responsable', 3)
  returning id into v_axe_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_axe_id, v_type_objectif, U&'Appartenir \00E0 une famille, comprendre la nature, la fonction et le sens des liens familiaux. Identifier diff\00E9rents liens familiaux, se rendre compte de la diversit\00E9 des structures familiales. Respecter la diversit\00E9 des structures familiales.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Identifier les liens familiaux \00E0 partir de son histoire ou d''une histoire fictive (frise de vie, approche chronologique).', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Lire des albums pr\00E9sentant diff\00E9rents types de familles et comprendre qu''il en existe une grande vari\00E9t\00E9 (famille h\00E9t\00E9roparentale, monoparentale, homoparentale, adoptive, recompos\00E9e, sans enfant).', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Parler de soi et de sa famille : \00E0 l''\00E9crit, \00E0 l''oral ou en dessinant.', 3);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_vie_affective_id, v_type_sous_domaine, U&'Cours \00E9l\00E9mentaire premi\00E8re ann\00E9e', 2)
  returning id into v_annee_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Se conna\00EEtre, vivre et grandir avec son corps', 1)
  returning id into v_axe_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_axe_id, v_type_objectif, U&'Grandir, avoir une bonne connaissance et estime de soi, prot\00E9ger son intimit\00E9. Comprendre que la croissance entraine des changements physiques. Prendre conscience que chaque personne a un corps unique. Apprendre \00E0 respecter son corps, celui des autres, leurs diff\00E9rences, leur singularit\00E9. Savoir prot\00E9ger son intimit\00E9.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Observer les ressemblances et les diff\00E9rences physiques entre les filles et les gar\00E7ons, par exemple dans des \0153uvres d''art adapt\00E9es \00E0 l''\00E2ge des enfants, et discuter sur la mani\00E8re dont la diversit\00E9 des corps est repr\00E9sent\00E9e ou non.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'D\00E9couvrir, \00E0 partir d''\0153uvres de litt\00E9rature jeunesse, diff\00E9rentes repr\00E9sentations des corps : r\00E9fl\00E9chir \00E0 ce qui peut influencer la perception de soi ou des autres et \00E0 l''impact du regard des autres.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Compl\00E9ter son blason avec ses qualit\00E9s, ses go\00FBts, ses valeurs, ses buts.', 3);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Rencontrer les autres et construire des relations, s''y \00E9panouir', 2)
  returning id into v_axe_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_axe_id, v_type_objectif, U&'Comprendre les diff\00E9rentes dimensions (affectives, \00E9thiques, sociales et l\00E9gales) d''une relation humaine. Identifier et diff\00E9rencier plusieurs types de sentiments et de relations amoureuses et amicales. D\00E9crire les principales composantes d''une relation positive (confiance, \00E9change, respect, soutien, empathie, entraide). Prendre conscience que le genre, le handicap ou l''\00E9tat de sant\00E9 ne sont pas un obstacle pour nouer des amiti\00E9s.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Lire et comprendre des albums de litt\00E9rature de jeunesse sur les th\00E8mes de l''amiti\00E9 entre filles, entre gar\00E7ons, entre filles et gar\00E7ons. Exprimer ses propres repr\00E9sentations de l''amiti\00E9 ou de l''amour.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Examiner en discussion r\00E9flexive et argument\00E9e : qu''est-ce qu''aimer ? qu''est-ce qu''un ami, une amie ? quels sont les gestes ou paroles qui peuvent blesser ou faire souffrir ?', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Participer \00E0 des activit\00E9s de collaboration, par exemple construire un arbre des qualit\00E9s des \00E9l\00E8ves de la classe ou r\00E9soudre collectivement des d\00E9fis.', 3);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Trouver sa place dans la soci\00E9t\00E9, y \00EAtre libre et responsable', 3)
  returning id into v_axe_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_axe_id, v_type_objectif, U&'Promouvoir des relations \00E9galitaires, rep\00E9rer des discriminations issues de st\00E9r\00E9otypes, notamment de genre. Savoir d\00E9finir et rep\00E9rer des st\00E9r\00E9otypes et des discriminations. Prendre conscience que les st\00E9r\00E9otypes peuvent entrainer des pr\00E9jug\00E9s et des discriminations. D\00E9velopper des relations sociales constructives (acceptation, collaboration, coop\00E9ration, entraide).', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Rep\00E9rer les st\00E9r\00E9otypes dans les catalogues de jouets, dans les publicit\00E9s, le choix des couleurs dans les emballages.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Lire et exploiter des albums de litt\00E9rature de jeunesse permettant d''\00EAtre sensibilis\00E9 \00E0 la question de la place donn\00E9e aux filles et aux gar\00E7ons dans la soci\00E9t\00E9.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'R\00E9fl\00E9chir \00E0 l''organisation et \00E0 l''utilisation des espaces de l''\00E9cole : qui joue \00E0 quoi et o\00F9 pendant une r\00E9cr\00E9ation, et proposer des strat\00E9gies pour une organisation plus \00E9galitaire des espaces partag\00E9s.', 3);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Dans le cadre de tournois sportifs mixtes, apprendre \00E0 respecter son adversaire et ses co\00E9quipiers en proscrivant toute forme de discrimination.', 4);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_vie_affective_id, v_type_sous_domaine, U&'Cours \00E9l\00E9mentaire deuxi\00E8me ann\00E9e', 3)
  returning id into v_annee_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Se conna\00EEtre, vivre et grandir avec son corps', 1)
  returning id into v_axe_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_axe_id, v_type_objectif, U&'Se sentir bien dans son corps et en prendre soin. Prendre conscience de l''importance d''appr\00E9cier et de prendre soin de son corps. D\00E9velopper sa capacit\00E9 d''attention \00E0 soi. \00CAtre capable de rep\00E9rer les comportements favorables \00E0 sa sant\00E9. Savoir demander de l''aide.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Analyser les notions de sant\00E9 et de bien-\00EAtre : d\00E9crire \00E0 l''\00E9crit ce que signifie \00EAtre en bonne sant\00E9, ne pas \00EAtre en forme, aller bien, aller mal.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Identifier ses qualit\00E9s et ses forces (jeu des qualit\00E9s, liste de ce que l''on sait bien faire et qui nous rend heureux).', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Comprendre que la bonne sant\00E9 concerne la sant\00E9 physique, la sant\00E9 mentale et la sant\00E9 sociale ; identifier les personnes-ressources en cas de probl\00E8me, la mani\00E8re de les contacter et les num\00E9ros d''urgence (le 15 et le 119).', 3);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Rencontrer les autres et construire des relations, s''y \00E9panouir', 2)
  returning id into v_axe_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_axe_id, v_type_objectif, U&'Comprendre ce qu''est le consentement, les diff\00E9rentes mani\00E8res de le solliciter et de l''exprimer ou d''accepter et de respecter un refus. D\00E9finir ce qu''est le consentement, savoir comment l''exprimer, comment refuser. Comprendre que chaque personne a droit au respect de son corps de la part de toute personne et prendre conscience qu''il existe des mots et des gestes d\00E9plac\00E9s ou abusifs. Savoir identifier un adulte de confiance et o\00F9 chercher de l''aide.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'R\00E9fl\00E9chir collectivement, \00E0 partir de situations de la vie quotidienne, pour savoir distinguer quand dire oui et quand dire non, comprendre qu''on a le droit d''h\00E9siter ou de changer d''avis, et savoir demander le consentement de l''autre avant de lui prendre la main ou un objet.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'\00C0 partir de l''exploitation d''albums de litt\00E9rature de jeunesse, apprendre \00E0 reconnaitre des situations de consentement ou d''absence de consentement, et comprendre l''importance d''une intervention ou d''une aide ext\00E9rieure.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'\00C0 partir d''une situation dans laquelle un \00E9l\00E8ve a besoin d''aide, \00E9crire un dialogue et jouer diff\00E9rentes sc\00E8nes pour imaginer plusieurs solutions pour lui venir en aide.', 3);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Trouver sa place dans la soci\00E9t\00E9, y \00EAtre libre et responsable', 3)
  returning id into v_axe_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_axe_id, v_type_objectif, U&'Connaitre ses droits. Connaitre ses droits et reconnaitre que chaque individu a des droits fondamentaux qui doivent \00EAtre reconnus. Savoir ce qu''est la Convention internationale des droits de l''enfant. Prendre conscience du r\00F4le que chacun peut avoir dans le respect de la diversit\00E9 et de la diff\00E9rence.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'\00C9tudier la d\00E9finition des droits humains et comment ils s''appliquent \00E0 chaque individu ; examiner les termes libert\00E9 et \00E9galit\00E9 dans le cadre d''une discussion argument\00E9e et r\00E9flexive.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'\00C9tendre sa connaissance de la Convention internationale des droits de l''enfant, et notamment le droit d''\00EAtre prot\00E9g\00E9 de la violence, de la maltraitance et de toute forme d''abus et d''exploitation.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'\00C0 partir d''affiches non l\00E9gend\00E9es repr\00E9sentatives des diff\00E9rents droits propos\00E9s par des instances institutionnelles, \00E9crire les l\00E9gendes des douze droits principaux auxquels chaque affiche fait r\00E9f\00E9rence.', 3);

  raise notice 'Education a la vie affective et relationnelle (cycle 2) importee -- les 4 matieres communes sont completes.';
end $$;