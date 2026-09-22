-- Correction : "Cycle 2 (CP, CE1, CE2)" avait ete rattache au referentiel
-- archive ('brouillon-0') au lieu du referentiel actif reellement utilise
-- par le Cycle 1 -- d'ou son absence de la liste proposee a la creation
-- d'un parcours (qui ne montre que les cycles d'un referentiel actif).
-- Le contenu deja importe (Lecture, etc.) est identifie par cycle_id, pas
-- par referentiel_id : rien d'autre n'est touche.

update cycles
set referentiel_id = (
  select referentiel_id from cycles where libelle = 'Cycle 1 - Ecole maternelle'
)
where libelle = 'Cycle 2 (CP, CE1, CE2)';
