create table if not exists parcours_scolaires (
  id                 uuid primary key default gen_random_uuid(),
  enfant_id          uuid not null references enfants(id) on delete cascade,
  annee_scolaire_id  uuid not null references annees_scolaires(id) on delete cascade,
  referentiel_id     uuid not null references referentiels_programmes(id) on delete restrict,
  cycle_id           uuid not null references cycles(id) on delete restrict,
  niveau_indicatif   text,
  remarques          text,
  created_at         timestamptz not null default now(),
  unique (enfant_id, annee_scolaire_id)
);

create index if not exists idx_parcours_enfant on parcours_scolaires(enfant_id);
create index if not exists idx_parcours_annee on parcours_scolaires(annee_scolaire_id);

-- ---------------------------------------------------------------------------
-- Trigger de cohérence : empêche un parcours incohérent, quelle que soit
-- l'origine de l'écriture (application, RLS contournée par erreur, script...).
-- ---------------------------------------------------------------------------
create or replace function verifier_coherence_parcours()
returns trigger
language plpgsql
as $$
declare
  v_famille_enfant   uuid;
  v_famille_annee    uuid;
  v_cycle_referentiel uuid;
begin
  select famille_id into v_famille_enfant from enfants where id = new.enfant_id;
  select famille_id into v_famille_annee from annees_scolaires where id = new.annee_scolaire_id;

  if v_famille_enfant is null then
    raise exception 'Enfant introuvable.';
  end if;

  if v_famille_enfant is distinct from v_famille_annee then
    raise exception 'L''enfant et l''année scolaire n''appartiennent pas à la même famille.';
  end if;

  select referentiel_id into v_cycle_referentiel from cycles where id = new.cycle_id;

  if v_cycle_referentiel is distinct from new.referentiel_id then
    raise exception 'Le cycle sélectionné n''appartient pas au référentiel indiqué.';
  end if;

  return new;
end;
$$;

create trigger trg_coherence_parcours
before insert or update on parcours_scolaires
for each row execute function verifier_coherence_parcours();

-- ---------------------------------------------------------------------------
-- RLS — parcours_scolaires n'a pas de famille_id direct : l'appartenance
-- passe par l'enfant. Pas de récursion ici (enfants n'est pas la table
-- en cours de vérification), une simple sous-requête suffit.
-- ---------------------------------------------------------------------------
alter table parcours_scolaires enable row level security;

create policy "Lecture parcours si membre actif de la famille de l'enfant"
  on parcours_scolaires for select
  to authenticated
  using (
    est_membre_actif_famille(
      (select famille_id from enfants where enfants.id = parcours_scolaires.enfant_id)
    )
  );

create policy "Creation parcours si membre actif de la famille de l'enfant"
  on parcours_scolaires for insert
  to authenticated
  with check (
    est_membre_actif_famille(
      (select famille_id from enfants where enfants.id = parcours_scolaires.enfant_id)
    )
  );

create policy "Modification parcours si membre actif de la famille de l'enfant"
  on parcours_scolaires for update
  to authenticated
  using (
    est_membre_actif_famille(
      (select famille_id from enfants where enfants.id = parcours_scolaires.enfant_id)
    )
  )
  with check (
    est_membre_actif_famille(
      (select famille_id from enfants where enfants.id = parcours_scolaires.enfant_id)
    )
  );

create policy "Suppression parcours si membre actif de la famille de l'enfant"
  on parcours_scolaires for delete
  to authenticated
  using (
    est_membre_actif_famille(
      (select famille_id from enfants where enfants.id = parcours_scolaires.enfant_id)
    )
  );
