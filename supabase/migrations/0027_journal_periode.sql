-- Nouveau type de dossier d'export : "journal d'une periode" (semaine,
-- mois, ou toute plage de dates choisie) -- distinct du dossier
-- pedagogique existant (organise par domaine/competences). Celui-ci
-- reste volontairement simple : chronologique, toutes les activites
-- de la periode par defaut, sans regroupement par domaine.

alter table dossiers_export
  add column if not exists type_dossier text not null default 'pedagogique',
  add column if not exists periode_debut date,
  add column if not exists periode_fin date;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'type_dossier_valide'
  ) then
    alter table dossiers_export
      add constraint type_dossier_valide check (type_dossier in ('pedagogique', 'journal_periode'));
  end if;
end $$;
