-- Refonte du contenu du dossier pedagogique : remplace la liste
-- competence par competence par une synthese groupee par sous-domaine
-- (melangeant les competences observees de ce sous-domaine, ecrite au
-- positif), accompagnee de 2 exemples d'activites illustratifs, chacun
-- avec sa propre synthese pedagogique et sa photo. La vue complete,
-- competence par competence, reste disponible sur Progression --
-- seul le contenu du document d'export change de forme.

create table if not exists dossiers_export_sous_domaines (
  id                  uuid primary key default gen_random_uuid(),
  dossier_id          uuid not null references dossiers_export(id) on delete cascade,
  domaine             text not null,
  sous_domaine        text not null,
  synthese            text,
  exemple1_activite_id uuid references activites(id) on delete set null,
  exemple1_synthese   text,
  exemple2_activite_id uuid references activites(id) on delete set null,
  exemple2_synthese   text,
  genere_le           timestamptz,
  modifie_par_parent  boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (dossier_id, sous_domaine)
);

create index if not exists idx_export_sous_domaines_dossier on dossiers_export_sous_domaines(dossier_id);

alter table dossiers_export_sous_domaines enable row level security;

drop policy if exists "Lecture sous-domaine si membre actif de la famille" on dossiers_export_sous_domaines;
create policy "Lecture sous-domaine si membre actif de la famille"
  on dossiers_export_sous_domaines for select
  to authenticated
  using (
    est_membre_actif_famille(
      (select e.famille_id from dossiers_export d
       join parcours_scolaires ps on ps.id = d.parcours_id
       join enfants e on e.id = ps.enfant_id
       where d.id = dossier_id)
    )
  );

drop policy if exists "Ecriture sous-domaine si membre actif de la famille" on dossiers_export_sous_domaines;
create policy "Ecriture sous-domaine si membre actif de la famille"
  on dossiers_export_sous_domaines for all
  to authenticated
  using (
    est_membre_actif_famille(
      (select e.famille_id from dossiers_export d
       join parcours_scolaires ps on ps.id = d.parcours_id
       join enfants e on e.id = ps.enfant_id
       where d.id = dossier_id)
    )
  )
  with check (
    est_membre_actif_famille(
      (select e.famille_id from dossiers_export d
       join parcours_scolaires ps on ps.id = d.parcours_id
       join enfants e on e.id = ps.enfant_id
       where d.id = dossier_id)
    )
  );
