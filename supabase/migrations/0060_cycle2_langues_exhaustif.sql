-- Import complet et exhaustif du programme officiel "Langues vivantes
-- etrangeres et regionales" pour le cycle 2 (BO 481187), a partir du PDF
-- complet fourni par l'utilisatrice. Remplace entierement l'import condense
-- precedent (migrations 0048 et 0050), qui ne retenait qu'un exemple
-- representatif par theme plutot que la totalite des objectifs et exemples
-- du texte officiel.

do $$
declare
  v_cycle2_id uuid;
  v_type_domaine uuid;
  v_type_sous_domaine uuid;
  v_type_objectif uuid;
  v_type_exemple uuid;
  v_langues_id uuid;
  v_activite_id uuid;
  v_annee_id uuid;
  v_theme_id uuid;
  v_objectif_id uuid;
begin
  select id into v_cycle2_id from cycles where libelle = 'Cycle 2 (CP, CE1, CE2)';
  select id into v_type_domaine from types_element_programme where code = 'domaine';
  select id into v_type_sous_domaine from types_element_programme where code = 'sous_domaine';
  select id into v_type_objectif from types_element_programme where code = 'objectif';
  select id into v_type_exemple from types_element_programme where code = 'exemple_reussite';

  -- Supprime l'ancien import condense du domaine "Langues vivantes" s'il
  -- existe, pour le remplacer par la version exhaustive ci-dessous. Les
  -- references parent_id sont en ON DELETE RESTRICT (pas cascade) : on
  -- supprime donc explicitement niveau par niveau, du plus profond (les
  -- exemples) jusqu'au domaine, en 6 passes successives. Si une vraie
  -- observation est deja reliee a l'un de ces elements (ON DELETE RESTRICT
  -- egalement sur observations_elements_programme), la passe correspondante
  -- echoue et toute la migration s'arrete sans rien casser -- a signaler.
  select id into v_langues_id from elements_programme
  where cycle_id = v_cycle2_id and type_element_id = v_type_domaine
    and libelle = 'Langues vivantes etrangeres et regionales';

  if v_langues_id is not null then
    for v_objectif_id in
      with recursive descendants as (
        select id, parent_id, 0 as profondeur from elements_programme where id = v_langues_id
        union all
        select e.id, e.parent_id, d.profondeur + 1
        from elements_programme e join descendants d on e.parent_id = d.id
      )
      select id from descendants where profondeur = 5 order by id
    loop
      delete from elements_programme where id = v_objectif_id;
    end loop;

    for v_objectif_id in
      with recursive descendants as (
        select id, parent_id, 0 as profondeur from elements_programme where id = v_langues_id
        union all
        select e.id, e.parent_id, d.profondeur + 1
        from elements_programme e join descendants d on e.parent_id = d.id
      )
      select id from descendants where profondeur = 4 order by id
    loop
      delete from elements_programme where id = v_objectif_id;
    end loop;

    for v_objectif_id in
      with recursive descendants as (
        select id, parent_id, 0 as profondeur from elements_programme where id = v_langues_id
        union all
        select e.id, e.parent_id, d.profondeur + 1
        from elements_programme e join descendants d on e.parent_id = d.id
      )
      select id from descendants where profondeur = 3 order by id
    loop
      delete from elements_programme where id = v_objectif_id;
    end loop;

    for v_objectif_id in
      with recursive descendants as (
        select id, parent_id, 0 as profondeur from elements_programme where id = v_langues_id
        union all
        select e.id, e.parent_id, d.profondeur + 1
        from elements_programme e join descendants d on e.parent_id = d.id
      )
      select id from descendants where profondeur = 2 order by id
    loop
      delete from elements_programme where id = v_objectif_id;
    end loop;

    for v_objectif_id in
      with recursive descendants as (
        select id, parent_id, 0 as profondeur from elements_programme where id = v_langues_id
        union all
        select e.id, e.parent_id, d.profondeur + 1
        from elements_programme e join descendants d on e.parent_id = d.id
      )
      select id from descendants where profondeur = 1 order by id
    loop
      delete from elements_programme where id = v_objectif_id;
    end loop;

    delete from elements_programme where id = v_langues_id;
  end if;

  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, null, v_type_domaine, 'Langues vivantes etrangeres et regionales', 10)
  returning id into v_langues_id;

  -- === Comprehension de l'oral : ecouter et comprendre ===
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_langues_id, v_type_sous_domaine, 'Comprehension de l''oral : ecouter et comprendre', 1)
  returning id into v_activite_id;

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_activite_id, v_type_sous_domaine, 'Cours preparatoire', 1)
    returning id into v_annee_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Comprendre quelques mots familiers et expressions tres courantes', 1)
      returning id into v_theme_id;

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Reperer quelques mots du champ lexical de la prise de contact ou des salutations', 1)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Dans le cadre des activites ritualisees (accueil du matin, retour de recreation ou debut de seance de langue vivante), l''eleve comprend les formules d''accueil et de salutation utilisees par les professeurs ou l''assistant de langue. Il peut aussi etre fait usage de la mascotte de la classe. Hello! Goodbye! Thank you! Welcome! Come in! I''m fine!', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Reconnaitre les pronoms interrogatifs usuels', 2)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Apres l''ecoute d''un album jeunesse, l''eleve comprend les questions. Who is in the house? What animal is here? Where is he/she/it?', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Reconnaitre les pronoms personnels sujets (je, tu), complements (moi, toi) et les determinants possessifs (mon, ton) accompagnes de gestes', 3)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Dans le cadre d''une activite de fabrication de cartes de voeux ou d''anniversaire, l''eleve comprend differentes consignes. Take your glue stick, please! Use your scissors! Give me my Christmas card, please!', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Identifier les verbes permettant d''exprimer le gout et le degout, ainsi que quelques adjectifs accompagnes de gestes, expressions du visage ou d''un support visuel', 4)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors d''une rencontre avec les eleves de CM2, les eleves de CP enquetent, en utilisant une grille, sur les gouts des eleves de CM2. L''eleve de CP comprend les enonces simples par lesquels l''eleve de CM2 exprime ce qu''il aime et ce qu''il n''aime pas. I like blue. / I don''t like orange.', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Identifier l''humeur de ses interlocuteurs (tristesse, joie, colere) en s''aidant de l''emotion portee par la voix, les gestes et les expressions du visage', 5)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Dans le cadre des 30 minutes d''activite physique quotidienne, d''un jeu de cour, etc., l''eleve entend les consignes indiquant que l''on va jouer a un jeu et manifeste son enthousiasme. Be ready to play! Let''s play together!', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Reperer les mots simples et familiers accompagnes de visuels (famille et environnement immediat)', 6)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors d''un jeu consistant a dire ce que contient sa boite-dejeuner, les eleves disposent d''images sur lesquelles sont representes des aliments. L''eleve les comprend et positionne les images au fur et a mesure. In my lunch box, I have an apple.', 1);

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Suivre le fil d''une histoire adaptee a l''age des eleves et suffisamment etayee', 2)
      returning id into v_theme_id;

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Reconnaitre certaines lettres de l''alphabet et les chiffres', 1)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'A partir d''une comptine numerique traditionnelle, l''eleve comprend les nombres enonces et represente avec ses doigts les quantites identifiees au fil de l''ecoute. 1, 2, buckle my shoe.', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Reconnaitre des mots simples en s''appuyant sur les indices visuels (affiches, images, animations visuelles) et sonores (onomatopees, bruitages, musiques)', 2)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors d''une phase d''ecoute active de l''album Funny Face de Nicola Smee, l''eleve associe, au fil du recit, l''image correspondant a l''emotion representee en s''aidant de l''intonation et de la gestuelle qui accompagne le recit.', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Reconnaitre les mots familiers pour parler de soi, de sa sphere immediate et des thematiques culturelles et disciplinaires travaillees en classe', 3)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors de la decouverte de la comptine Head, Shoulders, Knees and Toes, l''eleve associe les mots aux parties du corps enoncees en les designant au fur et a mesure sur lui-meme ou a l''aide d''une image.', 1);

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Comprendre et agir', 3)
      returning id into v_theme_id;

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Reconnaitre quelques formes courantes de l''imperatif afin de reagir a des consignes et instructions simples accompagnees de gestes ou de supports visuels (consignes de la classe, instructions de jeu ou etapes d''une recette, etc.)', 1)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Dans le cadre de la realisation d''une recette a l''occasion d''un evenement particulier, l''eleve ecoute les instructions donnees par l''enseignant ou l''assistant de langue et selectionne les ingredients indiques dans la recette. Take 1 pineapple. Cut the pineapple. Mix them.', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Agir en suivant les indications donnees par des verbes d''action qui peuvent etre associes a des prepositions permettant de se reperer dans l''espace', 2)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors du jeu Simon Says utilise dans la phase de mise en route, l''eleve ecoute les instructions donnees par les professeurs ou l''assistant de langue et realise l''action demandee. Simon says: Touch your nose. Clap your hands. Go to the door.', 1);

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_activite_id, v_type_sous_domaine, 'Cours elementaire premiere annee', 2)
    returning id into v_annee_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Comprendre quelques mots familiers et expressions tres courantes', 1)
      returning id into v_theme_id;

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Reperer quelques mots du champ lexical de la prise de contact ou des salutations ; reconnaitre les formules usuelles d''encouragement et de felicitations', 1)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors des activites ritualisees, l''eleve comprend les formules d''accueil, les encouragements, les consignes et les instructions formules. Hello! Welcome! Good morning! Come in! Sit down! Well done!', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Reconnaitre les pronoms interrogatifs usuels (Qui ? Que ? Ou ? Comment ?)', 2)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'A partir de la chanson How''s the Weather de Carolyn Graham, l''eleve comprend les expressions tres courantes indiquant le temps qu''il fait et peut designer celle qui correspond parmi les images positionnees sur sa table. How''s the weather? It''s sunny.', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Reconnaitre les pronoms personnels sujets (je, tu, il/elle/on), complements (moi, toi, elle/lui/ca) et les determinants possessifs (mon, ton, son/sa) pour determiner qui parle et de qui l''on parle', 3)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'A partir de l''ecoute de l''album Do You Want To Be My Friend d''Eric Carle, l''eleve reconnait les personnages en prenant appui sur le reseau des pronoms.', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Identifier les verbes permettant d''exprimer le gout et le degout ainsi que quelques adjectifs associes, accompagnes si besoin de gestes, expressions du visage ou d''un support visuel', 4)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors d''une rencontre avec les eleves de CM2, les eleves de CE1 enquetent sur les gouts alimentaires des CM2 et en gardent une trace en positionnant les images correspondantes. I like chocolate ice-cream. / I don''t like cheesecake.', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Identifier l''humeur des interlocuteurs (tristesse, joie, colere) en s''aidant de l''emotion portee par la voix, les gestes et les expressions du visage', 5)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Dans le cadre de l''ecoute de l''album Ghost in the House de Ammi-Joan Paquette, l''eleve identifie l''emotion des monstres, en l''occurrence la peur, en designant une image.', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Reperer les mots simples et familiers accompagnes de visuels (famille et environnement immediat)', 6)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors d''une partie du jeu de cartes des sept familles jouee a quatre, les eleves comprennent quelle carte leur camarade souhaite obtenir. From the elephant family, I want the father.', 1);

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Suivre le fil d''une histoire adaptee a l''age des eleves et suffisamment etayee', 2)
      returning id into v_theme_id;

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Reconnaitre certaines lettres de l''alphabet et les nombres jusqu''a 31 environ', 1)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'A partir de l''ecoute de l''album One to Ten and Back Again, de Sue Heap et Nick Sharratt, l''eleve repere les objets presentes au fil de l''ecoute et les designe. Four bright bows, l''eleve montre les quatre noeuds.', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Reconnaitre quelques structures et formes grammaticales simples appartenant a un repertoire memorise', 2)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors d''une activite pour laquelle l''eleve dispose d''un tableau partiellement renseigne avec des informations relatives a un personnage imaginaire, il ecoute un enonce simple et entoure les illustrations correspondantes. Hello! I''m a boy. I''m 7. My name''s Joe.', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Reconnaitre les mots familiers ou reperer les champs lexicaux qui permettent de parler de soi, de sa sphere immediate et des thematiques culturelles et disciplinaires travaillees en classe', 3)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors d''une phase d''ecoute active de l''album From Head to Toe d''Eric Carle, l''eleve associe les images des animaux de l''histoire avec les parties du corps et les actions qu''ils peuvent realiser par ordre d''apparition.', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Reconnaitre des intonations de phrase propres a la langue pour identifier une question, une affirmation, une exclamation et plusieurs sentiments (joie, colere, surprise, deception, crainte, etc.)', 4)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors d''une phase d''ecoute active de l''album Brown Bear, Brown Bear, What Do You See? d''Eric Carle, l''eleve positionne, par ordre d''apparition, les images representant les animaux de l''histoire.', 1);

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Comprendre et agir', 3)
      returning id into v_theme_id;

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Reconnaitre quelques formes courantes de l''imperatif pour reagir a des consignes et instructions simples (consignes de la classe, instructions de jeu ou etapes d''une recette, etc.), qui peuvent etre eventuellement accompagnees de gestes et de supports visuels', 1)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Pour la confection de crepes a l''occasion du Pancake Day, l''eleve identifie les ingredients de la recette enoncee par les professeurs ou l''assistant de langue puis suit les indications donnees. You need flour, eggs and milk. Take a bowl and put the flour in.', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Agir en suivant les indications donnees par quelques prepositions qui permettent de se reperer dans l''espace et les verbes d''action associes', 2)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors d''une pause active ou dans le cadre des activites physiques quotidiennes, l''eleve comprend et realise les actions enoncees. Jump in the hoop. Clap your hands three times. Turn around two times!', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Identifier les modaux pour exprimer la capacite ou l''incapacite au present', 3)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors d''une activite menee dans la langue cible en calcul mental, l''eleve ecoute les instructions. Mental math activity! What is 12+8? Don''t count on your fingers! Yes, you can do it!', 1);

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_activite_id, v_type_sous_domaine, 'Cours elementaire deuxieme annee', 3)
    returning id into v_annee_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Comprendre quelques mots familiers et expressions tres courantes', 1)
      returning id into v_theme_id;

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Reperer quelques mots du champ lexical de la prise de contact ou des salutations ; reconnaitre les formules usuelles d''encouragement et de felicitations', 1)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors des activites ritualisees, l''eleve comprend les formules d''accueil, les encouragements, les consignes et les instructions formules. Hello! Good morning! Welcome! Nice to see you! Well done!', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Reconnaitre les pronoms interrogatifs usuels (Qui ? Que ? Ou ? Quand ? Comment ?)', 2)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'A partir de l''ecoute de l''album What''s The Time, Mr. Wolf? d''Annie Kubler, l''eleve comprend les expressions tres courantes liees a la routine quotidienne. What''s the time, Mr Wolf? It''s eight o''clock. Time for breakfast!', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Reconnaitre les pronoms personnels sujets, complements et les determinants possessifs pour determiner qui parle et de qui l''on parle', 3)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'A partir du visionnage du dessin anime Peppa Pig Visits Australia, l''eleve reconnait les specificites des personnages australiens.', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Identifier les verbes permettant d''exprimer le gout et le degout ainsi que quelques adjectifs associes, accompagnes si besoin de gestes, expressions du visage ou d''un support visuel', 4)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors d''une rencontre avec les eleves de CM2, les eleves de CE2 enquetent sur les gouts alimentaires des CM2 et en gardent une trace en positionnant les images correspondantes. I prefer chocolate ice cream. Chocolate is better.', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Identifier l''humeur des interlocuteurs (tristesse, joie, colere) en s''aidant de l''emotion portee par la voix, les gestes et les expressions du visage', 5)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'A l''issue du visionnage d''une saynete extraite de Sesame Street et jouee par les eleves, un eleve spectateur identifie les emotions exprimees par des camarades acteurs. Waiter, there is a fly in my soup!', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Reperer les mots simples et familiers accompagnes de visuels (famille et environnement immediat)', 6)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors des activites ritualisees, un eleve indique, en montrant ou deplacant des etiquettes situees dans le coin langue vivante, la date et la meteo du jour. Today is Thursday, the 25th of April. It''s sunny.', 1);

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Suivre le fil d''une histoire adaptee a l''age des eleves et suffisamment etayee', 2)
      returning id into v_theme_id;

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Reconnaitre toutes les lettres de l''alphabet et les nombres jusqu''a 100 environ', 1)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors d''une seance EMILE en calcul mental, l''eleve ecoute l''addition et ecrit la somme correspondante sur son ardoise. Fifty-four plus nine equals...', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Reconnaitre quelques structures et formes grammaticales simples appartenant a un repertoire memorise', 2)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors de la Journee internationale des assistants de langue debut decembre, les eleves ecoutent le temoignage d''un assistant indien. My name is Irfan. I''ve got one sister and two brothers.', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Reconnaitre les mots familiers ou reperer les champs lexicaux qui permettent de parler de soi, de sa sphere immediate et des thematiques culturelles et disciplinaires travaillees en classe', 3)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors d''une phase d''ecoute active de l''album The Very Hungry Caterpillar d''Eric Carle, l''eleve associe les jours de la semaine aux chiffres et aux fruits. On Tuesday, he ate through two pears.', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Reconnaitre des intonations de phrase propres a la langue pour identifier une question, une affirmation, une exclamation et plusieurs sentiments (joie, colere, surprise, deception, crainte, etc.)', 4)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors d''une reecoute de l''album How Do You Feel? d''Anthony Browne, l''eleve identifie le mot decrivant une emotion dans la phrase en s''aidant de la lecture intonative qui en est faite.', 1);

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Comprendre et agir', 3)
      returning id into v_theme_id;

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Reconnaitre quelques formes courantes de l''imperatif pour reagir a des consignes (consignes de classe, instructions de jeu ou etapes d''une recette, etc.) qui peuvent etre eventuellement accompagnees de gestes et de supports visuels', 1)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'L''eleve fabrique un petit livre, support d''une presentation de soi, en ecoutant et en observant les etapes enoncees dans les consignes. Get a sheet of paper. First, fold the paper in half.', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Agir en suivant les indications donnees par quelques prepositions qui permettent de se reperer dans l''espace et les verbes d''action associes', 2)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'A l''ecoute de la comptine My Hands Upon My Head I Place, l''eleve realise les actions enoncees au fur et a mesure.', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Identifier les modaux pour exprimer la capacite ou l''incapacite, au present', 3)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors d''une activite EMILE en EPS sur le basket-ball, les eleves ecoutent les regles du jeu. You can dribble! You can pass the ball and shoot! You can''t push your friends.', 1);

  -- === Expression orale en continu : parler en continu ===
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_langues_id, v_type_sous_domaine, 'Expression orale en continu : parler en continu', 2)
  returning id into v_activite_id;

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_activite_id, v_type_sous_domaine, 'Cours preparatoire', 1)
    returning id into v_annee_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Reperes phonologiques', 1)
      returning id into v_theme_id;

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Realiser les specificites phonologiques essentielles de la langue apprise', 1)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors d''un jeu de plateau visant le reinvestissement du vocabulaire des animaux, l''eleve a comme consigne de prononcer le nom de l''animal, au singulier ou au pluriel, selon l''image qui figure sur la case sur laquelle il se trouve.', 1);
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors d''une activite permettant de travailler la prononciation de quelques couleurs, l''eleve ecarte les bras pour marquer une voyelle longue, passe les bras de gauche a droite pour une diphtongue, frappe dans ses mains pour marquer une voyelle courte.', 2);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Prononcer correctement des mots isoles et memorises dans plusieurs champs lexicaux connus en respectant l''accentuation des mots selon le modele phonetique de la langue', 2)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Les professeurs montrent quelques objets du petit materiel de classe et demandent aux eleves de les nommer en accentuant la bonne syllabe et en y associant un geste de la main : pencil, rubber, ruler, schoolbag.', 1);

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Reproduire un modele oral', 2)
      returning id into v_theme_id;

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Parler de soi ou de son environnement familier en s''appuyant sur des supports visuels et en prononcant correctement des formules breves, ritualisees et memorisees', 1)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors d''un jeu de devinette de type Who Am I?, un eleve pioche une carte d''identite et se decrit a partir des pictogrammes qui y sont representes. I''m 6. My favourite colour is green. I like music. Who am I?', 1);

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Raconter', 3)
      returning id into v_theme_id;

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Nommer, caracteriser, denombrer tres simplement des personnes, des objets, des lieux : mobiliser quelques mots connus en lien avec les domaines etudies, avoir recours a quelques adjectifs usuels, compter en utilisant la suite numerique', 1)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors d''un jeu en binome visant la reactivation du vocabulaire de la classe, un eleve choisit une image parmi trois et la decrit afin que son binome la pointe du doigt. Two big pens, one big book, two chairs.', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Situer dans l''espace, a l''aide de prepositions et d''expressions lexicalisees, les personnes, les objets et les lieux', 2)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Dans la classe, des eleves choisissent un emplacement et decrivent leur position. I''m at the door. I''m on the chair. I''m under the table. I''m next to the board.', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Situer dans le temps : exprimer le jour, exprimer des reperes temporels tres simples', 3)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'A l''occasion de son anniversaire, l''eleve peut dire a ses camarades : Today is my birthday, I''m 7. Les autres eleves peuvent lui souhaiter : Happy birthday!', 1);

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Se decrire en utilisant des expressions courtes ou proches des modeles rencontres lors des apprentissages', 4)
      returning id into v_theme_id;

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Exprimer simplement des informations sur soi et sur les autres : utiliser le present des verbes les plus courants a la premiere ou deuxieme personne du singulier, se presenter a l''aide d''expressions lexicalisees', 1)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors de l''arrivee d''une nouvelle mascotte dans la classe, les eleves se presentent tour a tour. Hello! My name''s Alice. I''m 6 years old. My favourite colour is purple. I''ve got a pet, it''s a dog.', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Donner des informations simples sur des activites quotidiennes, des habitudes : nommer les moments de la journee, mobiliser quelques mots en lien avec les activites quotidiennes, les habitudes, etc.', 2)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors de l''annonce du programme de la journee, un eleve annonce, en s''appuyant sur l''affichage de classe : This morning, I have Mathematics. At lunchtime, I eat at home. This afternoon, I play basketball.', 1);

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_activite_id, v_type_sous_domaine, 'Cours elementaire premiere annee', 2)
    returning id into v_annee_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Reperes phonologiques', 1)
      returning id into v_theme_id;

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Realiser les specificites phonologiques essentielles de la langue etudiee', 1)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Apres avoir etudie l''album One to Ten and Back Again de Sue Heap et Nick Sharratt, l''eleve repete les differents elements en se concentrant sur le pluriel des noms : one chocolate biscuit, nine chocolate biscuits.', 1);
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors d''un jeu de memory representant des paires minimales, l''eleve prononce correctement pour remporter sa paire : pen / ten, cat / rat, three / tree.', 2);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Prononcer correctement des mots isoles et memorises dans certains champs lexicaux connus en respectant le schema phonetique', 2)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors de l''apprentissage des jours de la semaine, l''eleve compte le nombre de syllabes dans les mots et le manifeste par un geste de la main qui s''etend et s''ouvre vers l''avant pour la syllabe accentuee.', 1);

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Reproduire un modele oral', 2)
      returning id into v_theme_id;

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Parler de soi ou de son environnement familier, en s''appuyant sur des supports visuels et en prononcant correctement des formulations breves ritualisees et memorisees', 1)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Le 17 mars, dans le cadre des preparatifs de la Saint Patrick, les eleves apprennent une danse folklorique irlandaise ; un eleve joue le role de meneur et nomme les actions que ses camarades doivent realiser : Turn around, hop, stamp your feet.', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Dire a voix haute une expression ou phrase courte deja connue a l''oral ou chanter collectivement une courte comptine', 2)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors de la mise en voix d''une comptine tres simple, l''eleve marque les syllabes accentuees en battant la pulsation avec le corps ou la main : Rain, rain go away! Come again another day.', 1);

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Raconter', 3)
      returning id into v_theme_id;

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Nommer, caracteriser, denombrer tres simplement des personnes, des objets, des lieux : mobiliser quelques mots ou champs lexicaux connus en lien avec les domaines et thematiques etudies, avoir recours a quelques adjectifs usuels, appliquer les regles elementaires de l''accord, compter en utilisant la suite numerique', 1)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'A l''occasion de l''enregistrement d''une courte emission pour la webradio de l''ecole, les eleves presentent les etapes de la recette de la tarte aux pommes a l''aide de phrases courtes apprises par coeur : Let''s make a big apple pie! First, we prepare three red apples.', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Situer dans l''espace les personnes, les objets et les lieux, a l''aide de prepositions et d''expressions lexicalisees', 2)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'A l''arrivee de l''assistant de langue dans leur ecole, les eleves l''accueillent et lui font visiter les lieux. Here is the playground. Turn left and you arrive at the canteen.', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Situer dans le temps : exprimer le jour et la date du jour en s''appuyant sur un etayage visuel, exprimer des reperes temporels tres simples', 3)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors des rituels de debut de seance, un eleve enonce la date du jour en s''aidant au besoin de l''affichage du coin langue vivante : Today is Monday, the third of December. This morning, we have English.', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Reproduire un modele oral court en suivant la trame d''une histoire repetitive (histoire en randonnee)', 4)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors d''une seance sur les animaux de la ferme, les eleves chantent la chanson Old Mac Donald Had A Farm.', 1);

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Se decrire en utilisant des expressions courtes ou proches des modeles rencontres lors des apprentissages', 4)
      returning id into v_theme_id;

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Exprimer simplement des informations sur soi et sur les autres : utiliser et maitriser le present des verbes les plus courants a la premiere, deuxieme ou troisieme personne du singulier, se presenter a l''aide d''expressions lexicalisees', 1)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors d''echanges dans le cadre d''une correspondance scolaire, les eleves se decrivent ainsi que leur environnement proche, dans des enregistrements audios : My name''s Charlie, I live in Lyon, I''m seven years old. This is my friend, his name''s David.', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Donner des informations simples sur des activites quotidiennes, des habitudes : nommer les differents moments de la journee, mobiliser quelques mots et champs lexicaux, meme peu etendus, en lien avec les activites quotidiennes, les habitudes, etc.', 2)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors d''un jeu sur les differents moments de la journee, les eleves piochent une carte qui en indique un et doivent raconter leurs habitudes correspondantes : In the morning, I wake up at 7 o''clock. I have breakfast. I go to school.', 1);

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_activite_id, v_type_sous_domaine, 'Cours elementaire deuxieme annee', 3)
    returning id into v_annee_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Reperes phonologiques', 1)
      returning id into v_theme_id;

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Realiser les specificites phonologiques essentielles de la langue etudiee', 1)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'A partir du chant de Carolyn Graham Witches, Witches, l''eleve s''exerce a prononcer le -s en fin de mot, qui marque le pluriel et qui se prononce differemment selon les mots : cats, ghosts, bats / skeletons / witches.', 1);
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors d''un exercice de discrimination auditive de phonemes proches, l''eleve doit entourer l''image qui represente le mot comprenant le son recherche au sein d''une serie de mots enonces.', 2);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Prononcer correctement des mots isoles et memorises dans certains champs lexicaux connus en respectant l''accentuation des mots selon la langue', 2)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'A partir de la mise en voix du chant Witches, Witches, l''eleve marque l''intonation et le rythme en utilisant un codage defini en classe pour marquer les syllabes accentuees lors de la mise en voix d''une comptine simple.', 1);

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Reproduire un modele oral', 2)
      returning id into v_theme_id;

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Prononcer correctement des formulations breves ritualisees et memorisees pour parler de soi ou de son environnement familier et en s''appuyant sur des supports visuels', 1)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors d''une sequence d''EPS en lien avec le dispositif Savoir rouler a velo et dans le cadre d''un dispositif EMILE, les eleves decrivent l''equipement de leur velo a l''aide d''une formulation memorisee. Look at my bike! It''s got a basket and a bell.', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Lire a voix haute une expression ou phrase courte deja connue a l''oral ou memorisee', 2)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Dans le cadre d''une action de sensibilisation aux mobilites douces, la classe participe a un defi sur le theme de l''ecomobilite scolaire. Who came to school by bike today?', 1);

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Raconter', 3)
      returning id into v_theme_id;

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Nommer, caracteriser, denombrer tres simplement des personnes, des objets, des lieux : mobiliser quelques mots ou champs lexicaux connus en lien avec les domaines et thematiques etudiees, avoir recours a quelques adjectifs usuels, appliquer les regles elementaires de l''accord, compter en utilisant la suite numerique', 1)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Apres avoir ecoute l''album My Mum d''Anthony Browne, un eleve raconte ce qu''il en a compris : The mum is a gardener. The mum can sing. She''s really nice.', 1);
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'A partir de la lecture d''un livre, l''eleve fait part de son avis a la classe : I like this book. There is a unicorn. It''s fantastic.', 2);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Situer dans l''espace les personnes, les objets et les lieux, a l''aide de prepositions et d''expressions lexicalisees', 2)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors de l''observation de la couverture du livre de jeunesse The Jungle Book de Rudyard Kipling, un eleve decrit l''image a l''oral : There is a tiger on a rock. A boy is in the water with a fish in his hand.', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Situer dans le temps : exprimer la date du jour en s''appuyant sur un etayage visuel, exprimer des reperes temporels tres simples, raconter des evenements dans un ordre chronologique simple', 3)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Dans le cadre d''un dispositif EMILE, la classe ecoute la chanson Imagine de John Lennon. Un eleve raconte ses impressions sonores : First, I can hear the piano. Second, I can hear a singer.', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Reproduire un modele oral court en suivant la trame d''une histoire repetitive (histoire en randonnee)', 4)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors de la lecture de l''album The Very Hungry Caterpillar d''Eric Carle, caracterise par une structure iterative associant les jours de la semaine, les nombres et differents fruits, l''eleve est encourage a dire lui-meme une partie du texte.', 1);

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Decrire ou se decrire en utilisant des expressions courtes ou proches des modeles rencontres lors des apprentissages', 4)
      returning id into v_theme_id;

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Exprimer simplement des informations sur soi et sur les autres : utiliser et maitriser le present des verbes les plus courants a la premiere, deuxieme ou troisieme personne du singulier, se presenter a l''aide d''expressions lexicalisees', 1)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors d''une phase de reinvestissement lexical, les eleves participent a un jeu sur le theme des pieces de la maison. Un eleve decrit une action qu''il realise et indique dans quelle piece il se trouve : I''m sleeping, I''m in the bedroom.', 1);
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Une fois que l''assistant s''est presente aux differentes classes de l''ecole, les eleves de CE2 le decrivent : He''s from Ghana and he''s 25 years old. He speaks French and English.', 2);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Donner des informations simples sur des activites quotidiennes, des habitudes : nommer les differents moments de la journee, mobiliser quelques mots ou quelques champs lexicaux, meme peu etendus, en lien avec les activites quotidiennes, les habitudes, etc.', 2)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'A partir de leur emploi du temps, les eleves decrivent leurs activites a des partenaires dans le cadre d''un projet eTwinning : On Mondays, we have French. On Tuesdays, we have Physical Education in the playground.', 1);

  -- === Expression orale en interaction : reagir et dialoguer ===
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_langues_id, v_type_sous_domaine, 'Expression orale en interaction : reagir et dialoguer', 3)
  returning id into v_activite_id;

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_activite_id, v_type_sous_domaine, 'Cours preparatoire', 1)
    returning id into v_annee_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Echanger des informations simples', 1)
      returning id into v_theme_id;

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Poser quelques questions simples a l''aide des pronoms interrogatifs', 1)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors de l''accueil d''un intervenant exterieur, chaque eleve se presente : Hello, who are you? I''m Alice! Hello, Alice! Where are you from? I''m from Canada.', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Donner quelques consignes ou ordres simples ritualises a l''aide de verbes frequemment utilises a l''imperatif', 2)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors d''un jeu des sept familles, l''eleve demande a son partenaire de piocher ou de donner une carte : Pick a card, give me the father, please.', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Utiliser les reponses courtes', 3)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors des 30 minutes d''activites physiques quotidiennes, les eleves jouent a colin-maillard. Who is it? Is it Julia? No! I''m Anna! Play again!', 1);

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Exprimer des emotions et formuler des souhaits elementaires', 2)
      returning id into v_theme_id;

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Exprimer son ressenti et ses souhaits de maniere tres simple en utilisant une gestuelle ou des expressions du visage', 1)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors de l''accueil en classe, les eleves repondent a leur enseignant en associant un geste, une attitude ou une mimique : How are you today? I''m happy (en souriant).', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Exprimer des sentiments ou des emotions dans le cadre de situations ritualisees en utilisant des mots isoles ou des expressions tres simples', 2)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'En prenant appui sur le vocabulaire appris en classe, des eleves miment tour a tour une emotion ou un sentiment que les autres eleves doivent deviner : Are you happy? Yes, I''m happy!', 1);

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Clarifier ou faire clarifier un point', 3)
      returning id into v_theme_id;

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Indiquer tres simplement a un interlocuteur que l''on n''a pas compris en utilisant au besoin une gestuelle ou des expressions du visage', 1)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'A partir de l''etude de la faune d''Australie, la classe a fabrique un loto des animaux. Koala. I have it! Kangaroo... Repeat, please. Kangaroo!', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Connaitre et prononcer de maniere comprehensible quelques lettres de l''alphabet pour epeler un mot tres simple ou le reconnaitre', 2)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors de la premiere rencontre interclasses, les eleves de CP et ceux de CM2 se choisissent des prenoms courts dans la langue apprise et se presentent : Hello, I am Tom. Tom? Yes, Tom. T-O-M.', 1);

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Utiliser des procedes tres simples pour commencer, poursuivre et terminer une conversation breve', 4)
      returning id into v_theme_id;

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Utiliser des formules de salutation tres simples et adaptees a son interlocuteur, en situation connue et repetee, pour ouvrir ou clore un echange', 1)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors de la Semaine des langues, les eleves saluent les personnels de l''ecole ou leur disent au revoir dans la langue apprise : Hello! Good morning! Good bye! See you soon!', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Utiliser des formules de politesse variees', 2)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors de la distribution de materiel par leurs camarades de classe ou par un adulte referent, les eleves sont encourages a remercier en anglais : Your paper. Thanks a lot! You''re welcome!', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Relancer une conversation ou un bref echange par des questions elementaires', 3)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'A partir de la chanson What''s This, What''s That? travaillee en classe, les eleves s''appuient sur sa structure pour entrer en interaction en s''interpelant dans un ordre aleatoire : What''s this? This is a dog!', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Utiliser des expressions tres courantes pour clore une conversation', 4)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Un eleve utilise la mascotte de la classe pour clore la seance : Thank you! See you soon!', 1);

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_activite_id, v_type_sous_domaine, 'Cours elementaire premiere annee', 2)
    returning id into v_annee_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Echanger des informations simples', 1)
      returning id into v_theme_id;

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Poser quelques questions simples a l''aide d''une gamme tres reduite de pronoms interrogatifs', 1)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'A partir de cartes d''identite d''eleves qui vivent dans differentes villes du monde, l''eleve A interroge l''eleve B qui lui repond : What''s your name? My name''s Billy. Where do you live? I live in Boston.', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Donner quelques consignes ou ordres simples ritualises a l''aide de verbes frequemment utilises a l''imperatif', 2)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors d''activites manuelles, les eleves ont construit une cocotte en papier contenant des messages positifs. Ils la testent en binome : Choose a number! Choose a colour! Have a wonderful day!', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Utiliser les reponses courtes', 3)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors de l''inventaire hebdomadaire du materiel de classe, les eleves repondent aux demandes qui leur sont faites : What''s this? This is an eraser. Do you have your eraser? Yes, I do!', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Mobiliser l''expression permettant de formuler simplement l''autorisation sous forme de bloc lexicalise', 4)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors d''un projet interdisciplinaire autour de l''oeuvre de Keith Haring, les eleves echangent pour se partager le materiel : Give me the black pen please! Can I have the scissors? Yes, take them.', 1);

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Exprimer des emotions et formuler des souhaits elementaires', 2)
      returning id into v_theme_id;

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Exprimer son ressenti et ses souhaits de maniere tres simple en utilisant des blocs lexicalises, une gestuelle ou les expressions du visage, et mobiliser l''expression de sentiments ou d''emotions dans le cadre de situations ritualisees', 1)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors d''un rituel, l''eleve A demande a son binome comment il va. L''eleve B tire une carte et exprime l''emotion representee : How are you today? I''m very happy today.', 1);
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors de leur arrivee en classe, les eleves choisissent un jeton de la couleur de leur emotion et le mettent dans le bocal correspondant : I feel happy today! And you? I feel happy too!', 2);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Connaitre et mobiliser quelques onomatopees typiques', 2)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'A partir de la lecture de l''album There Are No Animals In This Book (Only Feelings), les eleves jouent a un jeu de memory numerique illustre par les icones des emotions : Sad and hurrah... No, it''s your turn. Happy and yay!', 1);

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Clarifier ou faire clarifier un point', 3)
      returning id into v_theme_id;

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Indiquer tres simplement qu''il n''a pas compris en utilisant au besoin la gestuelle ou les expressions du visage', 1)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors d''une seance d''initiation a la programmation, les eleves guident un eleve robot dans un espace defini : Two steps forward. Three? Can you repeat, please? No, two steps. Now, turn right!', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Connaitre et prononcer de maniere comprehensible quelques lettres de l''alphabet afin d''epeler un mot tres simple ou le reconnaitre', 2)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors d''un jeu de bataille navale, les eleves echangent en binome : B What? B 6. No ship! My turn. C 8.', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Mobiliser des formules toutes faites pour demander le sens d''un mot', 3)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors d''une activite de calcul mental dans la langue apprise, les eleves par groupe se proposent des calculs tour a tour : Five and two is...? Seven. What''s the English for ''moins''? Minus!', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Donner quelques consignes simples memorisees en lien avec le lexique de la communication de classe', 4)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors d''une activite de bouche a oreille, deux equipes s''affrontent pour repeter en chuchotant une consigne de classe a leurs coequipiers : Take your blue pen. Can you repeat? Super! The instruction is correct!', 1);

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Utiliser des procedes tres simples pour commencer, poursuivre et terminer une conversation breve', 4)
      returning id into v_theme_id;

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Utiliser des formules de salutation tres simples et adaptees a son interlocuteur en situation connue et repetee pour ouvrir ou clore un echange', 1)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'A l''occasion de la Semaine des langues, les eleves de l''ecole se saluent ou prennent conge en adaptant la formule au moment de la journee : Good morning! Good afternoon! See you on Thursday. Bye!', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Utiliser des formules de politesse variees', 2)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'A la suite d''un echange en visioconference dans le cadre d''un projet eTwinning, la classe a recu des cartes postales. Les eleves remercient leurs partenaires : We have your postcards! Thank you so much! They are very beautiful!', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Relancer par des questions elementaires, utiliser des formules simples de relance ou de ponctuation coherentes en fonction de situations connues et repetees', 3)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors de la Journee europeenne des langues, les eleves qui le souhaitent se presentent dans les differentes langues de leur biographie langagiere. Les autres eleves reagissent et relancent pour en savoir plus.', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Utiliser des expressions tres courantes pour clore une conversation', 4)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Dans le cadre d''une saynete qui met en scene un client et un serveur dans un restaurant, l''eleve prend conge de son interlocuteur : Thank you for everything! Good bye!', 1);

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_activite_id, v_type_sous_domaine, 'Cours elementaire deuxieme annee', 3)
    returning id into v_annee_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Echanger des informations simples', 1)
      returning id into v_theme_id;

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Poser quelques questions simples a l''aide d''une gamme tres reduite de pronoms interrogatifs', 1)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Dans le cadre d''un projet pluridisciplinaire impulse a partir de l''album What''s the Time, Mr Wolf?, les eleves jouent au jeu traditionnel du meme nom pendant les 30 minutes d''activite physique quotidienne : What time is it, Mister Wolf? It''s three o''clock! Let''s move three steps!', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Donner quelques consignes ou ordres simples ritualises a l''aide de verbes frequemment utilises a l''imperatif', 2)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'A partir de la lecture de l''album GO AWAY, Big Green Monster!, les eleves dessinent un monstre en binome a l''aide de deux des : Roll the dice. Four and eyes. Draw four eyes on the face.', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Utiliser les reponses courtes et mobiliser l''expression simple de l''autorisation sous forme de bloc lexicalise', 3)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors d''un echange avec leurs partenaires de projet eTwinning, un petit groupe d''eleves dialogue en visioconference pour expliquer les regles a suivre a la piscine : You can''t run in the swimming pool. Can you jump in the water? Yes, you can.', 1);

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Exprimer des emotions et formuler des souhaits elementaires', 2)
      returning id into v_theme_id;

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Exprimer son ressenti et ses souhaits de maniere tres simple en utilisant des blocs lexicalises, une gestuelle ou les expressions du visage', 1)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors de la visite virtuelle du musee d''histoire naturelle de Londres, les eleves expriment leurs emotions : Look at the skeleton of the whale. It''s fascinating! Oh! A dinosaur. No, I''m scared.', 1);
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors de la confection d''un attrape-reve, les eleves expriment leur ressenti : It''s easy to do! Yes, and it''s beautiful. And it''s very colourful.', 2);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Connaitre et mobiliser quelques onomatopees typiques', 2)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors de la Semaine du gout, une specialite est degustee chaque jour. Les eleves reagissent par l''utilisation d''adjectifs ou de phrases courtes : Yummy! Yummy! This Victoria Sponge cake is good!', 1);

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Clarifier ou faire clarifier un point', 3)
      returning id into v_theme_id;

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Indiquer tres simplement qu''il n''a pas compris en utilisant au besoin la gestuelle ou les expressions du visage', 1)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors de l''activite ritualisee de fin de journee, un eleve dit ce que chacun doit mettre dans son cartable. Les camarades demandent confirmation : You need the math textbook and the poetry textbook. Can you repeat please?', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Connaitre et prononcer de maniere comprehensible toutes les lettres de l''alphabet pour epeler un mot tres simple ou le reconnaitre', 2)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors de la preparation d''une courte video de presentation a l''attention de leurs correspondants, chaque eleve se presente et epelle son prenom : Hello, my name''s Nicolas! N.I.C.O.L.A.S.', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Mobiliser des formules toutes faites pour demander le sens d''un mot', 3)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors d''un premier temps d''echange en visioconference avec leurs partenaires de projet eTwinning sur le recyclage, les eleves demandent : What''s the English for ''Recyclage''? Recycling! Can you spell it please?', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Clarifier quelques consignes simples memorisees en lien avec le lexique de la communication de classe', 4)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Dans le cadre d''un jeu de plateau, l''eleve explique les regles du jeu. Un eleve dit qu''il ne comprend pas. Le premier eleve reformule : Throw the dice and move your pawn. I don''t understand! Look! Take your dice, count the dots.', 1);

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Utiliser des procedes tres simples pour commencer, poursuivre et terminer une conversation breve', 4)
      returning id into v_theme_id;

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Utiliser des formules de salutation tres simples et adaptees a son interlocuteur en situation connue et repetee pour ouvrir ou clore un echange, utiliser des formules de politesse variees', 1)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'A partir du plan d''une grande ville ou est parlee la langue apprise, les eleves jouent une petite saynete pour s''entrainer a demander leur chemin : Hello, excuse me, please... Can you tell me the way to the British Museum? Thank you so much! You''re welcome! Goodbye!', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Relancer par des questions elementaires, utiliser des formules simples de relance ou de ponctuation, coherentes en fonction de situations connues et repetees', 2)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors d''un echange avec leurs partenaires de projet eTwinning, les eleves montrent des photos de leur famille : Who is in the picture? My sister. What is she wearing? A traditional sari.', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Utiliser des expressions courantes pour clore une conversation', 3)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Dans le cadre de la Semaine des langues, un club langues est organise a chaque pause meridienne, donnant lieu a des echanges entre eleves et adultes : Bye-bye, thank you! See you tomorrow! Are you here tomorrow? Yes! Of course!', 1);

  -- === Comprehension de l'ecrit : lire et comprendre ===
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_langues_id, v_type_sous_domaine, 'Comprehension de l''ecrit : lire et comprendre', 4)
  returning id into v_activite_id;

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_activite_id, v_type_sous_domaine, 'Cours elementaire deuxieme annee', 3)
    returning id into v_annee_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Reconnaitre des mots ou des messages ecrits familiers', 1)
      returning id into v_theme_id;

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'S''appuyer sur les mots familiers des lors qu''ils ont fait l''objet d''un travail d''appropriation des correspondances graphophonemiques puis progressivement sans supports visuels', 1)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'A partir d''une carte postale fictive adressee depuis l''Australie par la mascotte de la classe, l''eleve repere et identifie le nom des animaux que la mascotte a observes la-bas. Hello everyone! I am in Australia. At the zoo, I can see kangaroos, koalas, snakes and crocodiles.', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Reperer les chiffres et les nombres en ecriture litterale lorsqu''ils sont accompagnes d''une ecriture chiffree ou de visuels et qu''ils ont deja fait l''objet d''un travail d''appropriation a l''oral', 2)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Apres avoir decouvert et ecoute l''album One to ten and back again, l''eleve repere a l''ecrit le lexique se referant aux nombres de 1 a 10 en s''aidant des illustrations et des phrases associees. One girl called Sue. Five pink pigs. Ten oranges.', 1);
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'A la lecture du programme d''un tournoi sportif, l''eleve repere les sports concernes chaque jour par une epreuve. Monday. At 10 a.m.: football; at 2 p.m.: rugby.', 2);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Reconnaitre quelques mots des champs lexicaux qui permettent de parler de soi et de sa sphere immediate des lors qu''ils ont fait l''objet d''un travail d''appropriation des correspondances graphophonemiques, eventuellement accompagnes de visuels', 3)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Apres avoir decouvert et ecoute l''album Me and My Family Tree de Joan Sweeney, l''eleve reconnait a l''ecrit le lexique se referant aux membres de la famille en s''aidant des illustrations. These are my parents, my mommy and daddy.', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Reconnaitre quelques mots du champ lexical des activites quotidiennes des lors qu''ils ont fait l''objet d''un travail d''appropriation a l''oral et d''observation des correspondances graphophonemiques, pouvant etre accompagnes de visuels', 4)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Les eleves lisent en grand groupe l''album Mr Wolf''s Week de Colin Hawkins puis associent le texte aux vignettes correspondantes. Wednesday is cold. Mr Wolf puts on a warm sweater, a scarf, mittens and two pairs of socks.', 1);

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Trouver des informations dans des ecrits tres simples', 2)
      returning id into v_theme_id;

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Trouver des informations simples et familieres en s''appuyant sur les indices visuels (image) ainsi que sur les mots familiers et sur les elements mis en avant dans le titre du texte', 1)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'A partir du prospectus presentant les activites de la fete de l''ecole, l''eleve repere et selectionne, a l''aide de photos, les ateliers qu''il souhaite realiser. Make a card for your friend. Learn a song. Make cookies.', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Reconnaitre quelques mots des champs lexicaux qui permettent de parler de soi et de sa sphere immediate des lors qu''ils ont fait l''objet d''un travail d''appropriation des correspondances graphophonemiques', 2)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'L''eleve lit l''album My Dad is Brilliant de Nick Butterworth et est capable de comprendre les talents du pere en s''aidant des illustrations. He can play any instrument and he''s a marvellous cook.', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Reperer les chiffres et les nombres en ecriture litterale des lors qu''ils sont accompagnes d''une ecriture chiffree ou de visuels', 3)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'En lien avec une seance du domaine Questionner le monde sur les caracteristiques du monde vivant, l''eleve lit l''album Ten Seeds de Ruth Brown et repere, en s''aidant des illustrations, les nombres en ecriture litterale.', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Reconnaitre quelques mots du champ lexical des activites quotidiennes des lors qu''ils ont fait l''objet d''un travail d''appropriation a l''oral et d''observation des correspondances graphophonemiques, pouvant etre accompagnes de visuels', 4)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'A partir d''affiches presentant les activites quotidiennes d''enfants de differents pays, l''eleve releve les similitudes et les differences et les reporte dans un tableau a double entree. I wake up at 7 a.m., I go to school at 8 a.m.', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Identifier quelques types de textes ecrits grace a leur mise en forme (invitation, carte postale, carte de voeux, publicite, etc.)', 5)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'A partir d''une carte d''invitation que l''eleve a recue de son correspondant, il releve les informations precisant la date, le lieu et les horaires de leur prochaine rencontre. Dear friend, I will see you on Friday, 7th of May at 8 a.m.', 1);

  -- === Expression ecrite : ecrire et reagir a l'ecrit ===
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_langues_id, v_type_sous_domaine, 'Expression ecrite : ecrire et reagir a l''ecrit', 5)
  returning id into v_activite_id;

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_activite_id, v_type_sous_domaine, 'Cours elementaire deuxieme annee', 3)
    returning id into v_annee_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Epeler, recopier ou ecrire des elements connus', 1)
      returning id into v_theme_id;

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Recopier dans son cahier la date du jour, des etiquettes-mots et des elements ecrits au tableau, prelevees dans un texte court ou ayant fait l''objet d''une manipulation a partir d''etiquettes-mots ; recopier de tres courtes phrases ayant fait l''objet d''une observation reflechie et d''une appropriation orale', 1)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors des activites ritualisees, les eleves copient dans leur cahier la date du jour en langue etrangere a partir des elements affiches dans l''espace langues de la classe. Monday, December 11th. Thursday, April 4th.', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Retranscrire un mot connu puis retranscrire une serie de mots entendus et memorises des lors qu''ils ont fait l''objet d''une appropriation a l''oral (comprehension, memorisation, production orale)', 2)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors de la Semaine des langues, les eleves realisent les affichages qui presentent les activites proposees. Monday: tea party at 3 p.m. Tuesday: sing with the Beatles at 4 p.m.', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Exprimer simplement d''ou l''on vient et ou l''on vit ; se presenter brievement a l''ecrit a l''aide d''expressions lexicalisees en juxtaposant quelques phrases simples deja connues et ayant fait l''objet de jeux d''observation et d''appropriation a l''oral', 3)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'A partir de la lecture de l''album Paddington in London, les eleves elaborent une courte fiche d''identite de l''ours. Paddington is from Peru. He lives in London.', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Exprimer simplement ses gouts a l''aide des verbes les plus courants', 4)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors d''un echange de courrier avec la classe des correspondants, les eleves ont envoye une photo de leur classe. Ils se decrivent pour que les correspondants devinent ou ils se situent : I am Charlie. I have curly blond hair. I am wearing a blue shirt.', 1);
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Toujours dans le cadre de cet echange, ils decrivent leurs gouts. My name is Kim. I like chocolate. I love swimming.', 2);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Utiliser quelques blocs lexicalises tres simples pour ecrire un courrier a un proche dans le cadre d''une fete calendaire ou pour decrire son environnement immediat lors d''un voyage', 5)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Au moment du Nouvel An, et en lien avec les activites en arts visuels, les eleves ont realise des cartes de voeux. Ils ecrivent leurs messages en s''inspirant de modeles. Happy New Year! I wish you a very happy New Year!', 1);

  -- === Mediation ===
  insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
  values (v_cycle2_id, v_langues_id, v_type_sous_domaine, 'Mediation', 6)
  returning id into v_activite_id;

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_activite_id, v_type_sous_domaine, 'Cours preparatoire', 1)
    returning id into v_annee_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Identifier les reperes culturels', 1)
      returning id into v_theme_id;

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Mobiliser le champ lexical des besoins elementaires a l''aide de mots isoles, si necessaire accompagnes de gestes', 1)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors d''une seance d''EPS, un eleve explique pourquoi son camarade n''y participe pas : Charlie''s sick!', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Utiliser quelques expressions indiquant ce que l''on veut montrer a l''aide de gestes', 2)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'En se fondant sur une affiche ou le prospectus d''une association de protection des animaux, l''eleve utilise une expression simple pour designer les animaux de compagnie qui y figurent : Look! A dog. There is a cat. Here, a hamster!', 1);

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Animer un travail collectif, cooperer et contribuer a des echanges interculturels', 2)
      returning id into v_theme_id;

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Utiliser des consignes elementaires accompagnees de gestes', 1)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors d''une pause active, un eleve est meneur de jeu. A l''aide de mots et de gestes, il indique a l''un de ses camarades les actions qu''il doit realiser et les valide : Jump! Yes! Well done! Clap your hands! Good!', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Exprimer sa comprehension ou son accord par des expressions simples accompagnees de gestes', 2)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'L''eleve poursuit en disant : Turn around. Great! Touch your toes. Super!', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Utiliser des expressions simples accompagnees de gestes pour demander a des personnes si elles sont d''accord', 3)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors de la Journee europeenne des langues, les eleves sont invites a communiquer en langue etrangere pendant les recreations. Un eleve demande a son camarade s''il veut jouer a cache-cache avec lui : Let''s play Hide and Seek! Are you ok?', 1);

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_activite_id, v_type_sous_domaine, 'Cours elementaire premiere annee', 2)
    returning id into v_annee_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Identifier les reperes culturels', 1)
      returning id into v_theme_id;

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Reperer quelques differences ou similitudes dans des domaines familiers (fetes calendaires, nourriture, jeux, sports, etc.)', 1)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Dans le cadre d''une sequence d''EPS en dispositif EMILE, apres avoir joue au jeu de cour Duck, Duck, Goose (l''equivalent anglais du jeu du facteur), l''eleve repere les differences culturelles entre les deux versions et les exprime en francais.', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Informer ou prevenir d''une situation culturelle non comprise par un geste ou des formules elementaires ou toutes faites', 2)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors de la presentation d''un jeu typique d''un autre pays, l''eleve exprime a l''oral sa comprehension ou son incomprehension en s''appuyant sur une gestuelle codifiee. I agree (pouce et auriculaire leves). I don''t understand (deux doigts croises).', 1);

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Expliciter un message, une situation, un document pour autrui', 2)
      returning id into v_theme_id;

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Mobiliser le champ lexical des besoins elementaires a l''aide de mots isoles, accompagnes de gestes ou inseres dans des structures tres simples', 1)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Dans le cadre d''un jeu de roles, un eleve doit exprimer les besoins d''un camarade, qui correspondent a la carte imagee que celui-ci a piochee : Miss, Andrew''s sad. Miss, Stacy''s tired.', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Utiliser quelques expressions indiquant ce que l''on veut montrer a l''aide de gestes et utiliser quelques termes permettant de situer une information', 2)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors de la presentation devant la classe de photos d''animaux, un eleve pointe du doigt les elements qu''il decrit : Here is the baby horse. Here is the mother.', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Utiliser quelques verbes de perception', 3)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors de toutes les seances de langue, les eleves sont encourages a communiquer entre pairs dans la langue apprise, par exemple pour capter l''attention d''un camarade : Pablo, listen to me! Sue, look at my book!', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Joindre le geste a la parole pour identifier ou souligner une information', 4)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors des rituels de debut de seance, un eleve presente la meteo dans les grandes villes ou est parlee la langue apprise et les pointe du doigt sur une carte : Here in New Delhi, it''s sunny. There, in Jaipur, it''s 20 degrees.', 1);

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Animer un travail collectif, cooperer et contribuer a des echanges interculturels', 3)
      returning id into v_theme_id;

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Utiliser des consignes elementaires accompagnees de gestes', 1)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors de la realisation en petits groupes d''une cocotte en papier, un eleve donne les consignes de fabrication a ses camarades : Take the paper. Fold it here. Fold it again here.', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Exprimer sa comprehension ou son accord par des expressions simples accompagnees de gestes', 2)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors d''un jeu de plateau (Snakes and Ladders), l''eleve A demande aux joueurs B et C s''ils sont prets et ils repondent : Are you ready? Yes! I''m ready too!', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Utiliser des formules de politesse ou d''accueil elementaires', 3)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors de l''arrivee de l''assistant de langue a l''ecole, les eleves l''accueillent : Hello Wilson! Welcome to the school!', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Donner quelques consignes ou ordres simples ritualises', 4)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors d''un jeu de bataille, un eleve designe pour etre le meneur annonce le debut de la partie puis confirme au joueur qui avait la plus grande carte qu''il remporte le pli : Let''s play! Take the cards.', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Utiliser des expressions simples accompagnees de gestes et des formules pour manifester ou demander l''adhesion', 5)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors d''une pause active, l''eleve s''appuie sur une serie de cartes imagees illustrant des actions prealablement travaillees et donne a l''oral a son binome les instructions qui lui permettront de realiser l''enchainement, en validant ses actions : Jump into the hoop. Well done! Clap your hands three times. Good job!', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Dire ou demander si l''on a compris', 6)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors d''une interview par deux eleves de l''assistant de langue portant sur ses gouts et ses loisirs, un eleve pose des questions pendant qu''un autre coche les reponses : Do you like pears? Yes, very much. Excuse me, I don''t understand. Can you repeat, please?', 1);

    insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
    values (v_cycle2_id, v_activite_id, v_type_sous_domaine, 'Cours elementaire deuxieme annee', 3)
    returning id into v_annee_id;

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Identifier les reperes culturels', 1)
      returning id into v_theme_id;

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Reperer quelques differences ou similitudes dans des domaines familiers (fetes calendaires, nourriture, jeux, sports, etc.)', 1)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors de la presentation par l''assistant de langue du repas de Noel tel qu''il a cours dans son pays, l''eleve repere les differences avec son repas de fete traditionnel : Turkey, sprouts, mashed potatoes, pigs in blankets, Christmas pudding.', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Informer, prevenir d''une situation culturelle non comprise par un geste ou des formules elementaires ou toutes faites', 2)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'A l''occasion de Mardi Gras, les professeurs expliquent la tradition du Pancake race qui a lieu a Londres tous les ans ce jour-la. L''eleve l''interrompt pour lui indiquer qu''il n''a pas compris : Please, stop! I don''t understand ''Pancake race''. What is it?', 1);

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Expliciter un message, une situation, un document pour autrui', 2)
      returning id into v_theme_id;

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Mobiliser le champ lexical des besoins elementaires a l''aide de mots isoles, accompagnes de gestes ou inseres dans des structures tres simples', 1)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors de la Semaine des langues, les eleves apprennent a exprimer leurs besoins elementaires dans la langue maternelle d''un camarade de la classe, puis lors d''un jeu de role ou l''eleve A ne parle que cette langue : Tengo hambre. Miss, he''s hungry. Time for lunch!', 1);

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Utiliser quelques expressions et verbes de perception indiquant ce que l''on veut montrer a l''aide de gestes et utiliser quelques termes permettant de situer une information', 2)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Un eleve presente a ses camarades sur la photographie de classe un nouvel arrivant : Look! Here is Carol. There are also Kevin and Mary. This one here is Marvin.', 1);

      insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
      values (v_cycle2_id, v_annee_id, v_type_sous_domaine, 'Animer un travail collectif, cooperer et contribuer a des echanges interculturels', 3)
      returning id into v_theme_id;

        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_theme_id, v_type_objectif, 'Utiliser des formules d''accueil ou de salutation toutes simples', 1)
        returning id into v_objectif_id;
        insert into elements_programme (cycle_id, parent_id, type_element_id, libelle, ordre)
        values (v_cycle2_id, v_objectif_id, v_type_exemple, 'Lors de l''accueil d''un nouvel eleve, ses camarades lui disent : Hello Arthur! Welcome to our school, welcome to your new school!', 1);

end $$;