-- Remplace l'idee initiale d'export texte brut par un export PowerPoint
-- (.pptx) : c'est le format que Canva sait reellement importer en
-- conservant texte modifiable ET photos placees sur les diapositives
-- (un .txt ne peut pas contenir d'image). La colonne texte_final_storage_path
-- de la migration precedente reste inutilisee mais inoffensive.

alter table dossiers_export
  add column if not exists pptx_final_storage_path text;
