-- Les dossiers d'export (PDF avec photos, PowerPoint) depassent facilement
-- 10 Mo, et le format PowerPoint n'etait pas autorise dans le bucket :
-- l'enregistrement du PDF echouait ("Impossible d'enregistrer le PDF
-- genere") et le PowerPoint n'etait jamais conserve. On releve la limite
-- a 50 Mo (plafond du plan gratuit Supabase) et on autorise le PowerPoint.

update storage.buckets
set
  file_size_limit = 52428800, -- 50 Mo
  allowed_mime_types = array[
    'image/jpeg','image/png','image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]
where id = 'traces-pedagogiques';
