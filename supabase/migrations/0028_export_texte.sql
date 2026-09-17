-- Permet de telecharger, en plus du PDF, une version texte brut du
-- dossier finalise -- pour copier/coller dans un outil de mise en page
-- comme Canva plutot que d'utiliser le PDF genere par l'application.

alter table dossiers_export
  add column if not exists texte_final_storage_path text;
