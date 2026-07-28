-- Nettoyage (audit) - le libelle "Valide" pour une activite entrait en
-- collision avec le "Valide" utilise pour le statut de progression d'une
-- competence (deux notions totalement differentes : ici, "j'ai fini de
-- remplir cette activite" ; la, "je considere cette competence acquise").
-- On distingue clairement les deux dans le vocabulaire affiche.

update statuts_activite
set libelle = U&'R\00e9daction termin\00e9e'
where code = 'valide';

update statuts_activite
set libelle = U&'En cours de r\00e9daction'
where code = 'brouillon';
