-- Permet d'indiquer le pronom (il / elle) a utiliser pour un enfant,
-- sans jamais demander son genre ni son sexe -- uniquement pour que
-- les textes generes par l'IA (a partir des photos notamment) emploient
-- le bon pronom plutot que d'essayer de le deviner visuellement, ce qui
-- peut se tromper. Laisse a NULL, aucun pronom n'est impose au modele.

alter table enfants
  add column if not exists pronom text check (pronom is null or pronom in ('il', 'elle'));
