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

## Ce qui n'est volontairement pas inclus

Import réel du programme officiel, journal pédagogique, traces,
progression, exports, IA — prévus dans les lots suivants.
