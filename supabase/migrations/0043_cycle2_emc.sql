-- Import du programme officiel cycle 2 -- Enseignement moral et
-- civique (EMC), BO n24 du 13 juin 2024, arrete du 29-05-2024. Chaque
-- grand theme (ex. "Connaissance et maitrise de soi") devient un
-- sous-domaine ; chaque bloc "notions abordees" devient un objectif
-- (contenus d'enseignement) associe a un exemple (demarches
-- d'apprentissage, condensees par rapport au texte source).

do $$
declare
  v_cycle2_id uuid;
  v_type_domaine uuid;
  v_type_sous_domaine uuid;
  v_type_objectif uuid;
  v_type_exemple uuid;
  v_emc_id uuid;
  v_annee_id uuid;
  v_theme_id uuid;
  v_objectif_id uuid;
begin
  select id into v_cycle2_id from cycles where libelle = 'Cycle 2 (CP, CE1, CE2)';
  select id into v_type_domaine from types_element_programme where code = 'domaine';
  select id into v_type_sous_domaine from types_element_programme where code = 'sous_domaine';
  select id into v_type_objectif from types_element_programme where code = 'objectif';
  select id into v_type_exemple from types_element_programme where code = 'exemple_reussite';

  select id into v_emc_id from elements_programme
  where cycle_id = v_cycle2_id and type_element_id = v_type_domaine
    and libelle = U&'Enseignement moral et civique';

  if v_emc_id is not null then
    raise notice 'EMC (cycle 2) deja importe -- rien a faire.';
    return;
  end if;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, null, v_type_domaine, U&'Enseignement moral et civique', 5)
  returning id into v_emc_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_emc_id, v_type_sous_domaine, U&'Cours pr\00E9paratoire', 1)
  returning id into v_annee_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Connaissance et ma\00EEtrise de soi', 1)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Comprendre ses \00E9motions et ses sentiments, leur origine et leurs manifestations. Trouver les r\00E9ponses appropri\00E9es aux besoins exprim\00E9s. Consolider sa confiance en soi. Acqu\00E9rir une estime de soi.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'\00C0 partir de la lecture d''ouvrages de litt\00E9rature de jeunesse, travailler sur l''origine et les manifestations des \00E9motions de base (joie, tristesse, peur, col\00E8re, d\00E9go\00FBt, surprise) pour que l''\00E9l\00E8ve apprenne \00E0 les identifier et \00E0 les exprimer avec un vocabulaire adapt\00E9.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'D\00E9velopper une aptitude \00E0 l''empathie : \00E0 travers de courtes vid\00E9os ou des sayn\00E8tes, les \00E9l\00E8ves apprennent \00E0 d\00E9chiffrer les signaux non verbaux des autres ; lors de discussions r\00E9gl\00E9es autour d''un album, ils apprennent \00E0 \00E9couter et \00E0 distinguer ce qu''un autre dit ou fait de leurs propres r\00E9actions.', 2);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Les r\00E8gles collectives et l''autonomie', 2)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'S''approprier les r\00E8gles de l''\00E9cole (droits et devoirs) pour soi-m\00EAme. Respecter les diff\00E9rents adultes de l''\00E9cole en identifiant leur r\00F4le. D\00E9velopper son autonomie, prendre des initiatives personnelles et faire des choix sans craindre de se tromper. Identifier les risques et les dangers de son environnement imm\00E9diat et adopter un comportement adapt\00E9. Respecter les \00E9quipements de la collectivit\00E9.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Pr\00E9senter explicitement les r\00E8gles de l''\00E9cole conduit les \00E9l\00E8ves \00E0 s''interroger sur leurs droits et leurs devoirs, notamment \00E0 travers la construction des r\00E8gles de vie de la classe.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Pr\00E9senter la r\00E8gle non pas seulement comme une contrainte mais aussi comme une protection qui procure \00E0 l''\00E9l\00E8ve le sentiment de s\00E9curit\00E9 dont il a besoin pour apprendre et s''\00E9panouir en collectivit\00E9.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Le respect des biens et des \00E9quipements de la collectivit\00E9 permet \00E0 l''\00E9l\00E8ve d''en disposer dans un environnement s\00E9curis\00E9 ; l''initier \00E0 la distinction entre propri\00E9t\00E9 personnelle et collective, et au respect d\00FB \00E0 l''environnement et au vivant.', 3);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Savoir que les enfants ont des droits (Convention internationale des droits de l''enfant, 1989).', 2)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Aborder les droits de l''enfant par des extraits choisis de la Convention internationale des droits de l''enfant permet \00E0 l''\00E9l\00E8ve de comprendre que sa protection d\00E9passe le cadre national et de l''\00E9cole.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'R\00E8gles d''hygi\00E8ne et exigence d''intimit\00E9', 3)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Avoir conscience de son int\00E9grit\00E9. Connaitre et appliquer les r\00E8gles \00E9l\00E9mentaires d''hygi\00E8ne personnelle. Connaitre et respecter les r\00E8gles \00E9l\00E9mentaires de l''intimit\00E9 personnelle.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'\00C0 partir de situations r\00E9elles ou fictives, d\00E9velopper le respect par les \00E9l\00E8ves de leur propre corps et de leur intimit\00E9, en abordant la notion d''intimit\00E9 et de droit \00E0 la vie priv\00E9e, le droit \00E0 la s\00E9curit\00E9 et \00E0 la protection, et l''\00E9galit\00E9 entre les filles et les gar\00E7ons.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'\00CAtre \00E9l\00E8ve \00E0 l''\00E9cole de la R\00E9publique', 4)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Identifier le drapeau fran\00E7ais. Reconnaitre La Marseillaise.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'\00C0 partir de la pr\00E9sence des symboles r\00E9publicains dans la salle de classe, faire reconnaitre aux \00E9l\00E8ves le drapeau tricolore et l''hymne national pour poser les premiers jalons d''une culture civique commune.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_emc_id, v_type_sous_domaine, U&'Cours \00E9l\00E9mentaire premi\00E8re ann\00E9e', 2)
  returning id into v_annee_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Alt\00E9rit\00E9 et sociabilit\00E9', 1)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Reconnaitre et prendre en compte les \00E9motions et les sentiments d''autrui. D\00E9velopper sa capacit\00E9 d''empathie. S''entraider et partager avec les autres. Reconnaitre la diversit\00E9 comme richesse et ne pas faire des diff\00E9rences un motif de violence.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'En mobilisant les comp\00E9tences psychosociales, apprendre aux \00E9l\00E8ves \00E0 \00EAtre attentifs aux autres, \00E0 entendre et respecter les \00E9motions des autres, et \00E0 d\00E9velopper un regard positif sur les diff\00E9rences.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Apprendre aux \00E9l\00E8ves \00E0 reconnaitre les situations de violence physique et/ou verbale et de harc\00E8lement, et \00E0 comprendre que le harc\00E8lement est puni par la loi.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Introduire la notion de st\00E9r\00E9otype \00E0 partir d''exemples du quotidien (publicit\00E9, dessin anim\00E9), pour une premi\00E8re approche critique des m\00E9dias.', 3);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'R\00E8gles collectives et prise d''initiative', 2)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Connaitre et appliquer les r\00E8gles \00E9l\00E9mentaires de vie, de communication et d''\00E9change en collectivit\00E9. Identifier les dangers au sein des situations dans lesquelles on se trouve. Prendre des initiatives (faire des choix, les justifier).', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Les \00E9l\00E8ves apprennent \00E0 respecter et \00E0 appliquer les r\00E8gles communes, \00E0 respecter les biens personnels et collectifs, et sont sensibilis\00E9s \00E0 la notion de bien commun.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'D\00E9velopper la responsabilit\00E9 des \00E9l\00E8ves et les amener \00E0 reconnaitre les situations dangereuses ; d\00E9velopper leur autonomie pour les rendre capables de donner l''alerte.', 2);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'Principes et symboles de la R\00E9publique', 3)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Identifier les symboles r\00E9publicains. Apprendre \00E0 chanter le premier couplet et le refrain de La Marseillaise. Comprendre la devise Libert\00E9, \00C9galit\00E9, Fraternit\00E9. Aborder le principe de la libert\00E9 de conscience. Savoir que le fran\00E7ais est la langue de la R\00E9publique.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Rep\00E9rer la pr\00E9sence de symboles de la R\00E9publique dans l''environnement proche de l''\00E9cole, initier \00E0 leur histoire et identifier leur lien avec les valeurs et principes de la R\00E9publique.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'La la\00EFcit\00E9 est abord\00E9e comme libert\00E9 de croire, de ne pas croire ou de changer de croyance, dans le cadre du respect des r\00E8gles de la vie collective.', 2);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_emc_id, v_type_sous_domaine, U&'Cours \00E9l\00E9mentaire deuxi\00E8me ann\00E9e', 3)
  returning id into v_annee_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'L''engagement pour le bien commun', 1)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Sensibiliser \00E0 la notion de bien commun et amener les \00E9l\00E8ves \00E0 prendre conscience que les actions individuelles doivent tenir compte de l''int\00E9r\00EAt collectif.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Participer \00E0 la r\00E9alisation de projets communs. Exp\00E9rimenter la prise de d\00E9cision \00E0 la majorit\00E9 dans la classe, \00E0 travers des conseils d''\00E9l\00E8ves qui initient au fonctionnement du d\00E9bat collectif d\00E9mocratique.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Les \00E9l\00E8ves apprennent progressivement \00E0 diff\00E9rencier l''int\00E9r\00EAt particulier de l''int\00E9r\00EAt g\00E9n\00E9ral, et mettent en pratique les premi\00E8res notions de gestion responsable de l''environnement par des actions simples (\00E9co-gestes).', 2);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Savoir qu''il existe des institutions et des associations au service du bien commun.', 2)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Pr\00E9senter une institution ou une association servant l''int\00E9r\00EAt g\00E9n\00E9ral (pompiers, police, m\00E9tiers de la sant\00E9), et montrer que l''\00E9cole est elle aussi au service de l''int\00E9r\00EAt g\00E9n\00E9ral.', 1);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Aborder des enjeux d''int\00E9r\00EAt collectif : l''\00E9ducation pour tous, l''environnement, la s\00E9curit\00E9, l''information.', 3)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Donner un sens \00E0 la notion de fraternit\00E9 en montrant qu''elle implique de se soucier de l''int\00E9r\00EAt g\00E9n\00E9ral, par exemple \00E0 travers une collecte de denr\00E9es au profit d''une association.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Participer \00E0 une \00E9laboration collective de r\00E8gles de vie adapt\00E9es \00E0 la classe pour apprendre ensemble.', 2);

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_annee_id, v_type_sous_domaine, U&'La R\00E9publique et son fonctionnement', 2)
  returning id into v_theme_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_theme_id, v_type_objectif, U&'Savoir qu''en France le chef de l''\00C9tat est le pr\00E9sident de la R\00E9publique et qu''il est \00E9lu. Savoir que le maire est un \00E9lu local et connaitre son r\00F4le \00E0 la t\00EAte de la collectivit\00E9. Approfondir la compr\00E9hension de la devise Libert\00E9, \00C9galit\00E9, Fraternit\00E9.', 1)
  returning id into v_objectif_id;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'\00C0 partir de l''organisation d''une \00E9lection (d\00E9l\00E9gu\00E9 de classe par exemple), comprendre les r\00E8gles et le fonctionnement de l''\00E9lection pr\00E9sidentielle.', 1);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Faire une enqu\00EAte sur les comp\00E9tences des \00E9lus de la commune, interviewer le maire ou un conseiller municipal.', 2);
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_objectif_id, v_type_exemple, U&'Mettre en \00E9vidence les liens entre les \00E9l\00E9ments de la devise de la R\00E9publique : la libert\00E9 sans l''\00E9galit\00E9 fait r\00E9gner la loi du plus fort, l''\00E9galit\00E9 sans la libert\00E9 emp\00EAche les diff\00E9rences de s''exprimer, la libert\00E9 et l''\00E9galit\00E9 sans la fraternit\00E9, c''est une soci\00E9t\00E9 o\00F9 chacun ne pense qu''\00E0 soi.', 3);

  raise notice 'EMC (cycle 2) importe.';
end $$;