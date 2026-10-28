-- Un dossier finalise peut etre rouvert pour etre modifie. Chaque
-- finalisation ecrit maintenant son PDF et son PowerPoint sous un nom date
-- (plus d'ecrasement) et garde la liste des versions dans cette colonne :
-- [{ "finalise_le": "2026-10-28T12:30:00.000Z" | null, "pdf": "...", "pptx": "..." | null }]
-- finalise_le est null pour les finalisations faites avant cette mise a jour.

alter table dossiers_export
  add column if not exists versions_finales jsonb not null default '[]'::jsonb;
