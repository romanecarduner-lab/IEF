create table if not exists statuts_progression (
  id      uuid primary key default gen_random_uuid(),
  code    text not null unique,
  libelle text not null,
  ordre   smallint,
  actif   boolean not null default true
);

insert into statuts_progression (code, libelle, ordre) values
  ('non_encore_observe',        U&'Non encore observ\00e9',                 1),
  ('premiere_observation',      U&'Premi\00e8re observation',               2),
  ('en_cours_exploration',      U&'En cours d''exploration',                3),
  ('realise_avec_accompagnement', U&'R\00e9alis\00e9 avec accompagnement',  4),
  ('realise_autonome',          U&'R\00e9alis\00e9 de mani\00e8re autonome', 5),
  ('mobilise_spontanement',     U&'Mobilis\00e9 spontan\00e9ment',          6),
  ('mobilise_plusieurs_contextes', U&'Mobilis\00e9 dans plusieurs contextes', 7)
on conflict (code) do nothing;

alter table statuts_progression enable row level security;

drop policy if exists "Lecture statuts_progression pour utilisateurs authentifies" on statuts_progression;
create policy "Lecture statuts_progression pour utilisateurs authentifies"
  on statuts_progression for select
  to authenticated
  using (true);
