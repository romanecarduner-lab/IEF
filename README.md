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

## Amélioration — suggestions de compétences à la création

Le formulaire "Ajouter une activité" propose désormais, sous le champ
Titre, une liste de compétences potentiellement pertinentes — calculée par
rapprochement de mots-clés (chaque mot significatif du titre comparé aux
libellés des objectifs), pas par une IA sémantique. Le parent coche
librement celles qui conviennent ; elles sont enregistrées avec l'activité
en un seul envoi, avec le même niveau d'autonomie que "Autonomie
générale". Rien n'est jamais ajouté automatiquement sans validation.

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

## Ce qui n'est volontairement pas inclus

Import réel du programme officiel, journal pédagogique, traces,
progression, exports, IA — prévus dans les lots suivants.
