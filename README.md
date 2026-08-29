# Suivi pédagogique IEF — Lot 1 (socle)

Socle d'authentification et d'isolation multi-famille. Rien au-delà de la
connexion et de la création automatique du premier espace familial n'est
implémenté dans ce lot (voir `Corrections-Schema-et-Lot1.md` pour le
périmètre exact et les lots suivants).

## Prérequis

- Node.js 20+
- Un compte [Supabase](https://supabase.com) (le plan gratuit suffit pour ce lot)
- Un compte [Vercel](https://vercel.com)
- La [CLI Supabase](https://supabase.com/docs/guides/cli) installée localement, pour les migrations et les tests pgTAP

## 1. Installation locale

```bash
npm install
cp .env.local.example .env.local
```

## 2. Configuration Supabase

1. Créer un nouveau projet sur [supabase.com](https://supabase.com).
2. Dans **Project Settings → API**, copier :
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Renseigner ces deux valeurs dans `.env.local`.
4. Dans **Authentication → URL Configuration**, ajouter comme *Redirect URLs* :
   - `http://localhost:3000/connexion` (développement)
   - `http://localhost:3000/reinitialisation`
   - les mêmes URLs avec le domaine Vercel une fois déployé.

## 3. Appliquer les migrations

En local, avec la CLI Supabase liée à votre projet (`supabase link`) :

```bash
supabase db push
```

Les migrations créent, dans l'ordre :

1. `roles_famille`, `statuts_appartenance_famille` (référentiels)
2. `familles`, `utilisateurs_familles` + policies RLS + fonction `est_membre_actif_famille`
3. `rpc_creer_espace_familial` (création atomique du premier espace)

## 4. Exécuter les tests d'isolation (pgTAP)

```bash
supabase test db
```

Le lot 1 n'est considéré terminé que si ces tests passent (voir
`supabase/tests/0001_isolation_familles.sql`). Ils vérifient notamment
qu'une famille ne peut jamais lire, modifier ou supprimer les données
d'une autre famille, et qu'un utilisateur anonyme n'accède à rien.

## 5. Lancer l'application en local

```bash
npm run dev
```

Puis ouvrir [http://localhost:3000](http://localhost:3000).

## 6. Déploiement Vercel

1. Connecter le dépôt GitHub dans le tableau de bord Vercel.
2. Dans **Settings → Environment Variables**, renseigner
   `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   (jamais `SUPABASE_SERVICE_ROLE_KEY`, non utilisée dans ce lot).
3. Déployer. Chaque push sur `main` redéploie automatiquement.

## Correctif critique — authentification bloquée indéfiniment

Un bug a été corrigé après un premier déploiement : les formulaires de
connexion, inscription, mot de passe oublié et réinitialisation
n'enveloppaient pas l'appel à Supabase dans un `try/catch/finally`. Si les
variables d'environnement étaient absentes sur Vercel, le client Supabase
levait une erreur synchrone jamais rattrapée : le bouton restait bloqué
sur "Un instant…" sans aucun message. Voir `src/lib/supabase/env.ts` et
`src/lib/delaiMaximal.ts` pour le correctif (validation explicite des
variables + délai maximal de 15 s + `try/catch/finally` systématique).

## Ce qui est inclus — Lot 1 (socle)

- Inscription (email + mot de passe), confirmation par mail
- Connexion / déconnexion
- Mot de passe oublié + réinitialisation
- Création automatique et transactionnelle du premier espace familial à la
  première connexion confirmée
- Isolation complète entre familles via RLS (`familles`, `utilisateurs_familles`)
- Tests pgTAP d'isolation, exécutés en CI (`.github/workflows/tests-rls.yml`)
- Pages protégées (redirection automatique si non connecté)

## Ce qui est inclus — Lot 2 (enfants, années scolaires, parcours)

- Page **Enfants** : création (prénom, date de naissance facultative,
  remarques) et suppression
- Page **Années scolaires** : création (libellé + dates) et suppression
- Page **Parcours scolaires** : relie un enfant à une année scolaire et à un
  cycle, avec niveau indicatif libre
- **Note de dépendance** : le schéma corrigé impose que chaque parcours
  porte un `referentiel_id`/`cycle_id` non nuls. Le programme officiel
  (lot 3) n'est pas encore importé : la migration `0004_referentiel_minimal.sql`
  crée donc un référentiel et un cycle **provisoires**, explicitement
  signalés comme tels dans l'interface, uniquement pour débloquer la
  création de parcours dès ce lot. Ce référentiel provisoire sera remplacé
  par la source officielle au lot 3, sans jamais être supprimé tant que des
  parcours y sont rattachés (`ON DELETE RESTRICT`).
- Trigger `verifier_coherence_parcours` : refuse un parcours si l'enfant et
  l'année scolaire n'appartiennent pas à la même famille, ou si le cycle
  choisi n'appartient pas au référentiel déclaré
- Tests pgTAP complémentaires (`0002_isolation_enfants_parcours.sql`) :
  isolation entre familles sur ces trois tables + les deux gardes-fous du
  trigger

## Ce qui est inclus — Lot 3 (structure du programme officiel)

- Nouvelles tables : `types_element_programme` (8 types possibles : domaine,
  sous-domaine, objectif, compétence, attendu, repère annuel, exemple de
  réussite, contenu d'enseignement) et `elements_programme` (arborescence
  générique, `parent_id` auto-référencé)
- Trigger `verifier_coherence_element_programme` : un élément enfant doit
  toujours appartenir au même cycle que son parent
- **Toujours aucun import réel du programme officiel** — la source doit
  être validée séparément avant d'y toucher. Cette migration ne crée que
  la structure, vide.
- Lecture ouverte à tout utilisateur authentifié, écriture réservée aux
  migrations (aucune interface pour l'instant : cette structure reste
  invisible au quotidien tant que le lot "Observations compétences" n'a
  pas été développé)
- Tests pgTAP (`0003_structure_programme.sql`) : RLS en lecture seule +
  garde-fou du trigger de cohérence de cycle

## Ce qui est inclus — Lot 4 (journal pédagogique)

- Nouvelles tables de vocabulaire : `contextes_activite` (12 valeurs),
  `niveaux_autonomie` (6 valeurs), `statuts_activite` (brouillon/validé)
- Table `activites` : titre, description, contexte, lieu, observations,
  paroles de l'enfant, personnes présentes (texte libre), autonomie
  générale (facultative, distincte de l'autonomie par compétence prévue
  au lot "Observations"), statut, favori
- Page **Journal** : liste des activités (toutes familles confondues côté
  UI, filtrées par RLS), bascule favori en un clic, suppression
- Page **Ajouter une activité** avec :
  - **Brouillon local (IndexedDB)** : sauvegarde automatique pendant la
    saisie, indépendante de Supabase ; restauration proposée si un
    brouillon non synchronisé est retrouvé au chargement de la page
  - Indicateur de synchronisation (brouillon non synchronisé / en cours /
    synchronisé)
  - La ligne `activites` n'est créée dans Supabase qu'à l'envoi réussi du
    formulaire, jamais avant (voir `src/lib/brouillonLocal.ts`)
- Tests pgTAP (`0004_isolation_activites.sql`) : isolation entre familles
  sur le journal

## Amélioration — photo directe à la création

Le formulaire "Ajouter une activité" propose maintenant un champ photo/
document facultatif. En un seul envoi : l'activité est créée, puis (si un
fichier a été choisi) il est compressé et envoyé comme première trace,
sans repasser par la fiche de l'activité. En cas d'échec de l'envoi du
fichier, l'activité reste enregistrée et l'utilisatrice est redirigée
vers sa fiche pour réessayer — jamais de perte de données déjà saisies.
Logique de téléversement partagée entre ce raccourci et le formulaire de
trace complet (`src/lib/televersementTrace.ts`).

## Ce qui est inclus — Lot 5 (traces)

- Nouvelles tables : `types_trace` (photo, production, document, PDF,
  citation, observation parentale, audio réservé), `statuts_trace`
  (privé/sélectionné/archivé), `traces`
- Bucket Storage privé `traces-pedagogiques` (créé par migration SQL),
  avec policies RLS sur `storage.objects` : chaque famille ne peut lire,
  déposer, remplacer ou supprimer des fichiers que sous son propre
  préfixe (`{famille_id}/...`), vérifié via la même fonction
  `est_membre_actif_famille` que le reste de l'application
- Page **détail d'une activité** (`/journal/[id]`) : informations de
  l'activité, liste des traces, formulaire d'ajout
- **Compression côté client** avant envoi (`src/lib/compressionImage.ts`) :
  redimensionnement + réorientation automatique (EXIF) + génération d'une
  miniature, pour les photos et productions
- Les documents (PDF, Word) sont envoyés sans compression
- Les citations et observations parentales n'ont pas de fichier, juste du
  texte
- Accès aux fichiers exclusivement via URL signée temporaire (1h), jamais
  d'URL publique permanente
- La suppression d'une trace retire d'abord le(s) fichier(s) du bucket,
  puis la ligne en base
- Tests pgTAP (`0005_isolation_traces.sql`) : isolation entre familles sur
  la table `traces` et sur `storage.objects`
- Les fichiers audio ne sont pas encore intégrés côté interface (prévu
  plus tard), les vidéos ne sont pas prévues en V1

## Amélioration — formulation pédagogique rédigée par l'IA

Une fois au moins une compétence sélectionnée (mots-clés ou IA), un bouton
"✨ Proposer une formulation pédagogique" sous le champ Observations
appelle Claude (modèle Sonnet 5, choisi pour la qualité de rédaction — le
coût reste minime vu la taille du prompt) pour rédiger un court paragraphe
reliant ce que le parent a décrit aux compétences retenues. Deux règles
imposées au modèle dans le prompt : ne jamais inventer un détail non
mentionné par le parent, et ne jamais recopier le texte du programme
officiel mot pour mot (reformulation entière exigée). Le parent choisit
"Utiliser ce texte" (remplace le contenu du champ Observations) ou
"Ignorer" — rien n'est jamais inséré automatiquement.

## Amélioration — suggestions IA (Claude)

En plus des suggestions par mots-clés (gratuites, automatiques), un bouton
"✨ Demander des suggestions à l'IA" appelle l'API Claude (modèle
claude-haiku-4-5, choisi pour son coût très faible) avec le titre et la
description de l'activité, ainsi que la liste complète des 424 objectifs
du programme. Claude renvoie les numéros des objectifs les plus
pertinents ; l'application les traduit en résultats affichés avec leur
emplacement dans le programme. Rien n'est coché automatiquement.

**Nécessite la variable d'environnement `ANTHROPIC_API_KEY`** (serveur
uniquement, jamais exposée au client) — voir les instructions de
configuration transmises séparément. **Chaque clic sur ce bouton a un
coût** (de l'ordre du centime avec Haiku), contrairement à la recherche
par mots-clés qui reste gratuite — c'est pourquoi ce n'est jamais
déclenché automatiquement pendant la saisie.

## Amélioration — suggestions de compétences à la création

Le formulaire "Ajouter une activité" propose désormais, sous le champ
Titre, une liste de compétences potentiellement pertinentes — calculée par
rapprochement de mots-clés (chaque mot significatif du titre comparé aux
libellés des objectifs), pas par une IA sémantique. Le parent coche
librement celles qui conviennent ; elles sont enregistrées avec l'activité
en un seul envoi, avec le même niveau d'autonomie que "Autonomie
générale". Rien n'est jamais ajouté automatiquement sans validation.

## Exemples de réussite officiels — le lien opérationnel demandé par l'inspecteur

Le programme officiel importé contient 1270 "exemples de réussite" concrets
par objectif (ex. pour "réaliser une construction" : des exemples précis de
ce qui compte comme preuve). Ils étaient en base depuis l'import du
programme mais jamais affichés. Un lien **"Voir les exemples officiels de
réussite"** apparaît maintenant sous chaque compétence, dans la recherche
et la navigation par domaine (page "Relier à des compétences") — le pont
concret entre "ce qui a été observé" et "pourquoi ça compte comme preuve
de la compétence", tel qu'attendu par l'Éducation Nationale.

## Tableau de bord — fidèle à la maquette complète

- **Salutation personnalisée** : "Bonjour [Prénom]," — nouveau champ
  Prénom à l'inscription, modifiable à tout moment depuis
  Confidentialité → **Mon profil** (pour les comptes déjà créés)
- **Icônes** : bibliothèque `lucide-react` ajoutée, utilisée pour les
  cartes de statistiques et un icône par domaine (langage, physique,
  artistique, mathématiques, temps/espace, vivant/matière — déduit du nom
  du domaine)
- **"Le parcours de [enfant]"** : liste de barres de progression simples
  (une par domaine, pourcentage d'objectifs validés sur le total), au
  lieu du graphique empilé — plus proche de la maquette, et plus léger
  (le Tableau de bord n'a plus besoin de charger `recharts`)
- **"Dernières traces"** : nouveau bloc à droite, 3 traces les plus
  récentes avec vignette, légende et date relative ("Aujourd'hui",
  "Hier", ou date), lien vers la vue Galerie du Journal
- **"Une observation à noter ?"** : carte avec le pot de plante,
  invitation à ajouter une activité

## Illustrations intégrées

Les trois images fournies sont dans `public/illustrations/` (redimensionnées
pour le web — passées de 1-1,7 Mo à 70-175 Ko chacune, sans perte visible) :
- `chemin-vegetal.png` — en haut à droite du Tableau de bord
- `pot-plante.png` — à côté du bouton "+ Ajouter une activité"
- `branche.png` — en fond discret des pages de connexion/inscription

## Nouvelle direction graphique — "Chemins d'apprentissage"

Palette, typographies et nom de l'application repris intégralement selon
la direction proposée :
- **Titres** : Fraunces (déjà en place, inchangé)
- **Corps et navigation** : Manrope (remplace Public Sans)
- **Palette** : vert forêt `#264C3B`, vert sauge `#9BAF9C`, crème
  `#F6F1E8`, terracotta `#C9785D`, ocre doux `#D9A441` (nouveau token),
  texte `#26312D` — appliquée aux mêmes noms de tokens Tailwind
  (`brume`, `lin`, `mousse`, `argile`, `encre`, `ardoise`, `trait`,
  `alerte`) pour que tout l'existant en hérite automatiquement, plus aux
  couleurs codées en dur du graphique de progression et du PDF de
  dossier (react-pdf et recharts ne peuvent pas lire les classes
  Tailwind directement)
- **Nom** : "Chemins d'apprentissage" affiché dans l'en-tête à côté du
  nom de la famille
- **Tableau de bord** rapproché de la maquette proposée : salutation,
  bouton d'ajout mis en avant, cartes avec icônes, bloc "Le parcours de
  [enfant]" avec badge d'année

**Non repris dans cette passe** : les illustrations dessinées (chemin,
feuillage, pot de plante) de la maquette — ce sont des visuels sur mesure
qui demanderaient un vrai travail d'illustration, pas une simple
recoloration. Dis-moi si tu veux qu'on s'y attelle séparément.

## Ce qui est inclus — Lot 6 (relier activités aux compétences)

- Nouvelles tables : `observations_elements_programme` (lien activité ↔
  élément du programme, avec niveau d'autonomie, justification,
  commentaire pédagogique) et `traces_elements_programme` (lien trace ↔
  élément du programme — table créée, interface non construite pour ce
  lot)
- Fonction `lister_objectifs_sous_element` : parcourt récursivement
  l'arborescence pour lister tous les objectifs sous une tranche d'âge,
  qu'il y ait ou non un niveau de sous-compétence intermédiaire
- Page **Compétences observées** (`/journal/[id]/competences`), accessible
  depuis la fiche d'activité : sélecteur en cascade
  Domaine → Sous-domaine → Compétence → Tranche d'âge, puis case à cocher
  par objectif, niveau d'autonomie partagé, justification et commentaire
  facultatifs. Plusieurs objectifs peuvent être enregistrés en un seul
  envoi.
- Les objectifs déjà observés pour l'activité sont annotés dans le
  sélecteur, et listés avec possibilité de suppression
- Tests pgTAP (`0006_isolation_observations.sql`) : isolation entre
  familles

## Correctif — suggestion de statut au lieu de repartir de zéro

La page Progression proposait systématiquement "Non encore observé" par
défaut, même quand un niveau d'autonomie avait déjà été renseigné lors de
l'observation — obligeant à reconsidérer depuis rien. Elle propose
maintenant une **suggestion pré-remplie**, dérivée du meilleur niveau
d'autonomie déjà indiqué (ex. "autonome" → suggestion "Réalisé de manière
autonome"), signalée par un badge "suggestion à confirmer". Le principe
reste respecté : rien n'est enregistré tant que le bouton **Confirmer**
n'a pas été cliqué — c'est juste beaucoup plus rapide quand la suggestion
convient déjà.

## Amélioration — vue visuelle de la couverture du programme

En haut de la page **Progression**, un graphique en barres empilées
(bibliothèque `recharts`) montre, pour chaque domaine du programme
officiel, la proportion d'objectifs déjà validés à chaque niveau (de
"première observation" à "mobilisé dans plusieurs contextes"), le reste
étant affiché comme "pas encore abordé". Basé sur deux nouvelles vues
(`v_total_objectifs_par_domaine`, `v_progression_par_domaine`), calculées
à la demande comme le reste des indicateurs de progression.

## Ce qui est inclus — Lot 7 (synthèse de progression)

- Nouvelle table `statuts_progression` (7 valeurs officielles : non encore
  observé → mobilisé dans plusieurs contextes)
- Nouvelles tables `syntheses_progression` (statut global par compétence
  et par parcours) et `historique_progression` (trace de chaque
  changement de statut, jamais modifiée ni supprimée)
- Vue `v_indicateurs_observation` : nombre d'observations, de dates
  distinctes et de contextes distincts par compétence, **calculée à la
  demande** (jamais stockée), avec `security_invoker = true` pour que la
  RLS de l'utilisateur s'applique correctement à la vue
- Page **Progression** : liste des compétences déjà observées pour un
  parcours (enfant + année), avec leurs indicateurs, un badge "à
  réexaminer" (indicatif, calculé, jamais automatique) au-delà de 3
  observations sur au moins 2 dates et 2 contextes différents, et un
  sélecteur pour valider manuellement le statut global — **jamais changé
  automatiquement par l'application**
- Tests pgTAP (`0007_isolation_progression.sql`) : isolation entre
  familles sur les synthèses et sur la vue

## Amélioration — synthèse écrite complète par domaine (pas seulement les exemples)

Chaque section domaine du PDF affiche maintenant, avant les exemples
d'activités, un vrai paragraphe de synthèse calculé sur **l'ensemble**
des compétences validées de ce domaine (table `syntheses_progression`,
toutes les activités confondues) — pas seulement celles illustrées par
les exemples retenus. Il indique le nombre d'objectifs validés sur le
total du domaine, puis liste les compétences par niveau atteint
("Autonome (4) : ...", "Mobilisé spontanément (2) : ..."). Un domaine
apparaît désormais dans le PDF dès qu'il a des compétences validées,
même si aucun exemple n'a encore été choisi pour l'illustrer. Aucune IA :
uniquement des données agrégées mises en phrase.

## Description générée par IA à partir de la photo (vision)

Sur "Ajouter une activité", le champ Photo est déplacé juste après le
Titre (avant Description), et un bouton **"✨ Décrire cette activité avec
l'IA"** analyse la photo (si présente) et le titre pour rédiger une
description factuelle et précise, directement dans le champ Description
— plus riche qu'une description tapée à la volée. Utilise la vision de
Claude (modèle Sonnet) : la miniature déjà compressée (400px) est envoyée
à l'IA, pas l'image complète, pour rester rapide et économique. Étape
volontairement séparée de l'analyse des compétences (qui vient après, sur
la description enrichie).

## Vue "À travailler" — repérer ce qui n'a pas encore été abordé

Depuis **Progression**, un lien **"Voir ce qui n'a pas encore été
abordé"** ouvre une nouvelle page listant, domaine par domaine, tous les
objectifs du programme officiel qui n'ont encore fait l'objet d'aucune
observation pour ce parcours — pour permettre au parent de repérer un
domaine resté de côté et d'y être attentif. S'appuie sur une nouvelle vue
`v_objectif_domaine` (associe chaque objectif à son domaine et son cycle,
calculé une fois plutôt que via des appels RPC répétés). Aucune IA — une
liste factuelle, avec un avertissement clair que "non abordé" ne veut pas
forcément dire "à rattraper d'urgence" (l'âge de l'enfant compte).
Les idées d'activités pour combler ces manques (proposées par IA) sont
notées comme piste future, pas construites pour l'instant.

## Corrections — synthèses IA coupées, recherche par mots-clés trop stricte

- **Synthèses coupées en plein milieu** : la limite de tokens allouée aux
  réponses IA était trop juste dans certains cas. Augmentée sur les trois
  générations (synthèse par compétence, description par photo,
  formulation pédagogique), et une détection automatique de troncature
  (`stop_reason`) relance une fois avec une marge doublée si jamais ça se
  reproduit malgré tout — sans jamais renvoyer un texte inachevé.
- **Recherche par mots-clés trop littérale** ("saisons" ne retrouvait pas
  "saison" dans le programme) : les fonctions `suggerer_objectifs_programme`
  et `rechercher_objectifs_programme` comparent maintenant la racine d'un
  mot (ses 5 premières lettres) plutôt que le mot entier — absorbe la
  plupart des pluriels et conjugaisons simples. Reste un rapprochement
  approximatif par construction (pas une IA sémantique), le parent valide
  toujours en cochant.

## Résolution — le badge "suggestion à confirmer" qui ne disparaissait jamais

Cause identifiée après un diagnostic approfondi (voir historique) : la
page Progression demandait à Supabase de faire automatiquement la
jointure entre `syntheses_progression` et `statuts_progression` en une
seule requête imbriquée (`statuts_progression(code)`), une fonctionnalité
pratique mais qui dépend du cache de relations de PostgREST — le même
type de cache qui avait déjà posé problème deux fois pour des colonnes
manquantes. Corrigé en récupérant les deux listes séparément et en
faisant la correspondance manuellement côté code, ce qui élimine cette
dépendance fragile. Les données en base étaient toujours correctes tout
du long — seule la lecture affichée était en cause.

## Chantier "progression automatique" — Étape 1/9 : structure et traçabilité

Première étape du plan validé (structure de données uniquement, aucun
moteur ni écran nouveau à ce stade) :
- `syntheses_progression` : nouvelles colonnes `origine` (manuel/
  automatique), `niveau_confiance` (provisoire/confirmé — utilisé à
  partir de l'étape 3), `statut_propose_id` / `justification_proposition`
  / `propose_le` (une proposition automatique en attente, jamais
  appliquée seule), `derniere_prise_en_compte_le`,
  `proposition_ignoree_le` / `proposition_ignoree_jusqua_observation_le`
  (empêche qu'une proposition ignorée ne réapparaisse sans donnée
  nouvelle)
- `historique_progression` : colonne `origine` ajoutée (toutes les
  entrées passées sont `manuel`, exact historiquement)
- Nouvelle table `syntheses_progression_sources` : **instantané** (pas
  une simple référence) des observations ayant motivé un changement de
  statut précis, rattaché à l'entrée d'historique concernée. Les colonnes
  `snapshot_*` survivent à la suppression de l'observation ou de
  l'activité source (`on delete set null`, jamais de cascade) — la
  justification ne disparaît jamais
- `validerStatutProgression` (flux manuel existant, comportement
  inchangé pour le parent) alimente maintenant cette traçabilité à chaque
  validation : marque `origine: 'manuel'`, efface toute proposition
  automatique en attente (une décision manuelle la rend sans objet), et
  enregistre l'instantané des observations actuelles

**À venir (étapes suivantes, non commencées)** : affichage de
l'historique (étape 2), moteur déterministe d'estimation (étape 3),
gestion des propositions/corrections (étape 4), intervention de l'IA
seulement dans les cas ambigus (étape 5), déclenchement automatique après
création/modification/suppression d'une observation (étape 6), cohérence
synthèses ↔ activités-exemples (étape 7), écran de relecture à l'export
(étape 8), export Word (étape 9).

## Ajustements d'usage

- **Parcours pré-rempli** : s'il n'existe qu'un seul parcours (un enfant,
  une année), il est sélectionné automatiquement à la création d'une
  activité — plus besoin de le choisir à chaque fois.
- **Formulation pédagogique directe** : le texte généré s'écrit
  maintenant directement dans "Observations", modifiable sur place — plus
  de bouton "Utiliser ce texte" intermédiaire.
- **IA disponible aussi en modification** : le formulaire de modification
  d'une activité propose désormais "✨ Proposer une formulation
  pédagogique", à partir des compétences déjà reliées — utilisable même
  après avoir validé la fiche.
- **"Autonomie générale" retirée** des formulaires de création et de
  modification : redondante avec le niveau d'autonomie déjà demandé par
  compétence. La colonne reste en base (inutilisée, sans risque) plutôt
  que de migrer le schéma pour un simple nettoyage d'interface.
- **"Statut" retiré du formulaire de création** : une activité démarre
  toujours en "brouillon" ; on la passe en "rédaction terminée" via le
  badge cliquable (déjà existant), après coup — plus logique qu'un choix
  à la création.

## Modification d'une activité a posteriori

Un lien **"Modifier"** apparaît maintenant à côté du titre sur la fiche
d'une activité, menant vers `/journal/[id]/modifier` : un formulaire
préempli (date, contexte, titre, description, lieu, observations,
paroles de l'enfant, personnes présentes, autonomie générale) qui met à
jour l'activité existante. Le parcours (enfant/année), les traces, les
compétences reliées et le statut brouillon/validé restent modifiables
séparément comme avant (ce ne sont pas des champs de ce formulaire).

## IA fusionnée : photo + attendus en une seule étape, multi-photo

Suite à un retour terrain (description trop détaillée, apparence physique
de l'enfant décrite à tort, prénom non utilisé, deux boutons IA
redondants) :
- **Un seul bouton IA** désormais : "✨ Décrire l'activité et identifier
  les compétences" — regarde la photo (vision) et le titre, considère en
  même temps les attendus du programme officiel, et produit en un seul
  appel un texte COURT (2-3 phrases, à la première personne du parent) et
  la liste des compétences concernées, pré-cochées.
- **Règles imposées au modèle** : toujours utiliser le prénom réel de
  l'enfant (récupéré depuis la base, jamais "l'enfant"), ne **jamais**
  décrire l'apparence physique (cheveux, vêtements, traits) — seulement
  l'action et l'apprentissage.
- **Plusieurs photos en une fois** : le champ photo accepte maintenant
  plusieurs fichiers (`multiple`), chacun devient sa propre trace ; toutes
  les images sélectionnées sont envoyées à l'IA en une seule analyse.
- `genererDescriptionDepuisPhoto` et `suggererObjectifsIA` (les deux
  anciennes fonctions séparées) sont supprimées, remplacées par
  `genererDescriptionEtCompetencesIA`.

## Synthèse pédagogique IA par compétence — répond à l'exigence de l'inspecteur

Sur la page **Progression**, chaque compétence propose maintenant
**"✨ Générer une synthèse pédagogique IA"**. Contrairement aux
suggestions/formulations précédentes (basées sur une seule activité),
celle-ci s'appuie sur **toutes les observations enregistrées pour cette
compétence sur l'année** (justifications, commentaires, niveaux
d'autonomie, contextes, dates) pour produire une vraie analyse — la
compréhension et l'évolution de l'enfant, pas un simple constat. Modèle
Sonnet, prompt explicite pour n'inventer aucun fait absent des
observations fournies. Régénérable à volonté au fur et à mesure que de
nouvelles observations s'ajoutent.

Ces synthèses apparaissent aussi **dans le PDF du dossier de contrôle** :
chaque compétence qui a une synthèse IA générée l'affiche en toutes
lettres dans la section de son domaine, à la place de la simple mention
de son nom.

**Nécessite `ANTHROPIC_API_KEY`** (déjà configurée si les fonctionnalités
IA précédentes sont actives).

## Écran "Préparer mon contrôle" (sans IA)

Sur la page **Export**, un bouton **"✨ Préparer mon contrôle"** ouvre un
petit formulaire (enfant/année + nombre d'exemples par domaine) et, en un
clic, enchaîne : création du dossier, remplissage automatique (favoris
puis récents, par domaine — `remplirBilanAutomatique`), redirection vers
l'éditeur déjà prêt à être ajusté puis finalisé.

Sur l'éditeur du dossier (brouillon ou finalisé), un bloc **"Points clés
pour en parler à l'oral"** résume, à partir des statuts de progression
déjà validés sur l'ensemble du parcours (pas seulement les éléments
retenus dans ce dossier précis) : nombre total d'activités et de traces,
nombre de domaines abordés sur 6, et pour chaque domaine le nombre
d'objectifs validés sur le total ainsi que le niveau le plus avancé
atteint. Aucune IA — uniquement des données déjà en base, mises en
phrase.

## Amélioration — remplissage automatique pour un bilan de contrôle (sans IA)

Sur un dossier en brouillon, un nouveau bouton "Remplir automatiquement"
sélectionne, pour chaque domaine déjà abordé par le parcours, un nombre
limité d'exemples (réglable, 3 par défaut) : les activités marquées
favorites en priorité, puis les plus récentes. Objectif : un bilan
complet (tous les domaines représentés) mais volontairement court (pas
toutes les activités), sans dépendre d'une IA. Le parent garde la main
pour ajuster ensuite la sélection avant de finaliser.

## Nouveauté — "Préparer mon contrôle" en un clic

Un bouton **"✨ Préparer mon contrôle"** en haut de la page Export
enchaîne en une seule action : création d'un dossier titré
automatiquement, puis remplissage automatique (favoris puis récents, par
domaine — voir le remplissage automatique du lot précédent), avant de
rediriger vers l'éditeur du dossier pour vérification. Aucune
finalisation automatique : le parent garde la main pour ajuster et
valider avant de générer le PDF final.

Sur la fiche de chaque dossier (brouillon ou finalisé) apparaît aussi un
nouvel encart **"Points clés pour en parler à l'oral"** : nombre
d'activités/traces, nombre de domaines abordés sur 6, et pour chaque
domaine le nombre d'objectifs validés sur le total ainsi que le niveau le
plus avancé atteint. Calculé sur l'ensemble du parcours (pas seulement le
contenu du dossier), à partir des données déjà en base — aucune IA.

## Complément — filtre par domaine sur le Portfolio

Le filtre "Domaine" prévu depuis le premier document du projet est
maintenant en place sur `/portfolio` (en plus d'enfant, année, type). Il
s'appuie sur les compétences déjà reliées aux activités (lot 6) : une
trace apparaît sous un domaine si son activité a au moins une observation
liée à ce domaine. `traces_elements_programme` (lien direct trace ↔
compétence, plus fin que via l'activité) reste en base, inutilisée —
laissée telle quelle plutôt que de construire un écran dédié sans besoin
exprimé, activable plus tard si nécessaire.

## Nettoyage — vocabulaire clarifié, deux chemins vers les compétences unifiés (audit)

- Le statut d'activité "Brouillon/Validé" est renommé **"En cours de
  rédaction / Rédaction terminée"** partout (données + formulaire), pour
  ne plus entrer en collision avec le "Validé" utilisé sur la page
  Progression (deux notions différentes : la fiche est-elle remplie ? vs
  la compétence est-elle acquise ?). Une légende rappelle maintenant
  explicitement cette distinction sous le champ.
- Le formulaire de création d'activité demande maintenant explicitement
  un **niveau d'autonomie pour les compétences sélectionnées**
  (mots-clés et/ou IA confondus), au lieu de réutiliser silencieusement
  la valeur du champ "Autonomie générale". Les deux chemins vers les
  compétences (création rapide et page "Relier à des compétences")
  demandent désormais tous les deux ce niveau de façon visible.
- Les 5 signaux de statut (niveau d'autonomie par compétence, autonomie
  générale de l'activité, statut de la fiche, statut de progression,
  favori) restent **distincts par conception** — ils répondent à des
  questions réellement différentes — mais le vocabulaire ne se recouvre
  plus.

## Nettoyage — fusion des pages redondantes (audit)

- **Enfants + Années scolaires + Parcours** fusionnés en une seule page
  **`/famille`** (trois sections empilées, chacune avec sa liste et son
  formulaire d'ajout — rien n'a changé dans le fonctionnement, juste
  l'endroit). Les anciennes routes `/enfants`, `/annees-scolaires`,
  `/parcours` n'existent plus.
- **Recherche fusionnée dans Journal** : la barre de mot-clé/enfant/dates
  est maintenant en haut de `/journal` directement, au lieu d'une page à
  part. La route `/recherche` n'existe plus.
- Navigation revenue à une liste plate (plus besoin de menus déroulants
  pour seulement 6 destinations) : **Tableau de bord · Famille · Journal
  · Portfolio · Progression · Export**, plus le menu **Compte**.

## Restructuration complète de la navigation (5 destinations)

Nouvelle organisation, pensée pour "qu'est-ce que je fais maintenant"
plutôt que "dans quel onglet est cette fonctionnalité" :

- **Tableau de bord** devient un vrai centre de commande : gros bouton
  "+ Ajouter une activité" tout en haut (l'action la plus fréquente,
  immédiate), compteurs, mini-graphique "Où en est [enfant]" (réutilise
  le graphique de Progression), bloc "✨ Préparer un contrôle", activité
  récente.
- **Portfolio fusionné dans Journal** : bascule interne "Liste / Galerie"
  au lieu de deux onglets séparés — mêmes activités, deux présentations.
- **"À travailler" fusionné dans Progression** : deux onglets internes
  "Ce qui progresse" / "Ce qui reste à voir".
- **Export unifié** : un seul point d'entrée ("Nouveau dossier"), avec
  une case à cocher "Remplir automatiquement" (cochée par défaut) au lieu
  de deux boutons séparés ("Nouveau dossier" et "Préparer mon contrôle").

Navigation : **Tableau de bord · Famille · Journal · Progression ·
Export** (5 destinations, contre 10 après le premier audit et jusqu'à 6
juste avant cette passe).

## Nettoyage — navigation réorganisée (audit)

Les 10 liens à plat ("Tableau de bord, Enfants, Années scolaires,
Parcours, Journal, Recherche, Portfolio, Progression, Export,
Confidentialité") sont devenus 4 entrées : **Tableau de bord** (seul,
toujours visible), puis trois menus déroulants — **Famille** (Enfants,
Années scolaires, Parcours), **Suivi** (Journal, Recherche, Portfolio),
**Bilan** (Progression, Export) — et un menu **Compte** (Confidentialité,
Se déconnecter) à la place du bouton de déconnexion isolé. Nouveau
composant réutilisable `src/components/MenuDeroulant.tsx` (se ferme au
clic extérieur ou dès qu'on change de page). Aucune route n'a changé —
uniquement la façon d'y accéder.

## Refonte — un vrai dossier pédagogique, pas un listing

Le PDF généré à la finalisation d'un dossier d'export a été entièrement
repensé :
- **Page de garde** : titre, enfant, année, cycle, compteurs (activités,
  traces, domaines abordés), date de génération
- **Page de synthèse de progression** : un graphique en barres par
  domaine (mêmes couleurs que la page Progression), dessiné directement
  en PDF (pas une image de graphique, du vrai contenu vectoriel)
- **Une section par domaine du programme officiel** plutôt qu'une liste
  chronologique : chaque activité apparaît sous le ou les domaines
  auxquels ses compétences reliées appartiennent, avec ces compétences et
  leur niveau d'autonomie affichés juste en dessous du texte
- **Photos intégrées directement sous leur activité** (grille 2 colonnes),
  au lieu d'une section "Traces" séparée
- Les activités non reliées à des compétences apparaissent dans une
  dernière section "Autres activités", pour ne rien perdre silencieusement
- Pagination en pied de page

## Ce qui est inclus — Lot 10 (export du dossier annuel)

- Nouvelles tables `dossiers_export` et `dossiers_export_elements`
  (sélection d'activités/traces, texte de synthèse modifiable, snapshot
  figé à la finalisation)
- Page **Export** : liste des dossiers par parcours, création, suppression
  (retire aussi le PDF du bucket avant la ligne)
- Éditeur de dossier (`/export/[id]`) : coche les activités et traces à
  inclure, modifie le texte affiché pour chaque activité, tant que le
  dossier est en **brouillon**
- **Finalisation** : génère un PDF réel (bibliothèque `@react-pdf/renderer`,
  génération côté serveur sans navigateur headless — cohérent avec le
  choix "Route Handler / Server Action Next.js" acté précédemment),
  photos intégrées directement dans le PDF, copie un instantané figé des
  données dans `dossiers_export_elements` — **les deux mécanismes
  combinés**, comme convenu. Un dossier finalisé n'est plus jamais
  recalculé à partir des sources.
- Le PDF est stocké dans le même bucket privé que les traces
  (`traces-pedagogiques`), sous `{famille_id}/dossiers/{dossier_id}.pdf`,
  accessible via URL signée temporaire
- Tests pgTAP (`0008_isolation_dossiers_export.sql`) : isolation entre
  familles

## Ce qui est inclus — Lot 11 (droits des familles)

- Nouvelle table `journal_audit` (indépendante, sans cascade — survit à la
  suppression d'une famille), alimentée uniquement via la fonction
  `rpc_journal_auditer` (SECURITY DEFINER, aucune lecture directe possible
  depuis le client)
- Page **Confidentialité** :
  - **Exporter mes données** : toutes les tables de la famille (enfants,
    parcours, journal, traces, compétences, progression, dossiers) en un
    fichier JSON téléchargé directement
  - **Exporter mes fichiers** : toutes les photos/documents/PDF de
    dossiers, réunis dans une archive ZIP
  - **Suppression complète et irréversible** de l'espace familial :
    purge réelle des fichiers Storage, journalisation avant suppression,
    cascade SQL, **et suppression du compte d'authentification** —
    confirmation obligatoire en retapant le nom exact de l'espace
- La suppression d'un enfant purge maintenant réellement ses fichiers
  associés (photos/documents des activités liées à ses parcours), pas
  seulement les lignes en base
- **Nouvelle variable d'environnement `SUPABASE_SERVICE_ROLE_KEY`** :
  seule et unique exception à la règle "jamais de service_role" suivie
  partout ailleurs — nécessaire car Supabase n'offre aucun autre moyen de
  supprimer un compte d'authentification. Utilisée dans un seul fichier
  (`src/lib/supabase/admin.ts`), pour un seul appel
  (`auth.admin.deleteUser`), jamais exposée au client.
- Tests pgTAP (`0008_isolation_dossiers_export.sql` déjà couvrait les
  dossiers ; le journal d'audit n'a pas de policy de lecture testable
  côté client par conception)

## Ce qui est inclus — Lot 8 (tableau de bord et recherche)

- **Tableau de bord** réel (remplace le squelette du lot 1) : nombre
  d'enfants, d'activités, de traces et de dossiers finalisés ; répartition
  par enfant/année avec nombre d'activités ; les 5 activités les plus
  récentes de toute la famille, cliquables
- Page **Recherche** : mot-clé (titre, description, observations, paroles
  de l'enfant), filtrable par enfant et par plage de dates ; jusqu'à 50
  résultats, chacun cliquable vers sa fiche

## Ce qui est inclus — Lot 9 (portfolio)

- Page **Portfolio** : galerie de toutes les traces (photos, productions,
  documents, citations), filtrable par enfant, année scolaire et type,
  jusqu'à 100 résultats les plus récents
- Les photos/productions s'affichent en vignette (URL signée) ; les
  citations et observations affichent un extrait du texte ; les documents
  affichent une icône — chaque carte renvoie vers la fiche de l'activité
  d'origine
- **Non inclus dans cette première version** : filtre par domaine du
  programme (nécessiterait de relier chaque trace aux compétences via
  `traces_elements_programme`, dont l'interface n'existe pas encore — la
  table existe depuis le lot 5)

## Ce qui n'est volontairement pas inclus

Import réel du programme officiel, journal pédagogique, traces,
progression, exports, IA — prévus dans les lots suivants.
