-- Synthese pedagogique redigee par IA, par competence et par parcours.
-- Contrairement au texte mecanique existant (liste des competences par
-- statut), celle-ci est generee a partir de TOUTES les observations
-- liees a la competence sur l'annee, pour produire une vraie analyse
-- (comprehension, evolution) plutot qu'un simple constat -- exigence
-- explicite de l'inspecteur.

alter table syntheses_progression
  add column if not exists synthese_ia text,
  add column if not exists synthese_ia_generee_le timestamptz;
