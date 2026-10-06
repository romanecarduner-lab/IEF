-- Les exemples d'un sous-domaine dans l'export passent de deux champs
-- fixes (exemple1 / exemple2) a une liste libre : chaque exemple garde
-- son activite, son texte et la liste des photos choisies pour cette
-- activite. Format de chaque element :
--   {"activite_id": "...", "synthese": "..." ou null, "trace_ids": ["...", ...]}
-- Les anciennes colonnes restent en place, simplement plus utilisees.

alter table dossiers_export_sous_domaines
  add column if not exists exemples jsonb not null default '[]'::jsonb;
