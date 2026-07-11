-- Lot 2 — Note de dépendance :
--
-- Le schéma corrigé (Corrections-Schema-et-Lot1.md, A6) impose que
-- parcours_scolaires porte un referentiel_id et un cycle_id NOT NULL.
-- Le lot 3 (import du programme officiel) n'est pas encore réalisé, mais
-- ces deux colonnes ne peuvent pas rester nulles : on crée donc ici la
-- structure minimale (referentiels_programmes, cycles), avec UNE ligne
-- provisoire, pour que les parcours scolaires soient créables dès ce lot.
--
-- Le lot 3 ajoutera elements_programme (domaines, compétences, attendus...)
-- et remplacera ce référentiel provisoire par la version officielle
-- validée séparément — sans jamais supprimer cette ligne provisoire tant
-- que des parcours y sont rattachés (ON DELETE RESTRICT plus bas).

create table if not exists referentiels_programmes (
  id                  uuid primary key default gen_random_uuid(),
  nom                 text not null,
  version             text not null,
  date_publication    date,
  date_entree_vigueur date not null,
  date_fin_validite   date,
  source_officielle   text,
  statut              text not null default 'actif', -- 'actif' | 'archive'
  created_at          timestamptz not null default now(),
  unique (nom, version)
);

comment on table referentiels_programmes is
  'Versions successives du programme officiel. Jamais supprimées : archivées via statut.';

create table if not exists cycles (
  id             uuid primary key default gen_random_uuid(),
  referentiel_id uuid not null references referentiels_programmes(id) on delete restrict,
  libelle        text not null,
  ordre          smallint,
  unique (referentiel_id, libelle)
);

-- Référentiel et cycle provisoires, en attendant la validation de la
-- source officielle (lot 3). Le libellé signale explicitement son
-- caractère temporaire pour éviter toute confusion dans l'interface.
insert into referentiels_programmes (nom, version, date_entree_vigueur, statut)
values (
  'Référentiel provisoire — en attente du programme officiel',
  'brouillon-0',
  current_date,
  'actif'
)
on conflict (nom, version) do nothing;

insert into cycles (referentiel_id, libelle, ordre)
select r.id, 'Cycle provisoire (à préciser)', 1
from referentiels_programmes r
where r.version = 'brouillon-0'
on conflict (referentiel_id, libelle) do nothing;

-- Référentiel technique commun : lecture ouverte à tout utilisateur
-- authentifié, aucune écriture depuis le client (réservée aux migrations /
-- à un futur rôle d'administration du programme).
alter table referentiels_programmes enable row level security;
alter table cycles enable row level security;

create policy "Lecture referentiels_programmes pour utilisateurs authentifies"
  on referentiels_programmes for select
  to authenticated
  using (true);

create policy "Lecture cycles pour utilisateurs authentifies"
  on cycles for select
  to authenticated
  using (true);
