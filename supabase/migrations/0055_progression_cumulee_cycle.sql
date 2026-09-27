-- La progression affichee (pourcentages, detail par competence, "Idees
-- pour continuer") doit etre cumulative sur toutes les annees scolaires
-- d'un meme cycle pour un meme enfant, pas remise a zero a chaque
-- rentree. syntheses_progression reste rattachee a un parcours precis
-- (l'annee ou la validation a ete faite -- historique legitime), mais
-- deux nouvelles vues exposent, pour chaque (enfant, cycle,
-- competence), le statut le PLUS AVANCE valide sur n'importe quelle
-- annee de ce cycle : rien n'est deplace ni duplique en base, seule la
-- lecture change.
--
-- Les actions d'ecriture (valider un statut, generer une synthese IA)
-- continuent d'enregistrer sous le parcours reellement selectionne :
-- c'est la lecture cumulative qui va automatiquement en tenir compte
-- ensuite, pas l'ecriture qui change.

create or replace view v_synthese_cumulee_cycle
with (security_invoker = true)
as
select distinct on (e.id, p.cycle_id, sp.element_programme_id)
  e.id as enfant_id,
  p.cycle_id,
  sp.element_programme_id,
  sp.statut_global_id,
  st.code as statut_code,
  st.ordre as statut_ordre,
  sp.parcours_id as parcours_id_origine,
  sp.synthese_ia,
  sp.synthese_ia_generee_le
from syntheses_progression sp
join parcours_scolaires p on p.id = sp.parcours_id
join enfants e on e.id = p.enfant_id
join statuts_progression st on st.id = sp.statut_global_id
order by e.id, p.cycle_id, sp.element_programme_id, st.ordre desc, sp.valide_le desc;

grant select on v_synthese_cumulee_cycle to authenticated;

create or replace view v_progression_par_domaine_cumulee
with (security_invoker = true)
as
select
  vsc.enfant_id,
  vsc.cycle_id,
  split_part(chemin_element_programme(vsc.element_programme_id), ' > ', 1) as domaine,
  vsc.statut_code,
  vsc.statut_ordre,
  count(*) as nb
from v_synthese_cumulee_cycle vsc
group by vsc.enfant_id, vsc.cycle_id, domaine, vsc.statut_code, vsc.statut_ordre;

grant select on v_progression_par_domaine_cumulee to authenticated;

-- Indicateurs d'observation (nb d'observations, dates, contextes) eux
-- aussi cumules par enfant+cycle plutot que par parcours, pour le
-- detail affiche par competence sur la page Progression.
create or replace view v_indicateurs_observation_cumules
with (security_invoker = true)
as
select
  p.enfant_id,
  p.cycle_id,
  oep.element_programme_id,
  count(*) as nb_observations,
  count(distinct a.date_activite) as nb_dates_distinctes,
  count(distinct a.contexte_id) as nb_contextes_distincts,
  min(a.date_activite) as premiere_observation,
  max(a.date_activite) as derniere_observation
from observations_elements_programme oep
join activites a on a.id = oep.activite_id
join parcours_scolaires p on p.id = a.parcours_id
group by p.enfant_id, p.cycle_id, oep.element_programme_id;

grant select on v_indicateurs_observation_cumules to authenticated;
