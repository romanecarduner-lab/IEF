create table if not exists types_trace (
  id      uuid primary key default gen_random_uuid(),
  code    text not null unique,  -- 'photo' | 'production' | 'document' | 'pdf'
                                   -- | 'citation' | 'observation_parentale' | 'audio'
  libelle text not null,
  ordre   smallint,
  actif   boolean not null default true
);

insert into types_trace (code, libelle, ordre) values
  ('photo',                 U&'Photographie',                  1),
  ('production',            U&'Production ou dessin',          2),
  ('document',               U&'Document',                      3),
  ('pdf',                    U&'PDF',                           4),
  ('citation',               U&'Citation de l''enfant',         5),
  ('observation_parentale',  U&'Observation parentale',         6),
  ('audio',                  U&'Audio (\00e0 venir)',           7)
on conflict (code) do nothing;

create table if not exists statuts_trace (
  id      uuid primary key default gen_random_uuid(),
  code    text not null unique,  -- 'prive' | 'selectionne' | 'archive'
  libelle text not null,
  ordre   smallint,
  actif   boolean not null default true
);

insert into statuts_trace (code, libelle, ordre) values
  ('prive',       U&'Priv\00e9',        1),
  ('selectionne', U&'S\00e9lectionn\00e9', 2),
  ('archive',     U&'Archiv\00e9',      3)
on conflict (code) do nothing;

alter table types_trace enable row level security;
alter table statuts_trace enable row level security;

create policy "Lecture types_trace pour utilisateurs authentifies"
  on types_trace for select
  to authenticated
  using (true);

create policy "Lecture statuts_trace pour utilisateurs authentifies"
  on statuts_trace for select
  to authenticated
  using (true);
