-- Vue reutilisable : associe chaque objectif a son domaine et son cycle,
-- pour permettre des requetes groupees sans repeter des appels RPC un par
-- un a chaque fois (utile notamment pour reperer les objectifs jamais
-- abordes, domaine par domaine).

create or replace view v_objectif_domaine
with (security_invoker = true)
as
select
  o.id as objectif_id,
  o.cycle_id,
  o.libelle,
  split_part(chemin_element_programme(o.id), ' > ', 1) as domaine
from elements_programme o
where o.type_element_id = (select id from types_element_programme where code = 'objectif');

grant select on v_objectif_domaine to authenticated;
