-- Piste si une famille a deja vu l'ecran de bienvenue (une fois par
-- famille, pas par utilisateur -- plus simple et suffisant pour des
-- familles generalement gerees par un seul parent principal).

alter table familles
  add column if not exists onboarding_termine boolean not null default false;
