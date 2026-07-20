import { useState, useEffect, useCallback } from "react";
import { jsPDF } from "jspdf";

/* ---------------------------------------------------------------
   DESIGN TOKENS
--------------------------------------------------------------- */
const palette = {
  light: {
    bg: "#FAF7F2",
    bgAlt: "#F1ECE3",
    card: "#FFFFFF",
    text: "#3E3A36",
    textSoft: "#6B6459",
    sage: "#8FA487",
    sageSoft: "#DCE5D6",
    blue: "#8FA3B3",
    blueSoft: "#DEE7EC",
    terracotta: "#C98868",
    terracottaSoft: "#F1DFD4",
    stone: "#8C8577",
    stoneSoft: "#E7E3DB",
    ocre: "#93762C",
    ocreSoft: "#F0E4C4",
    violet: "#7A5FA0",
    violetSoft: "#E6DEF0",
    force: "#A9612E",
    forceSoft: "#EAD9C6",
    border: "#E7E0D5",
  },
  dark: {
    bg: "#26241F",
    bgAlt: "#302D27",
    card: "#332F29",
    text: "#EFEAE1",
    textSoft: "#B7AF9F",
    sage: "#9CB393",
    sageSoft: "#3C4438",
    blue: "#9DB2C1",
    blueSoft: "#37424A",
    terracotta: "#D69B7C",
    terracottaSoft: "#4A3A30",
    stone: "#A69F90",
    stoneSoft: "#3E3A33",
    ocre: "#E0C57A",
    ocreSoft: "#4A4530",
    violet: "#C7ADE8",
    violetSoft: "#3E3650",
    force: "#E0925A",
    forceSoft: "#4A3626",
    border: "#454037",
  },
};

const fontDisplay =
  '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif';
const fontBody =
  '-apple-system, "Segoe UI", "Figtree", "Helvetica Neue", Arial, sans-serif';

const MENTION_PROPRIETE = "Créé par Romane Carduner – Centre Sentiré · Tous droits réservés";

/* ---------------------------------------------------------------
   CONTENU — Bibliothèque clinique d'exercices
   Chaque exercice est indexé selon plusieurs portes d'entrée :
   état du système nerveux, besoin, réponse de protection, canal
   sensoriel/cognitif, durée. "sensible" liste les dimensions à
   exclure si l'utilisateur les a indiquées comme à éviter.
--------------------------------------------------------------- */
const ETATS_LIST = [
  { id: "hyperactivation", label: "Hyperactivation", color: "terracotta" },
  { id: "hypoactivation", label: "Hypoactivation", color: "blue" },
  { id: "tolerance", label: "Zone de tolérance", color: "sage" },
  { id: "mixte", label: "État mixte", color: "stone" },
  { id: "dissociation", label: "Dissocié·e / irréel·le / loin", color: "stone" },
];

const BESOINS_LIST = [
  { id: "orienter", label: "M'orienter vers le présent" },
  { id: "appuis", label: "Sentir mes appuis" },
  { id: "contenir", label: "Contenir ce qui déborde" },
  { id: "mobiliser_fight", label: "Mobiliser mon énergie sans me faire mal" },
  { id: "mobiliser_flight", label: "Répondre à une envie de fuite" },
  { id: "mouvement", label: "Retrouver un peu de mouvement" },
  { id: "sens", label: "Réveiller mes sens en douceur" },
  { id: "choix", label: "Retrouver du choix" },
  { id: "dissocie", label: "Revenir quand je me sens loin" },
  { id: "limites", label: "Retrouver mes limites" },
  { id: "corps", label: "Revenir à mon corps" },
  { id: "mental", label: "Prendre de la distance avec mes pensées" },
  { id: "douceur", label: "Un peu de douceur envers moi" },
  { id: "lien", label: "Être moins seul·e" },
  { id: "lieu_ressource", label: "Un lieu ressource" },
  { id: "tolerance_renforcer", label: "Mieux me connaître" },
  { id: "honte", label: "Un peu de recul face à la honte" },
  { id: "transition", label: "Faire une transition" },
];

const CANAUX_LIST = [
  { id: "visuel", label: "Visuel" },
  { id: "auditif", label: "Auditif" },
  { id: "tactile", label: "Tactile" },
  { id: "moteur", label: "Mouvement" },
  { id: "cognitif", label: "Réfléchir / écrire" },
  { id: "imaginatif", label: "Imagination" },
  { id: "relationnel", label: "Lien avec quelqu'un" },
];

const DUREE_LIST = [
  { id: "30s", label: "30 secondes" },
  { id: "2min", label: "2 minutes" },
  { id: "5min", label: "5 minutes" },
  { id: "10min", label: "10 minutes ou plus" },
];

const EVITER_LIST = [
  { id: "yeux_fermes", label: "Fermer les yeux" },
  { id: "respiration", label: "Me concentrer sur ma respiration" },
  { id: "interoception", label: "Sentir l'intérieur de mon corps" },
  { id: "imagination", label: "Imaginer un lieu" },
  { id: "immobilite", label: "Être immobile" },
  { id: "mouvement", label: "Bouger" },
  { id: "toucher_corps", label: "Toucher mon corps" },
  { id: "ecrire", label: "Écrire" },
];

const REMARQUE_OPTIONS = [
  "Un peu plus présent·e", "Un peu plus stable", "Un peu plus d'énergie",
  "Un peu moins d'énergie", "Aucun changement", "C'est plus inconfortable", "Autre chose",
];

const FEEDBACK_OPTIONS = ["Beaucoup", "Un peu", "Cela dépend", "Pas vraiment", "Je préfère l'éviter"];

const EXERCISES = [
  { id: "regard-explore", titre: "Le regard qui explore", etats: ["hyperactivation", "mixte"], besoins: ["orienter"], protection: [], canaux: ["visuel"], duree: "2min", materiel: null,
    objectif: "Aider l'attention à sortir progressivement du tunnel de la menace et à reprendre contact avec l'environnement actuel.",
    etapes: ["Vous n'avez pas besoin de fermer les yeux.", "Laissez votre regard aller doucement autour de vous, sans chercher quelque chose de précis.", "Regardez d'abord ce qui est devant vous, puis un peu à droite, puis un peu à gauche.", "Remarquez une couleur, une forme, un objet familier — quelque chose qui n'est pas menaçant.", "Vous n'avez pas besoin de vous sentir calme : il s'agit seulement de laisser vos yeux vérifier où vous êtes maintenant."],
    precaution: null, sensible: [] },
  { id: "ou-suis-je", titre: "Où suis-je maintenant ?", etats: ["hyperactivation", "mixte", "dissociation"], besoins: ["orienter"], protection: [], canaux: ["cognitif", "visuel"], duree: "2min", materiel: null,
    objectif: "Soutenir la réorientation lorsque vous vous sentez submergé·e, confus·e ou « reparti·e ailleurs ».",
    etapes: ["Regardez autour de vous et complétez ce que vous pouvez : « Je suis à… », « Nous sommes… », « Il est environ… », « Autour de moi, je vois… », « La prochaine chose que je vais faire est… »", "Vous n'avez pas besoin de compléter toutes les phrases.", "Vous pouvez aussi simplement les lire sans y répondre, si répondre est trop difficile."],
    precaution: null, sensible: [] },
  { id: "preuves-present", titre: "Les preuves du présent", etats: ["hyperactivation", "dissociation"], besoins: ["orienter"], protection: [], canaux: ["cognitif", "visuel"], duree: "2min", materiel: null,
    objectif: "Aider lorsque quelque chose du passé semble envahir le présent.",
    etapes: ["Cherchez trois éléments qui appartiennent clairement à aujourd'hui : votre téléphone, un objet récent, votre âge actuel, la date, le lieu où vous vivez maintenant, une personne qui fait partie de votre vie aujourd'hui.", "Complétez : « Ce qui se passe dans mon corps peut être très intense. Et en même temps, aujourd'hui… » — ajoutez une seule information du présent, par exemple « je suis dans mon salon »."],
    precaution: "Cet exercice ne vise pas à affirmer « je suis en sécurité » à votre place, mais à remarquer ce qui, ici et maintenant, est différent d'avant.", sensible: [] },
  { id: "trois-choses-stables", titre: "Trois choses stables", etats: ["hyperactivation", "mixte"], besoins: ["orienter"], protection: [], canaux: ["visuel"], duree: "30s", materiel: null,
    objectif: "Créer des repères visuels quand tout semble chaotique.",
    etapes: ["Choisissez trois éléments immobiles autour de vous.", "Regardez le premier, puis le deuxième, puis le troisième, puis revenez au premier.", "Observez simplement leurs contours, à votre rythme."],
    precaution: null, sensible: [] },
  { id: "sentir-support", titre: "Sentir le support", etats: ["hyperactivation"], besoins: ["appuis"], protection: [], canaux: ["tactile"], duree: "30s", materiel: null,
    objectif: "Diriger l'attention vers les zones de votre corps soutenues par l'environnement.",
    etapes: ["Sans chercher à sentir tout votre corps, remarquez seulement ce qui est soutenu : vos pieds par le sol, vos jambes par le fauteuil, votre dos par le dossier.", "Choisissez une seule zone. Vous n'avez pas besoin de la modifier.", "Demandez-vous simplement : « Qu'est-ce qui me porte à cet endroit précis ? »"],
    precaution: null, sensible: ["toucher_corps"] },
  { id: "pousser-le-sol", titre: "Pousser le sol", etats: ["hyperactivation"], besoins: ["appuis", "mobiliser_fight"], protection: [], canaux: ["moteur"], duree: "30s", materiel: null,
    objectif: "Créer un appui et donner une direction à une énergie de mobilisation.",
    etapes: ["Posez les pieds au sol si cela vous est possible.", "Appuyez doucement, comme pour éloigner le sol de vous — pas au maximum, juste assez pour sentir vos jambes travailler.", "Maintenez quelques secondes, puis diminuez progressivement la pression."],
    precaution: null, sensible: ["mouvement"] },
  { id: "poids-mains", titre: "Le poids dans les mains", etats: ["hyperactivation"], besoins: ["appuis"], protection: [], canaux: ["tactile"], duree: "2min", materiel: "Un objet avec un peu de poids (coussin, livre, bouteille d'eau).",
    objectif: "Utiliser le poids et la résistance comme information sensorielle stable.",
    etapes: ["Prenez un objet qui a un peu de poids.", "Sentez son poids dans vos mains : où vos doigts le tiennent, quels muscles travaillent.", "Vous pouvez le déplacer doucement d'une main à l'autre."],
    precaution: null, sensible: [] },
  { id: "le-contenant", titre: "Le contenant", etats: ["hyperactivation", "mixte"], besoins: ["contenir"], protection: [], canaux: ["imaginatif", "cognitif"], duree: "5min", materiel: "Optionnel : une feuille et un stylo pour la version concrète.",
    objectif: "Donner temporairement une place à une pensée, une image ou une préoccupation qui prend toute la place — sans la supprimer ni la nier.",
    etapes: ["Si l'imagination vous convient aujourd'hui : imaginez un contenant adapté (boîte, coffre, armoire…). Décidez sa taille, sa matière, s'il a un verrou, qui peut l'ouvrir, où il se trouve.", "Donnez à ce qui vous préoccupe une forme symbolique — un mot, une couleur, un objet — sans avoir besoin de le raconter en détail. Déposez cette représentation dans le contenant, puis fermez-le.", "Si l'imagination ne vous convient pas : écrivez seulement quelques mots sur une feuille, pliez-la, placez-la dans une enveloppe ou un tiroir, avec par exemple « pas maintenant » ou « à reprendre avec… ».", "Vous pourrez décider plus tard de le rouvrir, seul·e ou avec votre thérapeute."],
    precaution: "Cet exercice ne demande jamais de détailler un contenu traumatique. Il ne s'agit pas d'enfermer définitivement une émotion, seulement de lui donner une place pour plus tard.", sensible: ["imagination", "ecrire"] },
  { id: "parking-pensees", titre: "Le parking à pensées", etats: ["hyperactivation", "tolerance"], besoins: ["contenir", "mental"], protection: [], canaux: ["cognitif"], duree: "2min", materiel: null,
    objectif: "Pour les pensées répétitives, les tâches ou les inquiétudes qui tournent en boucle.",
    etapes: ["Créez trois espaces : « à faire maintenant », « à reprendre plus tard », « je ne peux pas agir dessus aujourd'hui ».", "Placez une seule préoccupation dans l'une de ces catégories.", "Vous n'avez pas besoin d'organiser toute votre vie — une seule chose suffit."],
    precaution: null, sensible: [] },
  { id: "bords-du-corps", titre: "Les bords du corps", etats: ["hyperactivation"], besoins: ["contenir", "corps"], protection: [], canaux: ["tactile"], duree: "30s", materiel: null,
    objectif: "Retrouver une sensation de limites corporelles lorsque l'émotion paraît prendre toute la place.",
    etapes: ["Choisissez une zone neutre ou suffisamment tolérable : les mains, les avant-bras, les pieds, les épaules.", "Frottez doucement le tissu de votre vêtement, ou pressez vos mains l'une contre l'autre.", "Remarquez simplement : « ici, il y a un bord. » Vous n'avez pas besoin de sentir tout votre corps."],
    precaution: null, sensible: ["toucher_corps"] },
  { id: "pousser-mur", titre: "Pousser le mur", etats: ["hyperactivation"], besoins: ["mobiliser_fight"], protection: ["fight"], canaux: ["moteur"], duree: "2min", materiel: null,
    objectif: "Donner à l'énergie de lutte une action contenue et contrôlée.",
    etapes: ["Vérifiez d'abord que le mur est stable et que votre corps vous permet cet exercice.", "Placez les mains contre le mur. Choisissez vous-même la force.", "Poussez quelques secondes, sentez la résistance, puis diminuez progressivement. Vous pouvez recommencer une ou deux fois."],
    variantes: [
      { label: "Avec un objet, en insistant sur le choix", etapes: ["Poussez contre un mur ou un objet stable, avec la force que vous choisissez.", "Arrêtez.", "Décidez volontairement si vous recommencez ou non — c'est cette décision qui est le cœur de cette version, pas la force employée."] },
    ],
    precaution: null, sensible: ["mouvement"] },
  { id: "tordre-tissu", titre: "Tordre sans détruire", etats: ["hyperactivation"], besoins: ["mobiliser_fight"], protection: ["fight"], canaux: ["moteur", "tactile"], duree: "2min", materiel: "Une serviette ou un tissu solide.",
    objectif: "Donner une action contenue à une énergie de colère, sans escalade.",
    etapes: ["Tenez le tissu entre vos mains et tordez-le progressivement, en choisissant vous-même la force.", "Diminuez lentement. Vous pouvez recommencer."],
    precaution: "Vous restez à tout moment celui ou celle qui décide de l'intensité — le but n'est pas d'augmenter la force à chaque fois.", sensible: [] },
  { id: "ce-que-je-protege", titre: "Ce que je protège", etats: ["hyperactivation"], besoins: ["mobiliser_fight", "mental"], protection: ["fight"], canaux: ["cognitif"], duree: "2min", materiel: null,
    objectif: "Donner du sens à la colère, sans obliger à agir dans l'immédiat.",
    etapes: ["Complétez : « Si ma colère essaie de protéger quelque chose, peut-être qu'elle protège… » (une limite, mon intégrité, quelqu'un, je ne sais pas…).", "Puis : « Quelle est la plus petite action protectrice possible qui ne me mette pas en danger ? »"],
    precaution: null, sensible: [] },
  { id: "marcher-destination", titre: "Marcher avec une destination", etats: ["hyperactivation"], besoins: ["mobiliser_flight"], protection: ["flight"], canaux: ["moteur"], duree: "2min", materiel: null,
    objectif: "Donner une direction à une énergie de fuite.",
    etapes: ["Choisissez un point visible et accessible. Marchez jusqu'à ce point, arrêtez-vous, regardez autour de vous.", "Choisissez ensuite de rester là, de revenir, ou de choisir un autre point. Vous gardez la direction du mouvement."],
    precaution: null, sensible: ["mouvement"] },
  { id: "urgent-ou-intense", titre: "Urgent ou intense ?", etats: ["hyperactivation"], besoins: ["mobiliser_flight", "mental"], protection: ["flight"], canaux: ["cognitif"], duree: "2min", materiel: null,
    objectif: "Différencier l'intensité ressentie dans le corps d'une urgence réellement extérieure.",
    etapes: ["Posez-vous ces trois questions : Y a-t-il un danger concret immédiat ? Une action doit-elle vraiment être faite dans les prochaines minutes ? Puis-je attendre cinq minutes avant de décider ?", "Si vous ne savez pas, vous pouvez demander l'avis d'une personne de confiance."],
    precaution: null, sensible: [] },
  { id: "plus-petit-mouvement", titre: "Le plus petit mouvement possible", etats: ["hypoactivation", "mixte"], besoins: ["mouvement"], protection: ["freeze"], canaux: ["moteur"], duree: "30s", materiel: null,
    objectif: "Rendre l'action accessible lorsqu'un mouvement complet semble impossible.",
    etapes: ["Choisissez le plus petit mouvement possible : bouger un doigt, décoller légèrement un talon, tourner les yeux.", "Faites ce mouvement une seule fois, puis choisissez : le refaire, en essayer un autre, ou arrêter."],
    precaution: null, sensible: ["mouvement"] },
  { id: "pousser-revenir", titre: "Pousser et revenir", etats: ["hypoactivation"], besoins: ["mouvement"], protection: [], canaux: ["moteur"], duree: "30s", materiel: null,
    objectif: "Réintroduire un mouvement simple, alterné et prévisible.",
    etapes: ["Appuyez légèrement un pied contre le sol, puis l'autre.", "Alternez à votre rythme : gauche, droite, gauche, droite."],
    precaution: null, sensible: ["mouvement"] },
  { id: "mouvements-grandissent", titre: "Les mouvements qui grandissent", etats: ["hypoactivation"], besoins: ["mouvement"], protection: [], canaux: ["moteur"], duree: "2min", materiel: null,
    objectif: "Laisser un mouvement minuscule s'agrandir progressivement, à votre rythme.",
    etapes: ["Commencez avec un mouvement minuscule, par exemple bouger les doigts.", "Si cela reste acceptable, laissez le mouvement s'agrandir un peu : les mains, puis les poignets, puis peut-être les bras.", "Vous pouvez vous arrêter à n'importe quelle étape."],
    precaution: null, sensible: ["mouvement"] },
  { id: "chercher-couleur", titre: "Chercher une couleur", etats: ["hypoactivation"], besoins: ["sens"], protection: [], canaux: ["visuel"], duree: "30s", materiel: null,
    objectif: "Stimuler doucement l'attention par la recherche visuelle.",
    etapes: ["Choisissez une couleur et cherchez un objet de cette couleur, puis un deuxième.", "Variante plus activante : cherchez quelque chose de rouge, quelque chose qui brille, quelque chose avec des lettres, quelque chose qui bouge."],
    precaution: null, sensible: [] },
  { id: "contraste-sensoriel", titre: "Contraste sensoriel", etats: ["hypoactivation"], besoins: ["sens"], protection: [], canaux: ["tactile"], duree: "2min", materiel: null,
    objectif: "Créer une information sensorielle claire pour réveiller doucement l'attention.",
    etapes: ["Choisissez deux sensations différentes : lisse / rugueux, léger / lourd, frais / tiède.", "Touchez le premier objet, puis le second. Remarquez simplement : « c'est différent. »"],
    precaution: "Pas de froid extrême, pas de douleur, pas de stimulation brutale.", sensible: [] },
  { id: "voix-qui-revient", titre: "La voix qui revient", etats: ["hypoactivation"], besoins: ["sens"], protection: [], canaux: ["auditif"], duree: "2min", materiel: null,
    objectif: "Réintroduire progressivement la voix et le son, à votre rythme.",
    etapes: ["Choisissez un niveau : expirer avec un son très léger ; fredonner une note ; dire votre prénom ; lire une phrase à voix haute.", "Vous choisissez le niveau qui vous convient aujourd'hui — rien n'est obligatoire au-delà."],
    precaution: null, sensible: ["respiration"] },
  { id: "choisir-entre-deux", titre: "Choisir entre deux", etats: ["hypoactivation"], besoins: ["choix"], protection: ["freeze"], canaux: ["cognitif"], duree: "30s", materiel: null,
    objectif: "Restaurer une capacité de décision lorsque tout semble inaccessible.",
    etapes: ["Choisissez seulement entre deux possibilités très simples : rester assis·e ou vous lever ? boire quelque chose ou attendre ? continuer ou arrêter ?", "Un petit choix est déjà un choix."],
    precaution: null, sensible: [] },
  { id: "prochaine-action", titre: "La prochaine action minuscule", etats: ["hypoactivation"], besoins: ["choix"], protection: [], canaux: ["cognitif"], duree: "30s", materiel: null,
    objectif: "Se concentrer sur une seule action accessible, plutôt que sur tout ce qu'il y aurait à faire.",
    etapes: ["Ne pensez pas à toute la journée. Quelle est seulement la prochaine action ? (poser les pieds au sol, prendre mon téléphone, boire une gorgée…)", "Vous pouvez créer votre propre micro-action."],
    precaution: null, sensible: [] },
  { id: "carte-identite", titre: "La carte d'identité du présent", etats: ["dissociation"], besoins: ["dissocie", "orienter"], protection: [], canaux: ["cognitif"], duree: "2min", materiel: null,
    objectif: "Revenir vers des repères simples quand vous vous sentez loin, absent·e, ou hors du temps.",
    etapes: ["Complétez ou relisez si vous les avez déjà préparées : « Je m'appelle… », « J'ai … ans », « Nous sommes en… », « Je suis actuellement à… », « La personne que je peux contacter est… », « Après cet exercice, je vais… »", "Vous pouvez préparer ces informations à l'avance, quand vous allez bien, pour vous les réafficher plus facilement dans un moment difficile."],
    precaution: null, sensible: [] },
  { id: "ce-qui-a-change", titre: "Ce qui a changé depuis", etats: ["dissociation"], besoins: ["dissocie"], protection: [], canaux: ["cognitif"], duree: "2min", materiel: null,
    objectif: "Soutenir la distinction entre le passé et le présent.",
    etapes: ["Cherchez un élément qui montre que le temps a passé : votre âge, votre téléphone, votre logement, une personne présente aujourd'hui.", "Terminez la phrase : « Aujourd'hui, une chose est différente : … »"],
    precaution: null, sensible: [] },
  { id: "decrire-objet", titre: "Décrire un objet à quelqu'un", etats: ["dissociation"], besoins: ["dissocie", "sens"], protection: [], canaux: ["visuel", "cognitif"], duree: "2min", materiel: null,
    objectif: "Ancrer l'attention dans une tâche concrète et neutre.",
    etapes: ["Choisissez un objet. Imaginez que vous devez le décrire à quelqu'un qui ne peut pas le voir : sa couleur, sa forme, sa taille, sa matière, son usage.", "Vous n'avez pas besoin de parler de ce que vous ressentez."],
    precaution: null, sensible: [] },
  { id: "couverture-enveloppement", titre: "La couverture ou l'enveloppement", etats: ["hyperactivation", "dissociation"], besoins: ["contenir"], protection: [], canaux: ["tactile"], duree: "2min", materiel: "Une couverture, un plaid, un coussin ou un vêtement enveloppant.",
    objectif: "Utiliser la pression et l'enveloppement comme repère de contenance, si cela vous convient.",
    etapes: ["Si la pression ou l'enveloppement vous conviennent, choisissez vous-même la zone couverte, la pression et la durée.", "Demandez-vous régulièrement : plus ? moins ? pareil ? stop ?"],
    precaution: null, sensible: ["toucher_corps"] },
  { id: "mains-rencontrent", titre: "Les mains qui se rencontrent", etats: ["hyperactivation"], besoins: ["contenir"], protection: [], canaux: ["tactile"], duree: "30s", materiel: null,
    objectif: "Retrouver une sensation de limite et de résistance, avec vos propres mains.",
    etapes: ["Placez vos paumes l'une contre l'autre. Laissez une main pousser légèrement l'autre, puis laissez l'autre répondre.", "Vous choisissez la force. Remarquez : « il y a une limite, il y a une résistance. »"],
    precaution: null, sensible: ["toucher_corps"] },
  { id: "dossier-a-reprendre", titre: "Le dossier à reprendre", etats: ["hyperactivation", "tolerance"], besoins: ["contenir"], protection: [], canaux: ["cognitif", "relationnel"], duree: "2min", materiel: "Selon le choix : carnet, note sur le téléphone, boîte, enveloppe.",
    objectif: "Mettre de côté une pensée ou un souvenir sans que cela signifie l'abandonner ou le nier.",
    etapes: ["Notez : « Ce que je mets de côté… », « Je souhaite y revenir : seul·e / avec mon thérapeute / avec une personne de confiance / plus tard », et éventuellement une date pour y revenir."],
    variantes: [
      { label: "Choisir un support extérieur réel", etapes: ["Choisissez un support : un carnet, une note sur votre téléphone, une boîte, une enveloppe, une personne, ou un·e professionnel·le.", "Confiez-y ce que vous souhaitez mettre de côté pour l'instant — ce n'est pas résolu, seulement posé ailleurs pour un moment."] },
    ],
    precaution: null, sensible: [] },
  { id: "lieu-ressource", titre: "Construire un lieu ressource", etats: ["tolerance", "hyperactivation"], besoins: ["lieu_ressource"], protection: [], canaux: ["imaginatif"], duree: "10min", materiel: null,
    objectif: "Construire progressivement un lieu ressource — réel, imaginaire, ou inspiré de plusieurs endroits — sur lequel vous gardez le contrôle.",
    etapes: ["Vérifiez d'abord si l'imagination vous convient aujourd'hui. Si non, vous pouvez partir d'une photo, d'un lieu réel ou d'un objet.", "Pensez à un endroit où vous vous sentez un peu plus tranquille ou simplement moins en difficulté. Il n'a pas besoin d'être parfait.", "Décidez qui peut y entrer, à quelle distance se trouvent les autres, s'il y a une porte, une limite, une lumière, un abri.", "Vous pouvez garder les yeux ouverts. Remarquez une seule chose concernant cet endroit, puis une deuxième seulement si vous le souhaitez.", "Remarquez l'effet : un peu plus d'espace ? rien de particulier ? de l'inconfort ? Si c'est inconfortable, vous pouvez arrêter et revenir à l'orientation externe.", "Si cela vous convient, associez ce lieu à une image, un mot, un geste ou un objet, pour pouvoir y revenir plus facilement."],
    precaution: "Ce lieu n'a pas besoin d'être un « lieu sûr » parfait — certaines personnes ne trouvent aucun lieu entièrement sûr, et c'est tout à fait normal. Si l'exercice augmente la détresse ou la dissociation, mieux vaut s'arrêter et choisir un exercice plus concret.", sensible: ["imagination", "yeux_fermes"] },
  { id: "oui-non-jns", titre: "Mon oui, mon non, mon je ne sais pas", etats: ["tolerance", "hyperactivation"], besoins: ["limites"], protection: ["fawn"], canaux: ["cognitif", "relationnel"], duree: "2min", materiel: null,
    objectif: "Entraîner le repérage de vos propres oui, non, et « je ne sais pas encore ».",
    etapes: ["Entraînez-vous sur des situations très simples et neutres : boire de l'eau maintenant ? continuer cet exercice ?", "Si une situation vous vient à l'esprit, vous pouvez vous en servir ici. Sinon, continuez avec les exemples neutres.", "Votre réponse est-elle plutôt oui, non, ou je ne sais pas encore ?", "« Je ne sais pas encore » est une réponse tout aussi valable que les autres."],
    precaution: null, sensible: [] },
  { id: "phrase-temps", titre: "La phrase qui crée du temps", etats: ["tolerance", "hyperactivation"], besoins: ["limites"], protection: ["fawn"], canaux: ["relationnel", "cognitif"], duree: "30s", materiel: null,
    objectif: "Se donner un peu de temps avant de répondre à quelqu'un.",
    etapes: ["Si une situation récente, actuelle ou qui se répète vous vient à l'esprit, vous pouvez vous en servir pour cet exercice. Sinon, un exemple général fonctionne tout aussi bien.", "Choisissez ou enregistrez en favori une phrase : « J'ai besoin d'y réfléchir. », « Je ne peux pas répondre maintenant. », « Je préfère arrêter cette conversation pour l'instant. »", "Vous pouvez aussi créer votre propre phrase."],
    variantes: [
      { label: "Se rappeler qu'une réponse immédiate n'est pas obligatoire", etapes: ["Si une situation récente, actuelle ou qui se répète vous vient à l'esprit, vous pouvez vous en servir pour cet exercice. Sinon, un exemple général fonctionne tout aussi bien.", "Vous n'avez peut-être pas besoin de répondre maintenant.", "Choisissez une phrase, ou créez la vôtre : « Je vais y réfléchir. », « Je te répondrai plus tard. », « Je ne sais pas encore. », « Je préfère ne pas répondre maintenant. »"] },
      { label: "Choisir la durée du délai à l'avance", etapes: ["Si une situation récente, actuelle ou qui se répète vous vient à l'esprit, vous pouvez vous en servir pour cet exercice. Sinon, un exemple général fonctionne tout aussi bien.", "Quand je ressens une forte pression pour répondre, j'essaie d'attendre… : 30 secondes ; 5 minutes ; une nuit ; le temps d'en parler à quelqu'un ; une durée personnalisée.", "Ce n'est pas une obligation, seulement une option que vous gardez disponible."] },
    ],
    precaution: null, sensible: [] },
  { id: "moi-et-lautre", titre: "Moi et l'autre", etats: ["tolerance", "hyperactivation"], besoins: ["limites"], protection: ["fawn"], canaux: ["cognitif"], duree: "2min", materiel: null,
    objectif: "Distinguer ce qui vous appartient de ce qui appartient à l'autre personne.",
    etapes: ["Si une situation récente, actuelle ou qui se répète vous vient à l'esprit, vous pouvez vous en servir pour cet exercice. Sinon, un exemple général fonctionne tout aussi bien.", "Créez deux colonnes : « ce qui m'appartient » et « ce qui appartient à l'autre » (mes émotions / ses émotions, mes choix / ses choix…).", "Demandez-vous : y a-t-il une chose que je porte peut-être à la place de quelqu'un d'autre ?"],
    precaution: null, sensible: [] },
  { id: "zone-neutre", titre: "La zone neutre", etats: ["dissociation", "hypoactivation"], besoins: ["corps"], protection: [], canaux: ["tactile"], duree: "30s", materiel: null,
    objectif: "Reprendre contact avec le corps par une zone facile, sans passer par l'endroit le plus inconfortable.",
    etapes: ["Cherchez une zone neutre ou facile à sentir : un doigt, le bout du nez, les cheveux, les pieds, le contact du vêtement.", "Restez simplement avec cette zone quelques secondes."],
    precaution: null, sensible: ["toucher_corps", "interoception"] },
  { id: "balance-attention", titre: "La balance de l'attention", etats: ["hyperactivation", "dissociation"], besoins: ["corps"], protection: [], canaux: ["cognitif", "tactile"], duree: "2min", materiel: null,
    objectif: "Découvrir que l'attention peut se déplacer, sans rester bloquée sur une sensation difficile.",
    etapes: ["Remarquez brièvement quelque chose d'inconfortable, puis dirigez votre attention vers un objet, un son ou un appui.", "Revenez vers l'extérieur autant de fois que nécessaire. Le but n'est pas d'explorer l'inconfort."],
    precaution: null, sensible: ["interoception"] },
  { id: "remarque-pensee", titre: "Je remarque que j'ai la pensée…", etats: ["hyperactivation", "tolerance"], besoins: ["mental"], protection: [], canaux: ["cognitif"], duree: "2min", materiel: null,
    objectif: "Créer un peu de distance avec une pensée, sans chercher à la transformer de force.",
    etapes: ["Plutôt que « je vais échouer », essayez : « je remarque que j'ai la pensée : je vais échouer ».", "Demandez-vous ce qu'est cette pensée : une information, une hypothèse, une peur, un souvenir, ou je ne sais pas."],
    precaution: null, sensible: [] },
  { id: "nom-du-film", titre: "Le nom du film", etats: ["hyperactivation", "tolerance"], besoins: ["mental"], protection: [], canaux: ["cognitif"], duree: "2min", materiel: null,
    objectif: "Repérer un scénario mental répétitif, sans obligation de l'arrêter.",
    etapes: ["Si vos pensées étaient un film qui repasse souvent, quel pourrait être son titre ?", "Vous pouvez simplement remarquer : « ah, ce film est revenu », sans avoir besoin de l'arrêter."],
    precaution: null, sensible: [] },
  { id: "une-chose-a-la-fois", titre: "Une chose à la fois", etats: ["hyperactivation", "tolerance"], besoins: ["mental"], protection: [], canaux: ["cognitif"], duree: "30s", materiel: null,
    objectif: "Réduire une charge mentale trop large à une seule étape accessible.",
    etapes: ["Pas toute la journée, pas tout le problème : seulement la prochaine chose.", "Quelle est la prochaine étape suffisamment petite ?"],
    precaution: null, sensible: [] },
  { id: "parler-comme-a-quelquun", titre: "Parler comme à quelqu'un qu'on aime", etats: ["tolerance", "hyperactivation", "hypoactivation"], besoins: ["douceur"], protection: [], canaux: ["cognitif"], duree: "2min", materiel: null,
    objectif: "Trouver une phrase bienveillante sans recourir à des formules positives forcées.",
    etapes: ["Imaginez qu'une personne que vous aimez vive exactement ce que vous vivez. Que ne lui diriez-vous surtout pas ? Que pourriez-vous lui dire sans nier sa difficulté ?", "Choisissez une seule de ces phrases pour vous-même."],
    precaution: null, sensible: [] },
  { id: "cest-difficile-et", titre: "C'est difficile et…", etats: ["tolerance", "hyperactivation", "hypoactivation"], besoins: ["douceur"], protection: [], canaux: ["cognitif"], duree: "30s", materiel: null,
    objectif: "Reconnaître la difficulté sans la nier, tout en gardant un peu d'espace.",
    etapes: ["Complétez : « C'est difficile et je peux avancer par petites étapes. », « C'est difficile et je n'ai pas besoin de tout résoudre maintenant. »", "Vous pouvez créer votre propre phrase."],
    precaution: null, sensible: [] },
  { id: "qui-peut-etre-la", titre: "Qui peut être là, même un peu ?", etats: ["tolerance", "hyperactivation", "hypoactivation"], besoins: ["lien"], protection: [], canaux: ["relationnel"], duree: "2min", materiel: null,
    objectif: "Identifier un contact possible, même minime, sans avoir à tout raconter.",
    etapes: ["Vous n'avez pas forcément besoin de raconter toute votre histoire.", "Existe-t-il quelqu'un à qui vous pourriez envoyer un simple message, demander « tu es disponible ? », ou demander une présence silencieuse ?"],
    precaution: null, sensible: [] },
  { id: "message-prepare", titre: "Le message préparé", etats: ["tolerance", "hyperactivation", "hypoactivation"], besoins: ["lien"], protection: [], canaux: ["relationnel"], duree: "2min", materiel: null,
    objectif: "Préparer à l'avance des messages simples pour les moments où parler est difficile.",
    etapes: ["Si une situation récente, actuelle ou qui se répète vous vient à l'esprit, vous pouvez vous en servir pour cet exercice. Sinon, un exemple général fonctionne tout aussi bien.", "Vous pouvez préparer et enregistrer des messages comme : « Je ne vais pas très bien. Je n'ai pas besoin de solution, juste de présence. », « Peux-tu rester avec moi quelques minutes ? »"],
    variantes: [
      { label: "Version très courte, en un tap", etapes: ["Si une situation récente, actuelle ou qui se répète vous vient à l'esprit, vous pouvez vous en servir pour cet exercice. Sinon, un exemple général fonctionne tout aussi bien.", "Choisissez un message à envoyer tel quel : « Peux-tu rester avec moi ? », « Je n'ai pas besoin de parler. », « Peux-tu m'appeler ? », « J'ai besoin d'un peu d'espace. », « Je te répondrai plus tard. », « Je ne sais pas ce dont j'ai besoin, mais je ne veux pas être seul·e. »"] },
    ],
    precaution: null, sensible: [] },
  { id: "cartographie-perso", titre: "Ma cartographie personnelle", etats: ["tolerance"], besoins: ["tolerance_renforcer"], protection: [], canaux: ["cognitif"], duree: "10min", materiel: null,
    objectif: "Mieux connaître votre propre fonctionnement, en dehors des moments de crise.",
    etapes: ["Décrivez, en trois espaces : quand je suis suffisamment régulé·e (je remarque…, je peux…) ; quand je monte vers l'hyperactivation (les premiers signes sont…) ; quand je descends vers l'hypoactivation (les premiers signes sont…).", "Cette cartographie peut être enregistrée et modifiée au fil du temps."],
    precaution: null, sensible: [] },
  { id: "signaux-precoces", titre: "Mes signaux précoces", etats: ["tolerance"], besoins: ["tolerance_renforcer"], protection: [], canaux: ["cognitif"], duree: "5min", materiel: null,
    objectif: "Repérer les tout premiers signes, avant l'intensité maximale.",
    etapes: ["Passez en revue plusieurs catégories : corps, pensées, émotions, comportements, relations, sommeil, agitation.", "Construisez votre propre liste de signaux précoces."],
    precaution: null, sensible: [] },
  { id: "menu-regulation", titre: "Mon menu de régulation", etats: ["tolerance"], besoins: ["tolerance_renforcer"], protection: [], canaux: ["cognitif"], duree: "10min", materiel: null,
    objectif: "Préparer à l'avance ce qui peut aider à différents niveaux d'intensité.",
    etapes: ["Notez, pour chaque niveau : quand je vais plutôt bien (ce qui entretient mon équilibre) ; quand je commence à être activé·e (ce qui m'aide tôt) ; quand c'est très intense (ce qui est simple) ; quand je ne peux plus gérer seul·e (qui contacter)."],
    precaution: null, sensible: [] },

  { id: "detective-changements", titre: "Le détective des changements", etats: ["dissociation", "hyperactivation"], besoins: ["orienter"], protection: [], canaux: ["visuel"], duree: "2min", materiel: null,
    tags: ["orientation_exterieure", "vue"],
    objectif: "Remettre doucement l'attention en contact avec l'environnement actuel.",
    etapes: ["Regardez autour de vous sans chercher à tout observer. Trouvez trois choses qui n'étaient pas exactement comme cela hier, la dernière fois que vous êtes venu·e ici, ou quelques heures plus tôt — une lumière différente, un objet déplacé, un bruit nouveau.", "Choisissez un seul de ces changements et regardez-le quelques secondes.", "Si vous ne connaissez pas le lieu : cherchez plutôt trois indices qui permettent de deviner l'heure, la saison ou l'activité qui se déroule autour de vous."],
    precaution: null, sensible: [] },
  { id: "chasse-aux-formes", titre: "La chasse aux formes", etats: ["hyperactivation", "mixte"], besoins: ["orienter"], protection: [], canaux: ["visuel"], duree: "30s", materiel: null,
    tags: ["vue", "jeu"],
    objectif: "Occuper doucement le regard par une recherche simple et ludique.",
    etapes: ["Cherchez autour de vous : un cercle, un rectangle, une ligne, quelque chose d'irrégulier.", "Choisissez la forme que vos yeux trouvent la plus facile à regarder aujourd'hui.", "Version créative : inventez une cinquième catégorie — une forme qui ressemble à une vague, une montagne, un visage, une lettre."],
    precaution: null, sensible: [] },
  { id: "generique-du-present", titre: "Le générique du présent", etats: ["dissociation"], besoins: ["orienter", "dissocie"], protection: [], canaux: ["visuel", "cognitif"], duree: "2min", materiel: null,
    tags: ["orientation_exterieure", "langage", "creativite"],
    objectif: "Ancrer l'attention dans le décor actuel, sous une forme un peu ludique.",
    etapes: ["Si cette pièce était le décor d'un film qui se déroule exactement aujourd'hui, quels seraient les cinq éléments que la caméra devrait montrer pour que le spectateur comprenne où et quand nous sommes ?", "Quel serait le titre de cette scène ?"],
    precaution: null, sensible: [] },
  { id: "meteo-de-la-piece", titre: "La météo de la pièce", etats: ["hyperactivation", "hypoactivation", "dissociation"], besoins: ["orienter", "sens"], protection: [], canaux: ["visuel", "tactile", "auditif"], duree: "30s", materiel: null,
    tags: ["vue", "audition", "odorat"],
    objectif: "Chercher le neutre plutôt que le positif, pour observer l'environnement sans pression de ressentir quelque chose de précis.",
    etapes: ["Quelle est la météo concrète de l'endroit où vous êtes ? Observez la lumière, la température, l'air, les sons, les odeurs.", "Quelle est la chose la plus neutre que vous remarquez ?"],
    precaution: null, sensible: [] },
  { id: "reduire-le-monde", titre: "Réduire le monde d'un cran", etats: ["hyperactivation"], besoins: ["appuis", "contenir"], protection: [], canaux: ["moteur", "tactile"], duree: "30s", materiel: null,
    tags: ["appuis", "choix"],
    objectif: "Diminuer légèrement la charge sensorielle, sans chercher à tout régler d'un coup.",
    etapes: ["Vous n'avez pas besoin de tout régler. Cherchez simplement ce qui pourrait diminuer la charge de 5 % : diminuer légèrement la lumière, couper une notification, s'éloigner d'un bruit, desserrer un vêtement, poser un objet, fermer une porte."],
    precaution: null, sensible: [] },
  { id: "endroit-le-moins-mauvais", titre: "L'endroit le moins mauvais", etats: ["hyperactivation", "mixte"], besoins: ["appuis", "mouvement"], protection: [], canaux: ["moteur", "visuel"], duree: "30s", materiel: null,
    tags: ["orientation_exterieure", "choix"],
    objectif: "Chercher un endroit un peu plus supportable, sans viser la perfection.",
    etapes: ["Sans chercher l'endroit parfait, regardez autour de vous. Quel endroit semble 5 % plus facile que les autres ? (une chaise, une fenêtre, dos contre un mur, plus loin d'une personne, dehors…)", "Pouvez-vous vous en rapprocher légèrement ?"],
    precaution: null, sensible: ["mouvement"] },
  { id: "dix-secondes-inutiles", titre: "Les dix secondes inutiles", etats: ["hyperactivation", "tolerance"], besoins: ["mental", "limites"], protection: ["fawn"], canaux: ["cognitif"], duree: "30s", materiel: null,
    tags: ["choix", "rythme"],
    objectif: "Se donner un très court répit avant de devoir décider ou répondre à quelqu'un.",
    etapes: ["Pendant dix secondes, vous n'avez aucune décision à prendre.", "Puis : avez-vous besoin de dix secondes de plus ? (oui / non / je ne sais pas)"],
    precaution: null, sensible: [] },
  { id: "bouton-volume", titre: "Le bouton volume", etats: ["hypoactivation"], besoins: ["mouvement", "choix"], protection: [], canaux: ["cognitif", "moteur"], duree: "30s", materiel: null,
    tags: ["proprioception", "choix"],
    objectif: "Chercher une toute petite augmentation d'énergie, plutôt qu'un grand changement.",
    etapes: ["Si votre niveau d'énergie avait un bouton de volume, où serait-il maintenant ?", "Il ne s'agit pas de passer de 1 à 10 : serait-il possible de passer de 1 à 1,5 ?", "Choisissez une micro-action correspondant à ce tout petit mouvement de curseur."],
    precaution: null, sensible: [] },
  { id: "rapide-et-lent", titre: "Une chose rapide, une chose lente", etats: ["mixte"], besoins: ["orienter"], protection: [], canaux: ["visuel"], duree: "30s", materiel: null,
    tags: ["vue", "rythme"],
    objectif: "Donner une place aux deux rythmes qui peuvent coexister dans un état mixte.",
    etapes: ["Cherchez autour de vous une chose qui bouge rapidement.", "Puis cherchez une chose immobile ou très lente.", "Alternez doucement le regard entre les deux."],
    precaution: null, sensible: [] },
  { id: "corps-dit-deux-choses", titre: "Mon corps dit deux choses", etats: ["mixte"], besoins: ["corps"], protection: [], canaux: ["cognitif", "tactile"], duree: "2min", materiel: null,
    tags: ["proprioception", "langage"],
    objectif: "Reconnaître que plusieurs états peuvent coexister, sans avoir à en choisir un seul.",
    etapes: ["Complétez deux colonnes : « Une partie de moi remarque… » et « Une autre partie de moi remarque… » — par exemple : « mon cœur va vite » / « mes jambes semblent lourdes ».", "Plusieurs états peuvent coexister — ce n'est pas contradictoire."],
    precaution: null, sensible: [] },
  { id: "chaud-froid-neutre", titre: "Chaud / froid / neutre", etats: ["mixte", "hyperactivation"], besoins: ["sens"], protection: [], canaux: ["tactile"], duree: "30s", materiel: null,
    tags: ["toucher"],
    objectif: "Explorer trois sensations de température très douces, en incluant le neutre.",
    etapes: ["Cherchez quelque chose de légèrement chaud, quelque chose de légèrement frais, puis quelque chose de neutre.", "Le neutre est tout aussi important que les deux autres."],
    precaution: "Pas de froid extrême ni de source de chaleur qui pourrait brûler — des températures très douces seulement.", sensible: [] },
  { id: "le-journaliste", titre: "Le journaliste", etats: ["dissociation"], besoins: ["dissocie", "orienter"], protection: [], canaux: ["cognitif"], duree: "2min", materiel: null,
    tags: ["langage", "orientation_exterieure"],
    objectif: "Revenir vers des faits concrets plutôt que vers le ressenti, dans un premier temps.",
    etapes: ["Imaginez que vous deviez transmettre les faits à quelqu'un qui n'est pas là : Où suis-je ? Quel jour sommes-nous ? Qu'est-ce qui se passe concrètement ? Qui est avec moi ? Quelle est la prochaine chose prévue ?"],
    precaution: "Cet exercice commence volontairement par les faits plutôt que par « comment vous sentez-vous ? ».", sensible: [] },
  { id: "jeu-des-erreurs", titre: "Le jeu des erreurs du présent", etats: ["dissociation"], besoins: ["dissocie"], protection: [], canaux: ["cognitif"], duree: "2min", materiel: null,
    tags: ["jeu", "humour"],
    objectif: "Soutenir l'orientation temporelle sous une forme légère et facultative.",
    etapes: ["Une phrase volontairement absurde : « Nous sommes en 1997, vous êtes dans une gare et il neige dans la pièce. »", "Qu'est-ce qui ne correspond pas à la réalité actuelle ?"],
    precaution: "Exercice facultatif, à proposer seulement si un ton un peu ludique vous convient aujourd'hui.", sensible: [] },
  { id: "meteo-impossible", titre: "Fabriquer une météo impossible", etats: ["tolerance", "hyperactivation"], besoins: ["douceur", "mental"], protection: [], canaux: ["imaginatif", "cognitif"], duree: "2min", materiel: null,
    tags: ["creativite", "humour", "imagination"],
    objectif: "Mobiliser l'imagination et la flexibilité, sans passer par un lieu ressource ou un souvenir.",
    etapes: ["Inventez une météo qui n'existe pas : pluie tiède de confettis, brouillard à rayures, vent carré…", "Aucune bonne réponse : l'idée est simplement de jouer un instant avec l'impossible.", "Si imaginer ne vous convient pas aujourd'hui : décrivez plutôt, à voix haute ou mentalement, la météo réelle de l'endroit où vous êtes, avec un détail inventé en plus (« il fait gris, et il manquerait juste un peu de confettis »)."],
    precaution: null, sensible: ["imagination"] },
  { id: "gribouillage", titre: "Le gribouillage qui s'arrête quand je décide", etats: ["tolerance", "hyperactivation", "hypoactivation"], besoins: ["choix", "mouvement"], protection: [], canaux: ["cognitif", "moteur"], duree: "5min", materiel: "Une feuille et un stylo, ou une surface tactile.",
    tags: ["creativite", "ecriture", "choix"],
    objectif: "Entraîner le fait de commencer, interrompre, reprendre et terminer une action volontairement.",
    etapes: ["Commencez à dessiner où vous voulez, sans objectif esthétique.", "Arrêtez-vous quand vous voulez. Reprenez si vous voulez.", "Le dessin lui-même n'a aucune importance : ce qui compte, c'est de décider du début et de la fin."],
    precaution: null, sensible: ["ecrire"] },


  { id: "phrase-interdite", titre: "La phrase interdite", etats: ["hyperactivation"], besoins: ["mobiliser_fight", "mental"], protection: ["fight"], canaux: ["cognitif"], duree: "2min", materiel: "Optionnel : de quoi écrire.",
    tags: ["ecriture", "langage"],
    objectif: "Donner une forme à une colère ou une frustration, sans obligation de l'envoyer à qui que ce soit.",
    etapes: ["Écrivez la phrase que vous n'êtes pas obligé·e d'envoyer à personne — une phrase, trois mots, un titre, ou même une suite de signes.", "Puis décidez ce que vous voulez en faire : la garder, l'effacer, la modifier, ou ne pas décider maintenant."],
    precaution: null, sensible: ["ecrire"] },

  { id: "sortie-existe", titre: "La sortie existe", etats: ["hyperactivation"], besoins: ["mobiliser_flight", "orienter"], protection: ["flight"], canaux: ["visuel", "cognitif"], duree: "30s", materiel: null,
    tags: ["orientation_exterieure", "vue"],
    objectif: "Rappeler que des options de mouvement existent, sans obligation de les utiliser.",
    etapes: ["Où se trouve la sortie la plus proche ? Existe-t-il une autre sortie ?", "Où pourriez-vous vous déplacer si vous aviez besoin de plus d'espace ?", "Vous n'êtes pas obligé·e de partir — le but est seulement de savoir que des options existent."],
    precaution: null, sensible: [] },

  { id: "ce-qui-peut-choisir", titre: "Trouver ce qui peut encore choisir", etats: ["hypoactivation"], besoins: ["choix"], protection: ["freeze"], canaux: ["cognitif"], duree: "30s", materiel: null,
    tags: ["choix"],
    objectif: "Repérer un espace de choix minuscule quand beaucoup de choses semblent bloquées.",
    etapes: ["Beaucoup de choses semblent peut-être bloquées. Y a-t-il une chose minuscule que vous pouvez encore choisir ? Regarder à gauche ou à droite, garder l'écran ou le poser, bouger ou ne pas bouger, continuer ou arrêter.", "Vous venez de faire un choix — sans qu'il ait besoin d'être important."],
    precaution: null, sensible: [] },
  { id: "mouvement-prepare", titre: "Le mouvement préparé mais non réalisé", etats: ["hypoactivation"], besoins: ["mouvement"], protection: ["freeze"], canaux: ["cognitif", "moteur"], duree: "30s", materiel: null,
    tags: ["proprioception"],
    objectif: "Explorer un mouvement uniquement en pensée, sans obligation de l'exécuter.",
    etapes: ["Imaginez seulement que votre main pourrait bouger. Vous n'avez pas besoin de la bouger.", "Si elle voulait commencer, quel serait le premier millimètre du mouvement ?", "Si imaginer ne vous convient pas aujourd'hui : posez simplement votre attention sur une main, sans rien bouger, et remarquez juste ce qui s'y passe (chaleur, poids, contact avec une surface)."],
    precaution: null, sensible: ["imagination"] },
  { id: "oui-non-yeux", titre: "Oui / non avec les yeux", etats: ["hypoactivation"], besoins: ["choix"], protection: ["freeze"], canaux: ["visuel"], duree: "30s", materiel: null,
    tags: ["vue", "choix"],
    objectif: "Retrouver un moyen de répondre simple quand parler est difficile.",
    etapes: ["Choisissez deux directions du regard : gauche = oui, droite = non.", "Répondez ainsi à des questions simples : continuer ? faire une pause ? changer d'exercice ?"],
    precaution: null, sensible: [] },
  { id: "thermometre-oui", titre: "Le thermomètre du « oui »", etats: ["tolerance", "hyperactivation"], besoins: ["limites"], protection: ["fawn"], canaux: ["cognitif"], duree: "2min", materiel: null,
    tags: ["langage", "choix"],
    objectif: "Nuancer un oui ou un non qui semble parfois tout ou rien.",
    etapes: ["Vous pouvez faire cet exercice en pensant à quelque chose de précis, ou simplement pour explorer comment fonctionne, en général, votre curseur oui/non.", "Situez-vous sur une échelle : oui clair, plutôt oui, je ne sais pas, plutôt non, non clair.", "Qu'est-ce qui ferait bouger le curseur, dans un sens ou dans l'autre ?"],
    precaution: null, sensible: [] },

  { id: "regard-exterieur-alternatif", titre: "Le regard extérieur alternatif", etats: ["tolerance", "hyperactivation"], besoins: ["honte", "douceur"], protection: [], canaux: ["cognitif"], duree: "2min", materiel: null,
    tags: ["langage"],
    objectif: "Prendre un peu de recul sur un jugement sévère envers soi-même, sans forcer l'auto-compassion.",
    etapes: ["Si quelqu'un de suffisamment bienveillant connaissait seulement les faits, sans connaître vos jugements sur vous-même, que pourrait-il observer ? Les faits ; le contexte ; ce qui était difficile ; ce que vous essayiez de faire."],
    precaution: "Cet exercice ne cherche pas à imposer l'auto-compassion — seulement à élargir un peu le point de vue.", sensible: [] },
  { id: "tribunal-ferme", titre: "Le tribunal fermé pour aujourd'hui", etats: ["tolerance", "hyperactivation"], besoins: ["honte"], protection: [], canaux: ["cognitif", "ecriture"], duree: "2min", materiel: "Optionnel : de quoi écrire.",
    tags: ["ecriture", "langage"],
    objectif: "Suspendre temporairement le jugement sur soi-même, sans l'effacer ni le nier.",
    etapes: ["Pendant deux minutes, aucun verdict n'est autorisé.", "Vous pouvez seulement écrire : ce qui s'est passé ; ce qui a été ressenti ; ce qui manque comme information.", "Le tribunal peut rester fermé plus longtemps si vous le souhaitez."],
    precaution: null, sensible: ["ecrire"] },

  { id: "trois-facons", titre: "Trois façons", etats: ["tolerance"], besoins: ["choix"], protection: [], canaux: ["cognitif"], duree: "2min", materiel: null,
    tags: ["choix", "jeu"],
    objectif: "Réintroduire un peu de variété et de choix dans un geste répété machinalement.",
    etapes: ["Choisissez une action quotidienne (boire, s'asseoir…) et trouvez trois façons différentes de la faire.", "Par exemple, boire : dans un verre, une tasse, une bouteille. S'asseoir : sur une chaise, un lit, le sol."],
    precaution: null, sensible: [] },
  { id: "aujourdhui-je-decide", titre: "Aujourd'hui je décide", etats: ["tolerance", "hypoactivation"], besoins: ["choix"], protection: [], canaux: ["cognitif"], duree: "30s", materiel: null,
    tags: ["choix"],
    objectif: "Se rappeler qu'une petite décision reste entièrement la vôtre.",
    etapes: ["Choisissez une micro-décision : quelle tasse, quelle musique, quelle place, quelle lumière, dans quel ordre faire deux choses.", "Cette décision vous appartient."],
    precaution: null, sensible: [] },

  { id: "entre-deux-mondes", titre: "Entre deux mondes", etats: ["tolerance", "hyperactivation"], besoins: ["transition"], protection: [], canaux: ["cognitif", "moteur"], duree: "2min", materiel: null,
    tags: ["orientation_exterieure", "mouvement"],
    objectif: "Marquer une transition consciente après une séance, le travail, une visite ou un événement difficile.",
    etapes: ["Que quittez-vous ? Puis : vers quoi allez-vous maintenant ?", "Choisissez une action de transition : changer de vêtement, marcher, boire quelque chose, changer de musique, se laver les mains, ouvrir une fenêtre."],
    variantes: [
      { label: "Spécifiquement après une séance de thérapie", etapes: ["Une séance peut laisser des choses en mouvement, même après qu'elle soit terminée.", "Que quittez-vous en sortant de cette séance ? Vers quoi allez-vous maintenant ?", "Choisissez une action de transition : marcher quelques minutes, boire quelque chose, changer de pièce, écouter une musique différente."] },
    ],
    precaution: "Si quelque chose reste très inconfortable après une séance, il est possible d'en reparler avec votre thérapeute au rendez-vous suivant, ou plus tôt si besoin.", sensible: ["mouvement"] },
  { id: "sas-90-secondes", titre: "Le sas de 90 secondes", etats: ["tolerance", "hyperactivation"], besoins: ["transition"], protection: [], canaux: ["cognitif"], duree: "2min", materiel: "Un minuteur (téléphone, montre).",
    tags: ["rythme"],
    objectif: "S'accorder un court sas neutre entre deux moments, sans obligation de comprendre quoi que ce soit pendant ce temps.",
    etapes: ["Réglez un minuteur sur 90 secondes.", "Pendant ce temps : rien à comprendre. Vous pouvez regarder, marcher, rester immobile, ou écouter — comme vous préférez."],
    precaution: null, sensible: [] },

  { id: "a-qui-appartient-emotion", titre: "À qui appartient cette émotion ?", etats: ["tolerance", "hyperactivation"], besoins: ["limites"], protection: ["fawn"], canaux: ["cognitif"], duree: "2min", materiel: null,
    tags: ["langage", "limites"],
    objectif: "Distinguer ce qui vous appartient de ce que vous supposez ressenti par l'autre.",
    etapes: ["Si une situation récente, actuelle ou qui se répète vous vient à l'esprit, vous pouvez vous en servir pour cet exercice. Sinon, un exemple général fonctionne tout aussi bien.", "Créez trois zones : « Ce que je ressens » ; « Ce que j'imagine que l'autre ressent » ; « Ce que je ne peux pas savoir avec certitude ».", "Placez ce que vous vivez dans la zone qui convient, sans obligation de trancher tout de suite."],
    precaution: null, sensible: [] },
  { id: "personnage-qui-repond", titre: "Le personnage qui répond à ma place", etats: ["tolerance", "hyperactivation"], besoins: ["limites"], protection: ["fawn"], canaux: ["imaginatif", "cognitif"], duree: "2min", materiel: null,
    tags: ["imagination", "creativite"],
    objectif: "Emprunter, pour un instant, la capacité à prendre son temps d'un personnage imaginé.",
    etapes: ["Imaginez un personnage qui sait prendre son temps avant de répondre — réel, fictif, animal ou inventé.", "Que dirait-il à votre place ?", "Si imaginer un personnage ne vous convient pas aujourd'hui : pensez simplement à une personne réelle que vous connaissez et qui prend son temps avant de répondre. Que dirait-elle ?"],
    precaution: "Ce que dirait ce personnage n'est pas présenté comme « la bonne réponse », seulement comme une possibilité parmi d'autres.", sensible: ["imagination"] },
  { id: "bouton-non-consequence", titre: "Le bouton non, sans conséquence", etats: ["tolerance"], besoins: ["choix", "limites"], protection: [], canaux: ["cognitif"], duree: "30s", materiel: null,
    tags: ["choix"],
    objectif: "Vérifier concrètement que dire non à un exercice est possible et respecté.",
    etapes: ["Voulez-vous continuer cet exercice ? Oui / Non.", "Si vous choisissez Non : très bien. Vous pouvez simplement revenir à l'accueil — ce non est entièrement respecté, sans qu'il soit nécessaire de vous justifier."],
    precaution: null, sensible: [] },

  { id: "distance-juste", titre: "Dessiner la distance juste", etats: ["tolerance", "hyperactivation"], besoins: ["limites", "corps"], protection: [], canaux: ["imaginatif", "cognitif"], duree: "2min", materiel: null,
    tags: ["creativite", "limites"],
    objectif: "Ajuster, au moins en pensée, une distance qui semble correcte aujourd'hui.",
    etapes: ["Imaginez deux formes, ou dessinez-les si vous préférez.", "Déplacez-les mentalement ou sur le papier jusqu'à ce que la distance entre elles vous semble correcte aujourd'hui.", "Il n'y a pas d'interprétation automatique à en tirer — c'est votre seule observation qui compte."],
    precaution: null, sensible: [] },
  { id: "zone-tolerance-aujourdhui", titre: "Ma zone de tolérance aujourd'hui", etats: ["tolerance"], besoins: ["tolerance_renforcer"], protection: [], canaux: ["cognitif", "imaginatif"], duree: "5min", materiel: "Optionnel : de quoi dessiner.",
    tags: ["creativite"],
    objectif: "Représenter, même approximativement, l'état de sa zone de tolérance aujourd'hui.",
    etapes: ["Imaginez ou dessinez une bande représentant votre zone de tolérance.", "Élargissez-la, rétrécissez-la, colorez-la, ou ajoutez des zones floues, selon ce qui correspond à aujourd'hui.", "Votre zone n'a pas besoin d'être la même chaque jour."],
    precaution: null, sensible: ["ecrire"] },
  { id: "paysage-appuis", titre: "Construire un paysage d'appuis", etats: ["tolerance", "hyperactivation"], besoins: ["appuis", "lieu_ressource"], protection: [], canaux: ["imaginatif"], duree: "5min", materiel: null,
    tags: ["imagination", "creativite"],
    objectif: "Assembler mentalement une scène suffisamment soutenante, sans qu'elle ait besoin d'être belle ou calme.",
    etapes: ["Choisissez librement parmi : sol, mur, lumière, arbre, personne, animal, objet, distance, sortie.", "Construisez une scène avec les éléments qui vous semblent suffisamment soutenants aujourd'hui.", "Si imaginer une scène ne vous convient pas aujourd'hui : faites la même liste, mais à partir d'éléments réels et présents autour de vous maintenant (le sol sous vos pieds, un mur proche, la lumière de la pièce…)."],
    precaution: null, sensible: ["imagination"] },
  { id: "palette-du-jour", titre: "La palette du jour", etats: ["tolerance", "hyperactivation", "hypoactivation"], besoins: ["sens"], protection: [], canaux: ["visuel"], duree: "30s", materiel: null,
    tags: ["vue"],
    objectif: "Repérer les couleurs supportables aujourd'hui, pour enrichir vos préférences personnelles.",
    etapes: ["Quelles couleurs sont supportables à regarder maintenant ?", "Classez-les : agréable ; neutre ; trop intense ; je ne sais pas."],
    precaution: null, sensible: [] },
  { id: "objet-impossible", titre: "L'objet impossible", etats: ["tolerance", "hyperactivation"], besoins: ["douceur", "mental"], protection: [], canaux: ["cognitif", "imaginatif"], duree: "2min", materiel: null,
    tags: ["humour", "creativite", "jeu"],
    objectif: "Mobiliser un peu de légèreté et de flexibilité mentale, si l'humour vous convient aujourd'hui.",
    etapes: ["Regardez un objet ordinaire près de vous.", "Inventez-lui une fonction complètement absurde — par exemple : « cette tasse est une station d'atterrissage pour insectes fatigués »."],
    precaution: "Exercice facultatif, à proposer seulement si un ton léger vous convient aujourd'hui.", sensible: [] },

  { id: "son-le-plus-loin", titre: "Le son le plus loin", etats: ["hypoactivation", "dissociation"], besoins: ["sens", "orienter"], protection: [], canaux: ["auditif"], duree: "30s", materiel: null,
    tags: ["audition"],
    objectif: "Explorer l'espace sonore autour de soi, du plus loin au plus proche.",
    etapes: ["Quel est le son le plus éloigné que vous percevez ?", "Puis le plus proche ?", "Puis un son entre les deux ?"],
    precaution: null, sensible: [] },
  { id: "rythme-choisi", titre: "Le rythme choisi", etats: ["hyperactivation", "hypoactivation"], besoins: ["mouvement", "sens"], protection: [], canaux: ["moteur", "auditif"], duree: "2min", materiel: "Optionnel : un objet à tapoter.",
    tags: ["rythme", "audition"],
    objectif: "Retrouver un sentiment de contrôle à travers un rythme simple.",
    etapes: ["Créez un rythme avec vos doigts, vos pieds, un objet, ou un son.", "Choisissez ensuite : accélérer, ralentir, ou arrêter.", "Le cœur de l'exercice est que vous décidez du rythme, à chaque instant."],
    precaution: null, sensible: ["mouvement"] },
  { id: "bande-son-du-lieu", titre: "La bande-son du lieu", etats: ["tolerance", "dissociation"], besoins: ["orienter", "sens"], protection: [], canaux: ["auditif"], duree: "30s", materiel: null,
    tags: ["audition"],
    objectif: "Observer les sons de l'environnement sans chercher à les changer.",
    etapes: ["Si le lieu où vous êtes avait une bande-son, quels sons en feraient partie ?", "Vous n'avez pas besoin de les modifier — seulement de les remarquer."],
    precaution: null, sensible: [] },

  { id: "besoin-de-lautre", titre: "De quoi ai-je besoin de l'autre ?", etats: ["tolerance", "hyperactivation", "hypoactivation"], besoins: ["lien"], protection: [], canaux: ["relationnel"], duree: "2min", materiel: null,
    tags: ["relation", "langage"],
    objectif: "Clarifier, pour vous-même d'abord, ce qui aiderait dans le contact avec une autre personne.",
    etapes: ["Choisissez parmi : qu'il/elle parle ; qu'il/elle ne parle pas ; qu'il/elle reste proche ; qu'il/elle s'éloigne ; qu'il/elle m'aide concrètement ; qu'il/elle m'écoute ; qu'il/elle ne me touche pas ; je ne sais pas.", "Vous pouvez ensuite formuler : « Là, ce qui m'aiderait le plus serait… »"],
    precaution: null, sensible: [] },

  { id: "figure-soutenante", titre: "Une présence qui pourrait soutenir", etats: ["tolerance", "hyperactivation"], besoins: ["lieu_ressource", "douceur"], protection: [], canaux: ["imaginatif", "cognitif"], duree: "5min", materiel: null,
    tags: ["imagination"],
    objectif: "Explorer, si cela vous convient, l'idée d'une présence soutenante à laquelle revenir.",
    etapes: ["Vérifiez d'abord si l'imagination vous convient aujourd'hui. Si non, vous pouvez penser directement à une personne réelle, un animal, ou un objet qui représente pour vous une présence rassurante.", "Pensez à une présence qui pourrait sembler un peu soutenante : une personne réelle, un personnage, un animal, une figure qui a du sens pour vous, ou une présence inventée.", "Cette présence n'a pas besoin d'être parfaite ni de tout résoudre. Que ferait-elle ou dirait-elle, simplement, si elle était là maintenant ?", "Vous pouvez associer cette présence à une posture, un geste, une phrase ou une image, pour pouvoir y revenir plus facilement."],
    precaution: "Certaines personnes ne trouvent aucune présence soutenante, et ce n'est pas un problème — vous pouvez choisir un objet ou un lieu à la place. Si cet exercice augmente la détresse, mieux vaut s'arrêter et revenir à un exercice plus concret et sensoriel.", sensible: ["imagination"] },
  { id: "cercle-des-ressources", titre: "Le cercle des ressources", etats: ["tolerance"], besoins: ["tolerance_renforcer", "lieu_ressource"], protection: [], canaux: ["cognitif", "imaginatif"], duree: "5min", materiel: "Optionnel : de quoi dessiner.",
    tags: ["creativite"],
    objectif: "Rassembler progressivement, dans un même espace, ce qui peut représenter un appui pour vous.",
    etapes: ["Imaginez ou dessinez un cercle autour de vous.", "Placez-y, un par un, ce qui pourrait représenter un appui : une personne, un animal, un lieu, un objet, une phrase, une qualité que vous reconnaissez en vous.", "Un seul élément suffit pour commencer — vous n'avez pas besoin de le remplir aujourd'hui.", "Vous pouvez consulter ce cercle à tout moment, et le modifier au fil du temps."],
    precaution: null, sensible: ["ecrire"] },

  { id: "non-progressif", titre: "Le non progressif", etats: ["tolerance", "hyperactivation"], besoins: ["limites"], protection: ["fawn"], canaux: ["cognitif", "relationnel"], duree: "2min", materiel: null,
    tags: ["langage", "limites"],
    objectif: "Trouver une façon de dire non qui soit accessible aujourd'hui, sans viser la version la plus directe d'emblée.",
    etapes: ["Dire non directement n'est pas toujours facile tout de suite. Vous pouvez commencer par une version plus douce : « Je ne suis pas sûr·e, laisse-moi y réfléchir. »", "Si cela vous convient, une version plus claire : « Non, je ne peux pas. »", "Les deux versions sont valables — choisissez celle qui vous semble accessible aujourd'hui."],
    precaution: "Cet exercice n'a pas pour but de vous encourager à dire non dans une situation où cela pourrait ne pas être sûr. Si vous n'êtes pas certain·e d'être en sécurité, la priorité reste votre sécurité, pas l'affirmation d'une limite.", sensible: [] },

  { id: "avant-rendez-vous-difficile", titre: "Se préparer avant un moment difficile", etats: ["tolerance", "hyperactivation"], besoins: ["transition", "limites"], protection: [], canaux: ["cognitif"], duree: "5min", materiel: null,
    tags: ["langage"],
    objectif: "Anticiper un peu ce qui pourrait être soutenant avant un rendez-vous ou une situation redoutée.",
    etapes: ["Qu'est-ce qui pourrait être difficile dans ce moment à venir ?", "De quoi auriez-vous besoin pour vous sentir un peu plus soutenu·e : une personne prévenue, une phrase préparée, une limite de temps, une sortie possible ?", "Quelle est une phrase ou une action que vous pourriez utiliser si cela devient difficile pendant ce moment ?"],
    precaution: null, sensible: [] },

  { id: "heure-fermeture-ruminations", titre: "Une heure de fermeture pour les ruminations", etats: ["tolerance", "hyperactivation"], besoins: ["mental"], protection: [], canaux: ["cognitif"], duree: "2min", materiel: null,
    tags: ["langage"],
    objectif: "Poser une limite horaire souple face à des pensées qui reviennent en boucle.",
    etapes: ["Choisissez une heure de « fermeture » pour les ruminations d'aujourd'hui — par exemple 21h.", "Si une pensée revient après cette heure, vous pouvez simplement noter : « Reprise demain, à l'heure d'ouverture. »", "Ce n'est pas toujours facile à tenir, mais poser une limite horaire peut aider à retrouver un peu de structure."],
    precaution: null, sensible: [] },

  { id: "ou-etait-mon-attention", titre: "Où était mon attention ?", etats: ["tolerance", "hyperactivation"], besoins: ["limites"], protection: ["fawn"], canaux: ["cognitif", "relationnel"], duree: "2min", materiel: null,
    tags: ["langage", "limites"],
    objectif: "Observer où votre attention s'est portée pendant ou juste après un échange, sans chercher à expliquer ni à corriger ce qui s'est passé.",
    etapes: [
      "Après un échange, notre attention peut rester tournée vers nous, se déplacer fortement vers l'autre, circuler entre les deux, ou devenir difficile à situer. Il n'y a pas de bonne réponse à trouver ici. Il s'agit seulement d'observer.",
      "Pensez, si vous le souhaitez, à un échange récent ou à une interaction qui vient d'avoir lieu. Il n'est pas nécessaire de choisir une situation difficile ni de raconter ce qui s'est passé. Vous pouvez aussi arrêter ici si aucun échange ne vous semble suffisamment supportable à évoquer.",
      "Pendant ou juste après cet échange, où votre attention semblait-elle aller le plus ? Vers ce que je ressentais ou voulais, moi ; vers ce que l'autre ressentait, voulait ou attendait ; vers les deux ; cela changeait d'un moment à l'autre ; ou je ne sais pas.",
      "Facultatif : avez-vous remarqué, à un moment ou un autre, une envie ou une urgence d'apaiser, de rassurer, de satisfaire l'autre ou d'éviter une réaction ? Oui, non, ou je ne sais pas.",
      "Vous n'avez rien à conclure ni à changer maintenant. Le simple fait de remarquer où allait votre attention peut déjà être une information.",
    ],
    precaution: "Si penser à un échange augmente nettement votre activation, votre confusion ou votre sentiment d'insécurité, vous pouvez arrêter l'exercice et revenir à quelque chose de plus concret dans le présent : regarder autour de vous, sentir un support stable ou choisir un exercice d'orientation.",
    sensible: [] },
];

/* ---------------------------------------------------------------
   CONTENU — Réponses de protection Fight / Flight / Freeze / Fawn
--------------------------------------------------------------- */
const FFFF_INFO = [
  {
    id: "fight",
    label: "Fight — lutter / se défendre",
    color: "terracotta",
    desc: "Le corps se prépare à faire face, à repousser, à se défendre, à reprendre du contrôle.",
    signes: ["Colère", "Tension musculaire", "Mâchoire serrée", "Besoin d'avoir raison", "Envie de crier", "Irritabilité", "Sentiment d'injustice très fort"],
    phrase: "Cette réaction peut être une tentative du système nerveux pour restaurer une impression de puissance ou de protection.",
  },
  {
    id: "flight",
    label: "Flight — fuir / éviter",
    color: "blue",
    desc: "Le corps cherche à s'éloigner de ce qui est perçu comme menaçant, physiquement ou mentalement.",
    signes: ["Envie de partir", "Agitation", "Difficulté à rester en place", "Évitement", "Besoin de s'occuper sans arrêt", "Pensées rapides", "Anticipation"],
    phrase: "Cette réaction peut être une tentative du système nerveux pour retrouver de la distance et de la sécurité.",
  },
  {
    id: "freeze",
    label: "Freeze — se figer / se bloquer",
    color: "stone",
    desc: "Le corps se met en pause. Il peut devenir difficile de parler, de bouger, de choisir ou de penser clairement.",
    signes: ["Sidération", "Corps figé", "Silence impossible à rompre", "Regard fixe", "Temps ralenti", "Confusion", "Déconnexion partielle"],
    phrase: "Cette réaction n'est pas un manque de volonté. Le système nerveux peut figer l'action quand il ne trouve pas d'issue immédiate.",
  },
  {
    id: "fawn",
    label: "Fawn — s'adapter / apaiser l'autre",
    color: "sage",
    desc: "Le système cherche à préserver le lien ou à éviter le danger en s'adaptant fortement à l'autre, parfois au détriment de ses propres besoins.",
    signes: ["Dire oui alors qu'on pense non", "S'excuser excessivement", "Minimiser ce qu'on ressent", "Chercher à calmer l'autre à tout prix", "Éviter le conflit", "Perdre l'accès à ses propres limites"],
    phrase: "Cette réaction peut être une stratégie de protection, surtout lorsque le lien ou l'approbation de l'autre ont semblé nécessaires pour être en sécurité.",
  },
];

const FFFF_CHECKIN_OPTIONS = [
  { id: "fight", label: "Je me défends / je lutte" },
  { id: "flight", label: "J'ai envie de fuir ou d'éviter" },
  { id: "freeze", label: "Je me fige" },
  { id: "fawn", label: "Je cherche à apaiser ou satisfaire l'autre" },
  { id: "plusieurs", label: "Plusieurs à la fois" },
  { id: "ne_sait_pas", label: "Je ne sais pas" },
  { id: "non_renseigne", label: "Je préfère ne pas répondre" },
];

/* ---------------------------------------------------------------
   CONTENU — Fiches de psychoéducation (8)
--------------------------------------------------------------- */
const PSYCHOED_FICHES = [
  {
    titre: "Qu'est-ce que la régulation émotionnelle ?",
    paragraphes: [
      "Réguler une émotion ne veut pas dire la supprimer, l'effacer ou faire comme si elle n'existait pas. Cela signifie retrouver progressivement une capacité à la traverser, sans être totalement submergé·e par elle.",
      "Concrètement, cela peut vouloir dire rester en lien avec ce qui se passe dans votre corps, avec vos pensées, et avec ce qui vous entoure, même quand l'émotion est intense. Une émotion « régulée » n'est pas une émotion qui a disparu : c'est une émotion qui reste vivable, qui laisse encore un peu de place pour réfléchir, choisir, ou demander de l'aide si besoin.",
      "Ce n'est pas un état fixe. On peut se sentir bien régulé·e à un moment, puis débordé·e l'instant d'après, puis revenir vers plus de stabilité un peu plus tard. Ces allers-retours sont normaux. Ils ne sont pas un échec.",
    ],
  },
  {
    titre: "Pourquoi mon corps réagit-il aussi fort ?",
    paragraphes: [
      "Le corps peut réagir très vite lorsqu'il perçoit une menace, parfois avant même que vous ayez eu le temps de comprendre ce qui se passe. C'est un mécanisme de protection ancien, qui n'attend pas toujours que la pensée ait fini son travail pour agir.",
      "Parfois, cette menace est bien réelle et actuelle. Parfois, elle réactive une mémoire ancienne : une situation présente peut ressembler, dans ce qu'elle déclenche dans le corps, à quelque chose de plus ancien et de difficile. Dans les deux cas, la réaction du corps est bien réelle, même si son origine n'est pas toujours évidente sur le moment.",
      "Ce n'est ni un choix, ni un manque de contrôle, ni une exagération. C'est une réaction automatique. Elle peut évoluer avec le temps, en particulier si elle est accompagnée, notamment par un professionnel formé à ces questions.",
    ],
  },
  {
    titre: "Hyperactivation et hypoactivation",
    paragraphes: [
      "Face à une émotion intense, le système nerveux peut prendre deux grandes directions, parfois même successivement.",
      "Certaines réactions vont vers l'accélération : agitation, cœur qui bat plus vite, pensées rapides, panique, colère, envie de fuir ou de se défendre. C'est ce qu'on appelle l'hyperactivation. D'autres réactions vont au contraire vers le ralentissement : fatigue soudaine, sensation de vide, brouillard mental, figement, impression d'être coupé·e de soi ou des autres. C'est l'hypoactivation.",
      "Ce sont deux grandes manières, très différentes en apparence, pour le système nerveux de tenter de nous protéger quand il perçoit qu'il y a trop à gérer. Personne ne réagit toujours de la même façon : on peut basculer de l'une à l'autre selon les situations, les périodes, ou même au cours d'une même journée.",
    ],
  },
  {
    titre: "La stabilisation",
    paragraphes: [
      "La stabilisation correspond à l'ensemble des outils qui peuvent aider à retrouver un peu de sécurité, d'ancrage, de présence ou de choix, quand une émotion ou une réaction du corps devient difficile à traverser.",
      "Elle ne consiste pas à nier ce qui est difficile, ni à forcer un retour au calme. Il s'agit plutôt d'aider le système nerveux à ne pas rester seul avec une intensité trop forte, en lui proposant un point d'appui : un contact, un repère sensoriel, un mouvement, une présence.",
      "La stabilisation n'est pas une fin en soi et ne remplace pas un travail thérapeutique de fond. Elle peut simplement offrir un peu plus d'espace, ici et maintenant, pour respirer, réfléchir ou demander de l'aide.",
    ],
  },
  {
    titre: "Pourquoi les exercices ne fonctionnent pas toujours ?",
    paragraphes: [
      "Le système nerveux ne réagit pas sur commande. Un exercice peut aider beaucoup un jour, un peu un autre jour, et ne rien changer une troisième fois. Ce n'est pas un échec, ni de votre part, ni de la part de l'exercice.",
      "Plusieurs choses peuvent expliquer cela : le niveau de fatigue, le contexte, l'intensité de ce qui est traversé, ou simplement le fait qu'un même outil ne convient pas à tout le monde ni à tout moment.",
      "Si un exercice ne vous aide pas, vous pouvez en essayer un autre, revenir plus tard, ou choisir de ne rien faire de particulier sur le moment. Il peut aussi être utile d'en parler avec un professionnel, qui pourra vous aider à ajuster ce qui vous convient.",
    ],
  },
  {
    titre: "Créer sa boîte à outils personnelle",
    paragraphes: [
      "Chaque personne peut repérer, petit à petit, ce qui l'aide réellement — et cela ne ressemble jamais tout à fait à ce qui aide quelqu'un d'autre.",
      "Cela peut passer par le mouvement, le contact avec une surface ou une texture, la respiration observée sans contrainte, le lien avec une personne de confiance, la créativité, le contact avec la nature, l'écriture, la musique, le silence, la chaleur, le froid, ou encore la présence d'un animal.",
      "Construire sa boîte à outils, c'est accepter d'essayer, de garder ce qui aide un peu, de laisser de côté ce qui n'aide pas, et de continuer à l'ajuster au fil du temps. Rien n'a besoin d'être trouvé une fois pour toutes.",
    ],
  },
  {
    titre: "Comprendre les réponses Fight, Flight, Freeze, Fawn",
    paragraphes: [
      "Face à une menace réelle ou perçue, le système nerveux peut déclencher automatiquement l'une de ces réponses : lutter (Fight), fuir (Flight), se figer (Freeze), ou s'adapter à l'autre pour préserver le lien (Fawn).",
      "Ces réponses ne sont pas choisies consciemment, et elles ne disent rien de la valeur ou de la personnalité de quelqu'un. Elles ont une fonction : aider à survivre à une situation perçue comme dangereuse, ou à préserver un lien qui semblait nécessaire à la sécurité.",
      "Ces réponses ne sont pas des défauts de personnalité. Elles sont des réponses de protection, apprises souvent très tôt. Les reconnaître — sans les juger — peut aider, petit à petit, à retrouver un peu plus de choix face à ce qui se déclenche automatiquement.",
    ],
  },
  {
    titre: "Pourquoi je cherche parfois à apaiser l'autre ?",
    paragraphes: [
      "Certaines personnes ont appris, parfois très tôt dans leur histoire, que préserver le lien, éviter le conflit ou anticiper les besoins de l'autre était une manière de rester en sécurité. C'est ce qu'on appelle la réponse Fawn.",
      "Cette stratégie a souvent été utile, à un moment donné, dans un contexte particulier. Elle a pu permettre d'éviter une réaction difficile, de garder un lien important, ou simplement de traverser une situation qui semblait risquée.",
      "Elle peut cependant devenir coûteuse lorsqu'elle se répète dans des contextes où elle n'est plus nécessaire, et qu'elle empêche de sentir ses propres limites, ses propres besoins, ou son propre « non ». Le reconnaître n'est pas un jugement : c'est une porte d'entrée possible vers un peu plus de choix.",
    ],
  },
];

const CRISIS_EXERCISE = {
  id: "crise-court", titre: "Un tout petit exercice d'orientation",
  etats: [], besoins: ["orienter"], protection: [], canaux: ["visuel"], duree: "30s", materiel: null,
  objectif: "Un point d'appui très simple, pour tout de suite.",
  etapes: ["Nommez juste 3 choses que vous voyez autour de vous, là, maintenant.", "Rien d'autre à faire."],
  precaution: null, sensible: [],
};

const SENSATIONS = [
  "Cœur qui bat vite", "Respiration courte", "Boule dans la gorge", "Oppression",
  "Tensions musculaires", "Mâchoire serrée", "Chaleur", "Tremblements",
  "Agitation", "Envie de fuir", "Envie de pleurer", "Colère", "Peur",
  "Hypervigilance", "Sidération", "Fatigue intense", "Corps lourd",
  "Engourdissement", "Impression d'être loin", "Difficulté à penser",
  "Confusion", "Envie de disparaître", "Difficulté à dire non",
];

const NS_STATES = [
  {
    id: "tolerance",
    label: "Zone de tolérance",
    desc: "Je me sens globalement présent·e. Je peux penser, ressentir, parler, choisir. Il peut y avoir de l'émotion, mais elle reste traversable.",
    color: "sage",
  },
  {
    id: "hyperactivation",
    label: "Hyperactivation",
    desc: "Mon système est en alerte. Je peux me sentir anxieux·se, agité·e, en colère, paniqué·e, tendu·e ou débordé·e.",
    color: "terracotta",
  },
  {
    id: "hypoactivation",
    label: "Hypoactivation",
    desc: "Mon système semble se mettre en retrait. Je peux me sentir vide, absent·e, figé·e, fatigué·e, engourdi·e ou coupé·e de moi-même.",
    color: "blue",
  },
  {
    id: "mixte",
    label: "État mixte",
    desc: "Je me sens agité·e et coupé·e à la fois — par exemple le corps figé mais le cœur très rapide, ou une forte peur avec une sensation d'irréalité.",
    color: "stone",
  },
  {
    id: "dissociation",
    label: "Dissocié·e, irréel·le ou loin",
    desc: "Je ne sais plus très bien où je suis, tout paraît irréel, mon corps paraît loin, ou j'ai un trou dans le temps.",
    color: "stone",
  },
];

/* ---------------------------------------------------------------
   STORAGE HELPERS
--------------------------------------------------------------- */
async function loadJSON(key, fallback) {
  try {
    const res = await window.storage.get(key, false);
    return res ? JSON.parse(res.value) : fallback;
  } catch {
    return fallback;
  }
}
async function saveJSON(key, value) {
  try {
    await window.storage.set(key, JSON.stringify(value), false);
  } catch (e) {
    console.error("Erreur de sauvegarde", e);
  }
}

/* ---------------------------------------------------------------
   SMALL UI PRIMITIVES
--------------------------------------------------------------- */
function Btn({ children, onClick, variant = "primary", c, style, ...rest }) {
  const base = {
    padding: "14px 20px",
    borderRadius: 16,
    border: "none",
    fontFamily: fontBody,
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    width: "100%",
    textAlign: "left",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    transition: "transform .15s ease, opacity .15s ease",
  };
  const variants = {
    primary: { background: c.sage, color: c.text },
    secondary: { background: c.card, color: c.text, border: `1px solid ${c.border}` },
    soft: { background: c.blueSoft, color: c.text },
    warn: { background: c.terracottaSoft, color: c.text },
    ghost: { background: "transparent", color: c.textSoft, textAlign: "center", justifyContent: "center" },
  };
  return (
    <button
      onClick={onClick}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      style={{ ...base, ...variants[variant], ...style }}
      {...rest}
    >
      {children}
    </button>
  );
}

function Card({ children, c, style }) {
  return (
    <div
      style={{
        background: c.card,
        border: `1px solid ${c.border}`,
        borderRadius: 20,
        padding: 20,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function ScreenTitle({ children, c }) {
  return (
    <h1
      style={{
        fontFamily: fontDisplay,
        fontWeight: 500,
        fontSize: 26,
        color: c.text,
        margin: "4px 0 14px",
        lineHeight: 1.25,
      }}
    >
      {children}
    </h1>
  );
}

function ScrollToTopButton({ c }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Revenir en haut de la page"
      style={{
        position: "fixed",
        bottom: "calc(90px + env(safe-area-inset-bottom))",
        right: 18,
        width: 42,
        height: 42,
        borderRadius: "50%",
        background: c.card,
        border: `1px solid ${c.border}`,
        color: c.textSoft,
        fontSize: 17,
        cursor: "pointer",
        boxShadow: "0 4px 12px rgba(0,0,0,0.18)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 30,
        opacity: 0.95,
      }}
    >
      ↑
    </button>
  );
}

function BackRow({ onBack, c, label = "Retour", onHome }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0 12px" }}>
      <button
        onClick={onBack}
        style={{ background: "none", border: "none", color: c.textSoft, fontFamily: fontBody, fontSize: 13, cursor: "pointer", padding: 0 }}
      >
        ← {label}
      </button>
      {onHome && (
        <button
          onClick={onHome}
          style={{ background: "none", border: "none", color: c.textSoft, fontFamily: fontBody, fontSize: 12.5, cursor: "pointer", padding: 0, opacity: 0.8 }}
        >
          Accueil
        </button>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------
   MAIN APP
--------------------------------------------------------------- */
function freshFilters(avoid, overrides = {}) {
  return { etat: null, besoin: null, protection: null, canal: null, duree: null, tag: null, family: null, excludeRelational: false, avoid: avoid || [], ...overrides };
}

function raisonTexte(matchLevel, criteria) {
  if (!criteria || criteria.length === 0) return null;
  if (matchLevel === 3) return criteria.length === 1 ? `Correspond à : ${criteria[0].label}.` : "Correspond à l'ensemble de vos critères sélectionnés.";
  if (matchLevel === 2) return "Cette proposition correspond à plusieurs éléments de votre sélection, sans les couvrir tous.";
  if (matchLevel === 1) return `Proposé en lien avec : ${criteria[0].label}.`;
  return null;
}

export default function App() {
  const [theme, setTheme] = useState("light");
  const [screen, setScreen] = useState("home");
  const [history, setHistory] = useState([]); // nav stack
  const [loading, setLoading] = useState(true);

  // draft check-in state
  const [intensity, setIntensity] = useState(null);
  const [sensations, setSensations] = useState([]);
  const [nsState, setNsState] = useState(null);
  const [ffffState, setFfffState] = useState(null);
  const [etatExploration, setEtatExploration] = useState(null);

  // exercise flow
  const [activeExercise, setActiveExercise] = useState(null);
  const [activeExerciseRaison, setActiveExerciseRaison] = useState(null);
  const [exerciseSource, setExerciseSource] = useState(null); // 'library' | 'crisis'
  const [libraryFilters, setLibraryFilters] = useState({
    etat: null, besoin: null, protection: null, canal: null, duree: null, tag: null, family: null, excludeRelational: false, avoid: [],
  });
  const [avoidPrefs, setAvoidPrefs] = useState([]);
  const [exoFeedback, setExoFeedback] = useState({});
  const [customExercises, setCustomExercises] = useState([]);

  // persisted data
  const [safetyPlan, setSafetyPlan] = useState({
    signes: "", personnes: "", lieux: "", eviter: "", phrases: "", numeros: "",
  });
  const [entries, setEntries] = useState([]);
  const [exportChamps, setExportChamps] = useState({ dates: true, etats: true, intensites: true, protection: true, exercices: true, retours: true });
  const [exportPeriode, setExportPeriode] = useState("30");
  const [rdvPeriode, setRdvPeriode] = useState("30");
  const [rdvQuestion, setRdvQuestion] = useState("");
  const [inclureReperesJournal, setInclureReperesJournal] = useState(false);
  const [inclureJournalReperes, setInclureJournalReperes] = useState(false);
  const [zonePerso, setZonePerso] = useState({
    hyper: "", hypo: "", tolerance: "", signes: "",
  });
  const [personalInfo, setPersonalInfo] = useState({ nom: "", prenom: "", dateNaissance: "" });

  const c = palette[theme];

  useEffect(() => {
    (async () => {
      const t = await loadJSON("settings:theme", "light");
      const sp = await loadJSON("securite:plan", null);
      const en = await loadJSON("suivi:entries", []);
      const zp = await loadJSON("zone:personnalisation", null);
      const ap = await loadJSON("exo:avoid", []);
      const fb = await loadJSON("exo:feedback", {});
      const ce = await loadJSON("exo:custom", []);
      const pi = await loadJSON("profil:info", null);
      setTheme(t);
      if (sp) setSafetyPlan(sp);
      setEntries(en);
      if (zp) setZonePerso(zp);
      setAvoidPrefs(ap);
      setExoFeedback(fb);
      setCustomExercises(ce);
      if (pi) setPersonalInfo(pi);
      setLoading(false);
    })();
  }, []);

  const goTo = useCallback((s) => {
    setHistory((h) => [...h, screen]);
    setScreen(s);
  }, [screen]);

  const goBackHome = useCallback(() => {
    setHistory([]);
    setScreen("home");
    setIntensity(null);
    setSensations([]);
    setNsState(null);
    setFfffState(null);
    setEtatExploration(null);
    setActiveExercise(null);
    setActiveExerciseRaison(null);
    setLibraryFilters(freshFilters(avoidPrefs));
  }, [avoidPrefs]);

  const goBack = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) { setScreen("home"); return h; }
      const copy = [...h];
      const prev = copy.pop();
      setScreen(prev);
      return copy;
    });
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    saveJSON("settings:theme", next);
  };

  const updateSafetyPlan = (field, value) => {
    const next = { ...safetyPlan, [field]: value };
    setSafetyPlan(next);
  };
  const persistSafetyPlan = () => saveJSON("securite:plan", safetyPlan);

  const updateZonePerso = (field, value) => setZonePerso((prev) => ({ ...prev, [field]: value }));
  const persistZonePerso = () => saveJSON("zone:personnalisation", zonePerso);

  const updatePersonalInfo = (field, value) => setPersonalInfo((prev) => ({ ...prev, [field]: value }));
  const persistPersonalInfo = () => saveJSON("profil:info", personalInfo);

  const addEntry = async (entry) => {
    const next = [{ ...entry, date: new Date().toISOString() }, ...entries].slice(0, 200);
    setEntries(next);
    await saveJSON("suivi:entries", next);
  };

  const saveAvoidPrefs = async (next) => { setAvoidPrefs(next); await saveJSON("exo:avoid", next); };
  const saveExoFeedback = async (id, value) => {
    const next = { ...exoFeedback, [id]: value };
    setExoFeedback(next);
    await saveJSON("exo:feedback", next);
  };
  const saveCustomExercise = async (ex) => {
    const next = [...customExercises, ex];
    setCustomExercises(next);
    await saveJSON("exo:custom", next);
    goBackHome();
  };

  const wipeAllData = async () => {
    try {
      await window.storage.delete("securite:plan", false);
      await window.storage.delete("suivi:entries", false);
      await window.storage.delete("settings:theme", false);
      await window.storage.delete("zone:personnalisation", false);
      await window.storage.delete("exo:avoid", false);
      await window.storage.delete("exo:feedback", false);
      await window.storage.delete("exo:custom", false);
      await window.storage.delete("profil:info", false);
    } catch {}
    setSafetyPlan({ signes: "", personnes: "", lieux: "", eviter: "", phrases: "", numeros: "" });
    setEntries([]);
    setZonePerso({ hyper: "", hypo: "", tolerance: "", signes: "" });
    setAvoidPrefs([]);
    setExoFeedback({});
    setCustomExercises([]);
    setPersonalInfo({ nom: "", prenom: "", dateNaissance: "" });
    goBackHome();
  };

  if (loading) {
    return (
      <div style={{ background: c.bg, minHeight: 500, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fontBody, color: c.textSoft }}>
        Chargement…
      </div>
    );
  }

  return (
    <div style={{ background: c.bg, minHeight: 620, fontFamily: fontBody, transition: "background .3s" }}>
      <div style={{
        maxWidth: 480, margin: "0 auto", padding: "22px 18px 0", position: "relative",
        paddingBottom: "calc(22px + 54px + 24px + env(safe-area-inset-bottom))",
      }}>

        {screen === "home" && <Home c={c} theme={theme} toggleTheme={toggleTheme} goTo={goTo} prenom={personalInfo.prenom} />}

        {screen === "checkin-state" && (
          <CheckinState c={c} onBack={goBackHome} value={nsState}
            onSelect={(s) => { setNsState(s); setEtatExploration(null); goTo("checkin-intensity"); }}
            onUnknown={() => goTo("checkin-state-explore")} />
        )}

        {screen === "checkin-state-explore" && (
          <CheckinStateExplore c={c} onBack={() => goTo("checkin-state")}
            onSelect={(reponse) => { setNsState(null); setEtatExploration(reponse); goTo("checkin-intensity"); }} />
        )}

        {screen === "checkin-intensity" && (
          <CheckinIntensity c={c} onBack={() => goTo("checkin-state")} value={intensity}
            onSubmit={(v) => { setIntensity(v); if (v !== null && v >= 9) { goTo("crisis"); } else { goTo("checkin-sensations"); } }} />
        )}

        {screen === "checkin-sensations" && (
          <CheckinSensations c={c} onBack={goBack} sensations={sensations} setSensations={setSensations}
            onNext={() => goTo("checkin-protection")} />
        )}

        {screen === "checkin-protection" && (
          <CheckinFFFF c={c} onBack={goBack}
            onSelect={(f) => {
              setFfffState(f);
              if (["fight", "flight", "freeze", "fawn"].includes(f)) {
                goTo("checkin-protection-confirm");
              } else {
                addEntry({ type: "check-in", intensite: intensity, sensations, etat: nsState, etatExploration, ffff: f });
                goTo("checkin-done");
              }
            }} />
        )}

        {screen === "checkin-protection-confirm" && (
          <CheckinProtectionConfirm c={c} ffff={ffffState} onBack={() => goTo("checkin-protection")}
            onConfirm={(reponse) => {
              const ffffFinal = reponse === "non" ? null : ffffState;
              setFfffState(ffffFinal);
              addEntry({ type: "check-in", intensite: intensity, sensations, etat: nsState, etatExploration, ffff: ffffFinal, ffffConfirmation: reponse });
              goTo("checkin-done");
            }} />
        )}

        {screen === "checkin-done" && (
          <CheckinDone c={c} state={nsState} ffff={ffffState} intensity={intensity} goBackHome={goBackHome}
            onModify={() => goTo("checkin-state")}
            onExercises={() => {
              setExerciseSource("library");
              const ffffCat = ["fight", "flight", "freeze", "fawn"].includes(ffffState) ? ffffState : null;
              setLibraryFilters(freshFilters(avoidPrefs, { etat: nsState, protection: ffffCat }));
              goTo("library");
            }} />
        )}

        {screen === "crisis" && (
          <AideImmediate c={c} onBack={goBackHome}
            onDanger={() => goTo("aide-danger")}
            onPeur={() => goTo("aide-peur")}
            onDebord={() => goTo("aide-debord-q1")}
            onUrgence={() => goTo("urgence")}
          />
        )}

        {screen === "aide-danger" && <AideDanger c={c} onBack={goBack} />}

        {screen === "aide-peur" && (
          <AidePeur c={c} onBack={goBack} safetyPlan={safetyPlan} onContacts={() => goTo("safety")} />
        )}

        {screen === "aide-debord-q1" && (
          <AideDebordQ1 c={c} onBack={goBack}
            onOui={() => goTo("aide-debord-q2")}
            onNeSaitPas={() => goTo("aide-debord-q2")}
            onNon={() => goTo("aide-debord-nonsur")}
          />
        )}

        {screen === "aide-debord-nonsur" && (
          <AideDebordNonSur c={c} onBack={goBack}
            onAppeler={() => goTo("aide-danger")}
            onContacter={() => goTo("safety")}
            onNumeros={() => goTo("urgence")}
          />
        )}

        {screen === "aide-debord-q2" && (
          <AideDebordQ2 c={c} onBack={goBack}
            onChoix={(choix) => {
              const map = {
                regarder: "regard-explore", appui: "sentir-support",
                bouger: "plus-petit-mouvement", ecouter: "voix-qui-revient",
              };
              if (choix === "contacter") { goTo("safety"); return; }
              const exId = map[choix];
              const ex = exId ? EXERCISES.find((e) => e.id === exId) : CRISIS_EXERCISE;
              setActiveExercise(ex || CRISIS_EXERCISE);
              setExerciseSource("crisis");
              goTo("exercise");
            }} />
        )}

        {screen === "urgence" && <Urgence c={c} onBack={goBack} />}

        {screen === "library" && (
          <Library c={c} onBack={goBack}
            filters={libraryFilters} setFilters={setLibraryFilters}
            feedback={exoFeedback} customExercises={customExercises}
            onPick={(ex, matchLevel, criteria) => {
              setActiveExercise(ex);
              setActiveExerciseRaison(raisonTexte(matchLevel, criteria));
              goTo("exercise");
            }}
            onGoPreferences={() => goTo("preferences")}
            onGoCreate={() => goTo("exo-create")} />
        )}

        {screen === "preferences" && (
          <Preferences c={c} onBack={goBack} avoidPrefs={avoidPrefs} onSave={saveAvoidPrefs} />
        )}

        {screen === "exo-create" && (
          <CreateExercise c={c} onBack={goBack} onSave={saveCustomExercise} />
        )}

        {screen === "tolerance-zone" && (
          <ToleranceZone c={c} onBack={goBackHome} perso={zonePerso}
            onChange={updateZonePerso} onSave={persistZonePerso} />
        )}

        {screen === "protection" && (
          <Protection c={c} onBack={goBackHome}
            onExercises={(cat) => { setLibraryFilters(freshFilters(avoidPrefs, { protection: cat })); goTo("library"); }} />
        )}

        {screen === "psychoed" && <Psychoeducation c={c} onBack={goBackHome} />}

        {screen === "exercise" && activeExercise && (
          <Exercise c={c} exercise={activeExercise} raison={activeExerciseRaison}
            onStop={goBackHome}
            onRevenirListe={goBack}
            onEssayerAutreChose={() => goTo("library")}
            onFilterByTag={(type, value) => {
              setLibraryFilters(freshFilters(avoidPrefs, { [type]: value }));
              goTo("library");
            }}
            onFinish={(effet, remarque) => {
              addEntry({ type: "exercice", exercice: activeExercise.titre, effet, remarque, intensite: intensity, etat: nsState });
              saveExoFeedback(activeExercise.id, effet);
              goTo("exercise-done");
            }} />
        )}

        {screen === "exercise-done" && (
          <ExerciseDone c={c} goBackHome={goBackHome} onAnother={() => goTo("library")} />
        )}

        {screen === "safety" && (
          <SafetyPlan c={c} onBack={goBack} plan={safetyPlan} onChange={updateSafetyPlan} onSave={persistSafetyPlan}
            onGoExport={() => goTo("reperes-export")} />
        )}

        {screen === "nervous-system" && <NervousSystem c={c} onBack={goBackHome} />}

        {screen === "ce-qui-maide" && (
          <CeQuiMaide c={c} onBack={goBackHome}
            feedback={exoFeedback} customExercises={customExercises} entries={entries}
            onPick={(ex) => { setActiveExercise(ex); setActiveExerciseRaison(null); goTo("exercise"); }}
            onGoLibrary={() => goTo("library")} />
        )}

        {screen === "journal" && (
          <Journal c={c} onBack={goBackHome} entries={entries}
            onGoExport={() => goTo("journal-export")}
            onGoRdv={() => goTo("rdv-export")} />
        )}

        {screen === "journal-export" && (
          <JournalExportSelect c={c} onBack={goBack}
            champs={exportChamps} setChamps={setExportChamps}
            periode={exportPeriode} setPeriode={setExportPeriode}
            onNext={() => goTo("journal-export-preview")} />
        )}

        {screen === "journal-export-preview" && (
          <JournalExportPreview c={c} onBack={goBack}
            champs={exportChamps} periode={exportPeriode} entries={entries}
            safetyPlan={safetyPlan} inclureReperes={inclureReperesJournal} setInclureReperes={setInclureReperesJournal}
            onCreate={() => {
              const filtrees = entriesDansPeriode(entries, exportPeriode);
              const periodeLabel = PERIODES_JOURNAL.find((p) => p.id === exportPeriode)?.label || "";
              const doc = genererPdfJournal(filtrees, exportChamps, periodeLabel, personalInfo, inclureReperesJournal ? safetyPlan : null);
              telechargerOuPartagerPdf(doc, "mon-journal-de-suivi.pdf");
              goTo("journal");
            }}
            onCancel={() => goTo("journal")} />
        )}

        {screen === "rdv-export" && (
          <RdvExportSelect c={c} onBack={goBack}
            periode={rdvPeriode} setPeriode={setRdvPeriode}
            question={rdvQuestion} setQuestion={setRdvQuestion}
            onNext={() => goTo("rdv-export-preview")} />
        )}

        {screen === "rdv-export-preview" && (
          <RdvExportPreview c={c} onBack={goBack}
            periode={rdvPeriode} entries={entries} question={rdvQuestion}
            onCreate={() => {
              const filtrees = entriesDansPeriode(entries, rdvPeriode);
              const periodeLabel = PERIODES_JOURNAL.find((p) => p.id === rdvPeriode)?.label || "";
              const doc = genererPdfRendezVous(filtrees, periodeLabel, rdvQuestion, personalInfo);
              telechargerOuPartagerPdf(doc, "preparer-mon-rendez-vous.pdf");
              goTo("journal");
            }}
            onCancel={() => goTo("journal")} />
        )}

        {screen === "reperes-export" && (
          <ReperesExportPreview c={c} onBack={goBack}
            plan={safetyPlan} entries={entries} periode={exportPeriode} setPeriode={setExportPeriode}
            inclureJournal={inclureJournalReperes} setInclureJournal={setInclureJournalReperes}
            onCreate={() => {
              const filtrees = inclureJournalReperes ? entriesDansPeriode(entries, exportPeriode) : null;
              const periodeLabel = PERIODES_JOURNAL.find((p) => p.id === exportPeriode)?.label || "";
              const champsDefaut = { dates: true, etats: true, intensites: true, protection: true, exercices: true, retours: true };
              const doc = genererPdfReperes(safetyPlan, personalInfo, filtrees, inclureJournalReperes ? champsDefaut : null, periodeLabel);
              telechargerOuPartagerPdf(doc, "mes-reperes-de-securite.pdf");
              goTo("safety");
            }}
            onCancel={() => goTo("safety")} />
        )}

        {screen === "settings" && (
          <Settings c={c} theme={theme} toggleTheme={toggleTheme} onBack={goBackHome} onWipe={wipeAllData}
            personalInfo={personalInfo} onChangePersonalInfo={updatePersonalInfo} onSavePersonalInfo={persistPersonalInfo} />
        )}

        {/* Bouton flottant global — sauf sur l'écran crise lui-même */}
        {screen !== "crisis" && screen !== "home" && (
          <button
            onClick={() => goTo("crisis")}
            style={{
              position: "fixed",
              bottom: "calc(22px + env(safe-area-inset-bottom))",
              left: "50%",
              transform: "translateX(-50%)",
              maxWidth: 440,
              width: "calc(100% - 36px)",
              background: c.terracotta,
              color: "#fff",
              border: "none",
              borderRadius: 999,
              padding: "13px 18px",
              fontFamily: fontBody,
              fontWeight: 600,
              fontSize: 14,
              boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
              cursor: "pointer",
              zIndex: 20,
            }}
          >
            J'ai besoin d'aide maintenant
          </button>
        )}

        <ScrollToTopButton c={c} />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   SCREENS
--------------------------------------------------------------- */
function Home({ c, theme, toggleTheme, goTo, prenom }) {
  const prenomPropre = prenom && prenom.trim() ? prenom.trim() : "";
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={toggleTheme} style={{ background: "none", border: "none", color: c.textSoft, fontSize: 12, cursor: "pointer" }}>
          {theme === "light" ? "🌙 Mode sombre" : "☀️ Mode clair"}
        </button>
      </div>

      <div style={{ fontFamily: fontDisplay, fontSize: 30, color: c.text, marginTop: 8, marginBottom: 14, lineHeight: 1.3 }}>
        {prenomPropre ? `Bienvenue ${prenomPropre}` : "Bienvenue."}
      </div>
      <p style={{ color: c.textSoft, fontSize: 15, lineHeight: 1.6, marginBottom: 10 }}>
        Cette application peut vous aider à observer votre état intérieur, à mieux comprendre les réactions
        de votre système nerveux et à choisir un exercice de stabilisation adapté. Vous pouvez avancer à votre
        rythme et arrêter à tout moment.
      </p>

      <Card c={c} style={{ background: c.bgAlt, border: "none", marginBottom: 22 }}>
        <p style={{ color: c.textSoft, fontSize: 13, lineHeight: 1.6, margin: 0 }}>
          Cet outil ne remplace pas un accompagnement médical, psychologique ou psychiatrique. En cas de
          danger immédiat, contactez les services d'urgence ou une personne de confiance.
        </p>
      </Card>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 8 }}>
        <Btn c={c} variant="primary" onClick={() => goTo("checkin-state")}>
          Comment je me sens maintenant ? <span>→</span>
        </Btn>
        <p style={{ color: c.textSoft, fontSize: 12.5, margin: "-4px 2px 2px" }}>
          Observer mon état et trouver ce qui pourrait m'aider.
        </p>
        <Btn c={c} variant="soft" onClick={() => goTo("library")}>
          J'aimerais essayer quelque chose <span>→</span>
        </Btn>
        <p style={{ color: c.textSoft, fontSize: 12.5, margin: "-4px 2px 2px" }}>
          Accéder directement aux exercices.
        </p>
      </div>

      <div style={{ fontSize: 12, color: c.textSoft, textTransform: "uppercase", letterSpacing: 0.4, margin: "22px 2px 10px" }}>
        Comprendre
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 8 }}>
        <Btn c={c} variant="secondary" onClick={() => goTo("tolerance-zone")}>
          Ma zone de tolérance <span>→</span>
        </Btn>
        <Btn c={c} variant="secondary" onClick={() => goTo("nervous-system")}>
          Mon système nerveux <span>→</span>
        </Btn>
        <Btn c={c} variant="secondary" onClick={() => goTo("protection")}>
          Mes réponses de protection <span>→</span>
        </Btn>
        <Btn c={c} variant="secondary" onClick={() => goTo("psychoed")}>
          Psychoéducation <span>→</span>
        </Btn>
      </div>

      <div style={{ fontSize: 12, color: c.textSoft, textTransform: "uppercase", letterSpacing: 0.4, margin: "22px 2px 10px" }}>
        Mon espace
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Btn c={c} variant="secondary" onClick={() => goTo("safety")}>
          Mes repères de sécurité <span>→</span>
        </Btn>
        <Btn c={c} variant="secondary" onClick={() => goTo("ce-qui-maide")}>
          Ce qui m'aide <span>→</span>
        </Btn>
        <Btn c={c} variant="secondary" onClick={() => goTo("journal")}>
          Mon suivi personnel <span>→</span>
        </Btn>
        <Btn c={c} variant="ghost" onClick={() => goTo("settings")}>
          Réglages
        </Btn>
      </div>
      <p style={{ textAlign: "center", fontSize: 10.5, color: c.textSoft, opacity: 0.7, marginTop: 28 }}>
        {MENTION_PROPRIETE}
      </p>
    </div>
  );
}

function CheckinIntensity({ c, onBack, onSubmit, value }) {
  const [val, setVal] = useState(value ?? 5);
  const [dontKnow, setDontKnow] = useState(false);
  const anchors = [
    [0, "à peine perceptible"],
    [3, "présent, mais je garde mes capacités habituelles"],
    [6, "difficile, mais encore traversable"],
    [8, "très envahissant"],
    [10, "j'ai l'impression de ne plus pouvoir gérer cela seul·e"],
  ];
  return (
    <div>
      <BackRow c={c} onBack={onBack} label="Modifier mon état" />
      <ScreenTitle c={c}>À quel point cet état est-il présent maintenant ?</ScreenTitle>
      <p style={{ color: c.textSoft, fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
        Il n'y a pas de bonne réponse. Cette échelle sert seulement de repère pour vous.
      </p>

      {!dontKnow && (
        <>
          <div style={{ textAlign: "center", fontFamily: fontDisplay, fontSize: 56, color: c.text, marginBottom: 6 }}>
            {val}
          </div>
          <input
            type="range" min={0} max={10} value={val}
            onChange={(e) => setVal(Number(e.target.value))}
            style={{ width: "100%", accentColor: c.sage, marginBottom: 22 }}
          />

          <Card c={c} style={{ marginBottom: 24 }}>
            {anchors.map(([n, txt]) => (
              <div key={n} style={{ display: "flex", gap: 10, marginBottom: 8, fontSize: 13, color: c.textSoft }}>
                <span style={{ fontWeight: 700, color: c.text, minWidth: 24 }}>{n}</span>
                <span>{txt}</span>
              </div>
            ))}
          </Card>
        </>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {!dontKnow && <Btn c={c} variant="primary" onClick={() => onSubmit(val)}>Continuer <span>→</span></Btn>}
        <Btn c={c} variant={dontKnow ? "primary" : "secondary"} onClick={() => { setDontKnow(true); onSubmit(null); }}>
          Je ne sais pas l'évaluer
        </Btn>
      </div>
    </div>
  );
}

function CheckinSensations({ c, onBack, sensations, setSensations, onNext }) {
  const toggle = (s) =>
    setSensations((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  return (
    <div>
      <BackRow c={c} onBack={onBack} label="Modifier l'intensité" />
      <ScreenTitle c={c}>Qu'est-ce que vous remarquez ?</ScreenTitle>
      <p style={{ color: c.textSoft, fontSize: 15, lineHeight: 1.6, marginBottom: 18 }}>
        Dans votre corps, ou dans votre état intérieur. Choisissez ce qui résonne — il n'y a pas de bonne réponse.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 26 }}>
        {SENSATIONS.map((s) => {
          const on = sensations.includes(s);
          return (
            <button key={s} onClick={() => toggle(s)}
              style={{
                padding: "9px 14px", borderRadius: 999, fontSize: 13, cursor: "pointer",
                border: `1px solid ${on ? c.sage : c.border}`,
                background: on ? c.sageSoft : c.card, color: c.text,
              }}>
              {s}
            </button>
          );
        })}
      </div>
      <Btn c={c} variant="primary" onClick={onNext}>Continuer <span>→</span></Btn>
    </div>
  );
}

function CheckinState({ c, onBack, onSelect, onUnknown, value }) {
  return (
    <div>
      <BackRow c={c} onBack={onBack} label="Retour à l'accueil" />
      <ScreenTitle c={c}>Où en êtes-vous maintenant ?</ScreenTitle>
      <p style={{ color: c.textSoft, fontSize: 15, lineHeight: 1.6, marginBottom: 18 }}>
        Choisissez ce qui vous semble le plus proche de votre état en ce moment. Il n'est pas nécessaire d'être
        totalement certain·e. Vous pourrez modifier votre réponse.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {NS_STATES.map((s) => {
          const selected = value === s.id;
          return (
            <button key={s.id} onClick={() => onSelect(s.id)}
              style={{
                textAlign: "left", padding: 18, borderRadius: 18, cursor: "pointer",
                border: `2px solid ${selected ? c.sage : "transparent"}`, background: c[s.color + "Soft"],
              }}>
              <div style={{ fontWeight: 700, color: c.text, marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 13, color: c.textSoft, lineHeight: 1.5 }}>{s.desc}</div>
            </button>
          );
        })}
        <button onClick={onUnknown}
          style={{ textAlign: "left", padding: 18, borderRadius: 18, cursor: "pointer", border: `1px dashed ${c.border}`, background: "transparent" }}>
          <div style={{ fontWeight: 700, color: c.text, marginBottom: 4 }}>Je ne sais pas</div>
          <div style={{ fontSize: 13, color: c.textSoft }}>C'est difficile à identifier pour l'instant.</div>
        </button>
      </div>
    </div>
  );
}

const ETAT_EXPLORATION_OPTIONS = [
  { id: "energie", label: "Mon niveau d'énergie" },
  { id: "bouger", label: "Mon envie de bouger ou de rester immobile" },
  { id: "penser", label: "Ma capacité à penser" },
  { id: "corps", label: "Ce que je sens dans mon corps" },
  { id: "proximite", label: "Ma proximité avec ce qui m'entoure" },
  { id: "rien", label: "Rien de tout cela" },
  { id: "ne_sait_pas", label: "Je ne sais pas" },
];

function CheckinStateExplore({ c, onBack, onSelect }) {
  return (
    <div>
      <BackRow c={c} onBack={onBack} label="Modifier mon état" />
      <ScreenTitle c={c}>C'est parfois difficile de savoir ce qui se passe à l'intérieur.</ScreenTitle>
      <p style={{ color: c.textSoft, fontSize: 15, lineHeight: 1.6, marginBottom: 8 }}>
        Nous pouvons commencer autrement.
      </p>
      <p style={{ color: c.text, fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
        Que remarquez-vous le plus facilement maintenant ?
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {ETAT_EXPLORATION_OPTIONS.map((o) => (
          <Btn key={o.id} c={c} variant="secondary" onClick={() => onSelect(o.id)}>{o.label}</Btn>
        ))}
      </div>
    </div>
  );
}

function CheckinFFFF({ c, onBack, onSelect }) {
  return (
    <div>
      <BackRow c={c} onBack={onBack} label="Retour" />
      <ScreenTitle c={c}>Une réaction de protection, peut-être ?</ScreenTitle>
      <p style={{ color: c.textSoft, fontSize: 14, lineHeight: 1.6, marginBottom: 6 }}>
        Cette étape est facultative. Est-ce que vous reconnaissez une réaction de protection en ce moment ?
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
        {FFFF_CHECKIN_OPTIONS.map((o) => (
          <Btn key={o.id} c={c} variant="secondary" onClick={() => onSelect(o.id)}>{o.label}</Btn>
        ))}
      </div>
    </div>
  );
}

function CheckinProtectionConfirm({ c, ffff, onBack, onConfirm }) {
  const f = FFFF_INFO.find((x) => x.id === ffff);
  if (!f) return null;
  return (
    <div>
      <BackRow c={c} onBack={onBack} label="Modifier ma réponse" />
      <ScreenTitle c={c}>Une réponse de protection que vous reconnaissez peut-être</ScreenTitle>
      <Card c={c} style={{ background: c[f.color + "Soft"], border: "none", marginBottom: 14 }}>
        <div style={{ fontWeight: 700, color: c.text, marginBottom: 6 }}>{f.label}</div>
        <p style={{ margin: 0, fontSize: 13, color: c.textSoft, lineHeight: 1.6 }}>
          Cette réaction peut avoir eu du sens dans l'histoire de votre système de protection. Il ne s'agit pas
          de la juger ni de la faire disparaître à tout prix, mais de remarquer ce qui se passe et de voir ce qui
          pourrait vous aider maintenant.
        </p>
      </Card>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Btn c={c} variant="secondary" onClick={() => onConfirm("oui")}>Cela me correspond</Btn>
        <Btn c={c} variant="secondary" onClick={() => onConfirm("non")}>Cela ne me correspond pas</Btn>
        <Btn c={c} variant="secondary" onClick={() => onConfirm("ne_sait_pas")}>Je ne sais pas</Btn>
      </div>
    </div>
  );
}

function CheckinDone({ c, state, ffff, intensity, goBackHome, onModify, onExercises }) {
  const s = NS_STATES.find((x) => x.id === state);
  const f = FFFF_INFO.find((x) => x.id === ffff);
  return (
    <div>
      <ScreenTitle c={c}>Merci d'avoir pris ce temps.</ScreenTitle>
      <p style={{ color: c.textSoft, fontSize: 15, lineHeight: 1.6, marginBottom: 22 }}>
        Observer ce qui se passe est déjà une information. Il n'y a rien à réussir ici, et vous n'avez pas
        besoin d'être certain·e de vos réponses.
      </p>

      <div style={{ fontSize: 12.5, color: c.textSoft, textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 8 }}>
        Ce que vous avez repéré
      </div>

      <div style={{ fontSize: 12, color: c.textSoft, marginBottom: 6 }}>Votre état actuel</div>
      {s ? (
        <Card c={c} style={{ background: c[s.color + "Soft"], border: "none", marginBottom: 14 }}>
          <div style={{ fontWeight: 700, color: c.text, marginBottom: 4 }}>{s.label}</div>
          <p style={{ margin: 0, fontSize: 12.5, color: c.textSoft }}>
            Ce que vous avez sélectionné se rapproche actuellement de cet état.
          </p>
        </Card>
      ) : (
        <Card c={c} style={{ background: c.bgAlt, border: "none", marginBottom: 14 }}>
          <p style={{ margin: 0, fontSize: 13, color: c.textSoft, lineHeight: 1.6 }}>
            Ce n'était pas facile à identifier maintenant, et c'est tout à fait normal. Ce que vous avez remarqué
            reste une information utile.
          </p>
        </Card>
      )}

      {intensity !== null && intensity !== undefined && (
        <>
          <div style={{ fontSize: 12, color: c.textSoft, marginBottom: 6 }}>Intensité repérée</div>
          <Card c={c} style={{ marginBottom: 14 }}>
            <div style={{ fontWeight: 700, color: c.text }}>{intensity}/10</div>
          </Card>
        </>
      )}

      <Btn c={c} variant="ghost" onClick={onModify} style={{ marginBottom: 22 }}>Modifier mes réponses</Btn>

      {f && (
        <>
          <div style={{ fontSize: 12.5, color: c.textSoft, textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 8 }}>
            Une réponse de protection que vous reconnaissez peut-être
          </div>
          <Card c={c} style={{ background: c[f.color + "Soft"], border: "none", marginBottom: 24 }}>
            <div style={{ fontWeight: 700, color: c.text, marginBottom: 6 }}>{f.label}</div>
            <div style={{ fontSize: 13, color: c.textSoft, lineHeight: 1.6 }}>
              Cette réaction peut avoir du sens dans l'histoire de votre système de protection. L'objectif n'est
              pas de la juger, mais de voir ce qui pourrait vous aider maintenant.
            </div>
          </Card>
        </>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Btn c={c} variant="primary" onClick={onExercises}>Voir ce qui pourrait m'aider maintenant <span>→</span></Btn>
        <Btn c={c} variant="ghost" onClick={goBackHome}>Revenir à l'accueil</Btn>
      </div>
    </div>
  );
}

function TriageCard({ c, titre, sousTexte, onClick, variant = "soft" }) {
  const bg = variant === "warn" ? c.terracottaSoft : c.card;
  return (
    <button onClick={onClick} style={{
      textAlign: "left", cursor: "pointer", width: "100%", padding: 18, borderRadius: 18,
      border: `1px solid ${c.border}`, background: bg,
    }}>
      <div style={{ fontWeight: 700, color: c.text, marginBottom: 6, fontSize: 15.5 }}>{titre}</div>
      <div style={{ fontSize: 13, color: c.textSoft, lineHeight: 1.55 }}>{sousTexte}</div>
    </button>
  );
}

function TelButton({ c, label, num, display, big }) {
  return (
    <a href={`tel:${num}`} style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: big ? "18px 18px" : "14px 16px", borderRadius: 16, textDecoration: "none",
      border: `1px solid ${c.border}`, background: c.card,
    }}>
      <span style={{ color: c.text, fontSize: big ? 15.5 : 14.5, fontWeight: 600, paddingRight: 10 }}>{label}</span>
      <span style={{ color: c.terracotta, fontSize: big ? 19 : 15.5, fontWeight: 700, whiteSpace: "nowrap" }}>
        {display || num} ☎
      </span>
    </a>
  );
}

function AideImmediate({ c, onBack, onDanger, onPeur, onDebord, onUrgence }) {
  return (
    <div>
      <ScreenTitle c={c}>Vous n'avez pas à traverser cela seul·e.</ScreenTitle>
      <p style={{ color: c.textSoft, fontSize: 15, lineHeight: 1.6, marginBottom: 22 }}>
        Choisissez ce qui se rapproche le plus de votre situation maintenant.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
        <TriageCard c={c} variant="warn" onClick={onDanger}
          titre="Je suis en danger immédiat"
          sousTexte="Ma sécurité ou celle de quelqu'un d'autre est menacée maintenant, ou j'ai besoin d'une aide médicale urgente." />
        <TriageCard c={c} variant="warn" onClick={onPeur}
          titre="J'ai peur de me faire du mal ou de ne pas rester en sécurité"
          sousTexte="J'ai des pensées suicidaires, peur de passer à l'acte, ou je ne me sens pas capable de rester seul·e avec ce qui se passe." />
        <TriageCard c={c} onClick={onDebord}
          titre="Je ne suis pas en danger immédiat, mais je suis très débordé·e"
          sousTexte="J'ai besoin d'aide pour traverser les prochaines minutes." />
      </div>
      <Btn c={c} variant="secondary" onClick={onUrgence} style={{ marginBottom: 20 }}>
        Voir tous les numéros d'aide <span>→</span>
      </Btn>
      <Btn c={c} variant="ghost" onClick={onBack}>Revenir à l'accueil</Btn>
    </div>
  );
}

function AideDanger({ c, onBack }) {
  return (
    <div>
      <BackRow c={c} onBack={onBack} />
      <ScreenTitle c={c}>Je suis en danger immédiat</ScreenTitle>
      <p style={{ color: c.textSoft, fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
        Appuyez sur un numéro pour appeler directement.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
        <TelButton c={c} big label="Urgence médicale (SAMU)" num="15" />
        <TelButton c={c} big label="Urgence — numéro européen" num="112" />
        <TelButton c={c} big label="Police / Gendarmerie" num="17" />
        <TelButton c={c} big label="Pompiers" num="18" />
      </div>
      <Card c={c} style={{ background: c.bgAlt, border: "none", marginBottom: 20 }}>
        <p style={{ margin: 0, fontSize: 13, color: c.textSoft, lineHeight: 1.6 }}>
          Pour les personnes sourdes, malentendantes, aphasiques ou dysphasiques : le <strong>114</strong> est
          accessible par SMS, fax ou tchat.
        </p>
      </Card>
      <Btn c={c} variant="ghost" onClick={onBack}>Retour</Btn>
    </div>
  );
}

function AidePeur({ c, onBack, safetyPlan, onContacts }) {
  const aUnePersonne = safetyPlan && safetyPlan.personnes && safetyPlan.personnes.trim().length > 0;
  return (
    <div>
      <BackRow c={c} onBack={onBack} />
      <ScreenTitle c={c}>Vous n'êtes pas seul·e avec ça.</ScreenTitle>
      <div style={{ marginBottom: 18 }}>
        <TelButton c={c} big label="Numéro national de prévention du suicide" num="3114" display="3114" />
      </div>
      <p style={{ color: c.textSoft, fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
        Ce numéro est gratuit, confidentiel, et disponible 24h/24 et 7j/7.
      </p>
      {aUnePersonne && (
        <Btn c={c} variant="soft" onClick={onContacts} style={{ marginBottom: 20 }}>
          Contacter une personne de mes repères de sécurité <span>→</span>
        </Btn>
      )}
      <Card c={c} style={{ background: c.bgAlt, border: "none", marginBottom: 20 }}>
        <p style={{ margin: 0, fontSize: 12.5, color: c.textSoft, lineHeight: 1.6 }}>
          Cette application ne surveille pas votre état. Personne n'est automatiquement alerté par ce que vous
          indiquez ici.
        </p>
      </Card>
      <Btn c={c} variant="ghost" onClick={onBack}>Retour</Btn>
    </div>
  );
}

function AideDebordQ1({ c, onBack, onOui, onNeSaitPas, onNon }) {
  return (
    <div>
      <BackRow c={c} onBack={onBack} />
      <ScreenTitle c={c}>Êtes-vous dans un endroit suffisamment sûr pour les prochaines minutes ?</ScreenTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 10 }}>
        <Btn c={c} variant="secondary" onClick={onOui}>Oui</Btn>
        <Btn c={c} variant="secondary" onClick={onNeSaitPas}>Je ne sais pas</Btn>
        <Btn c={c} variant="secondary" onClick={onNon}>Non</Btn>
      </div>
    </div>
  );
}

function AideDebordNonSur({ c, onBack, onAppeler, onContacter, onNumeros }) {
  return (
    <div>
      <BackRow c={c} onBack={onBack} />
      <ScreenTitle c={c}>La priorité, maintenant</ScreenTitle>
      <p style={{ color: c.textSoft, fontSize: 15, lineHeight: 1.6, marginBottom: 22 }}>
        La priorité est de vous éloigner du danger si cela est possible et de contacter une aide extérieure.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Btn c={c} variant="warn" onClick={onAppeler}>Appeler les secours <span>☎</span></Btn>
        <Btn c={c} variant="soft" onClick={onContacter}>Contacter quelqu'un <span>→</span></Btn>
        <Btn c={c} variant="secondary" onClick={onNumeros}>Accéder aux numéros d'aide <span>→</span></Btn>
      </div>
    </div>
  );
}

const AIDE_DEBORD_CHOIX = [
  { id: "regarder", label: "Regarder quelque chose autour de moi" },
  { id: "appui", label: "Sentir un appui" },
  { id: "bouger", label: "Bouger un peu" },
  { id: "ecouter", label: "Écouter une voix ou un son" },
  { id: "contacter", label: "Contacter quelqu'un" },
  { id: "ne_sait_pas", label: "Je ne sais pas" },
];

function AideDebordQ2({ c, onBack, onChoix }) {
  return (
    <div>
      <BackRow c={c} onBack={onBack} />
      <ScreenTitle c={c}>Que serait-il le plus facile de faire maintenant ?</ScreenTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
        {AIDE_DEBORD_CHOIX.map((o) => (
          <Btn key={o.id} c={c} variant="secondary" onClick={() => onChoix(o.id)}>{o.label}</Btn>
        ))}
      </div>
    </div>
  );
}

const EMERGENCY_NUMBERS = [
  { groupe: "Urgences immédiates", items: [
    { label: "Urgence médicale (SAMU)", num: "15" },
    { label: "Urgence — numéro européen", num: "112" },
    { label: "Police / Gendarmerie", num: "17" },
    { label: "Pompiers", num: "18" },
  ] },
  { groupe: "Prévention du suicide et détresse", items: [
    { label: "Numéro national de prévention du suicide", num: "3114", display: "3114" },
    { label: "SOS Amitié", num: "0972394050", display: "09 72 39 40 50" },
    { label: "Suicide Écoute", num: "0145394000", display: "01 45 39 40 00" },
  ] },
  { groupe: "Consommations", items: [
    { label: "Écoute Cannabis", num: "0811912020", display: "0811 912 020" },
    { label: "Écoute Alcool", num: "0811913030", display: "0811 913 030" },
  ] },
  { groupe: "Ados, parents, familles", items: [
    { label: "Cap Écoute (ados et parents en difficulté)", num: "0472333435", display: "04 72 33 34 35" },
  ] },
  { groupe: "Violences", items: [
    { label: "Aide aux victimes", num: "116006", display: "116 006" },
    { label: "Femmes victimes de violences et leur entourage", num: "3919", display: "3919" },
    { label: "Enfants en danger", num: "119", display: "119" },
  ] },
];

function Urgence({ c, onBack }) {
  return (
    <div>
      <BackRow c={c} onBack={onBack} label="Retour" />
      <ScreenTitle c={c}>Tous les numéros d'aide</ScreenTitle>
      <p style={{ color: c.textSoft, fontSize: 14, lineHeight: 1.6, marginBottom: 22 }}>
        Appuyez sur un numéro pour appeler directement.
      </p>
      {EMERGENCY_NUMBERS.map((group) => (
        <div key={group.groupe} style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12.5, color: c.textSoft, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.3 }}>
            {group.groupe}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {group.items.map((it) => (
              <a key={it.num} href={`tel:${it.num}`}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "14px 16px", borderRadius: 16, textDecoration: "none",
                  border: `1px solid ${c.border}`, background: c.card,
                }}>
                <span style={{ color: c.text, fontSize: 14.5, fontWeight: 600, paddingRight: 10 }}>{it.label}</span>
                <span style={{ color: c.terracotta, fontSize: 15.5, fontWeight: 700, whiteSpace: "nowrap" }}>
                  {it.display || it.num} ☎
                </span>
              </a>
            ))}
          </div>
        </div>
      ))}
      <Btn c={c} variant="ghost" onClick={onBack}>Retour</Btn>
    </div>
  );
}

function Chip({ active, onClick, children, c }) {
  return (
    <button onClick={onClick} style={{
      padding: "7px 13px", borderRadius: 999, fontSize: 12.5, cursor: "pointer", whiteSpace: "nowrap",
      border: `1px solid ${active ? c.sage : c.border}`, background: active ? c.sageSoft : c.card, color: c.text,
    }}>{children}</button>
  );
}

function FacetRow({ title, options, value, onToggle, c }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12, color: c.textSoft, marginBottom: 6 }}>{title}</div>
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
        {options.map((o) => (
          <Chip key={o.id} c={c} active={value === o.id} onClick={() => onToggle(value === o.id ? null : o.id)}>{o.label}</Chip>
        ))}
      </div>
    </div>
  );
}

const TAG_LABELS = { creativite: "quelque chose de créatif", jeu: "quelque chose de ludique", humour: "un peu d'humour" };

function activeCriteriaOf(f) {
  const list = [];
  if (f.etat) list.push({ type: "etat", value: f.etat, label: ETATS_LIST.find((x) => x.id === f.etat)?.label });
  if (f.besoin) list.push({ type: "besoin", value: f.besoin, label: BESOINS_LIST.find((x) => x.id === f.besoin)?.label });
  if (f.protection) list.push({ type: "protection", value: f.protection, label: FFFF_INFO.find((x) => x.id === f.protection)?.label.split(" — ")[0] });
  if (f.canal) list.push({ type: "canal", value: f.canal, label: CANAUX_LIST.find((x) => x.id === f.canal)?.label });
  if (f.duree) list.push({ type: "duree", value: f.duree, label: DUREE_LIST.find((x) => x.id === f.duree)?.label });
  if (f.tag) list.push({ type: "tag", value: f.tag, label: TAG_LABELS[f.tag] || f.tag });
  if (f.family) list.push({ type: "family", value: f.family, label: FAMILIES[f.family]?.label || f.family });
  return list;
}

function matchesCriterion(ex, crit) {
  if (crit.type === "etat") return ex.etats.length === 0 || ex.etats.includes(crit.value);
  if (crit.type === "besoin") return ex.besoins.includes(crit.value);
  if (crit.type === "protection") return ex.protection.includes(crit.value);
  if (crit.type === "canal") return ex.canaux.includes(crit.value);
  if (crit.type === "tag") return !!(ex.tags && ex.tags.includes(crit.value));
  if (crit.type === "family") return exerciseFamily(ex) === crit.value;
  if (crit.type === "duree") {
    const order = ["30s", "2min", "5min", "10min"];
    return order.indexOf(ex.duree) <= order.indexOf(crit.value);
  }
  return false;
}

function scoreExercise(ex, criteria) {
  return criteria.filter((crit) => matchesCriterion(ex, crit)).length;
}

function sortByFeedback(list, feedback) {
  const rank = { "Beaucoup": 0, "Un peu": 1, "Cela dépend": 2, "Pas vraiment": 3 };
  return [...list].sort((a, b) => (rank[feedback[a.id]] ?? 1.5) - (rank[feedback[b.id]] ?? 1.5));
}

function addAvoid(arr, tag) { return arr.includes(tag) ? arr : [...arr, tag]; }

const THEMES = [
  { id: "court", label: "J'ai moins de 30 secondes", apply: (f) => ({ ...f, duree: "30s" }) },
  { id: "sans_yeux", label: "Je ne veux pas fermer les yeux", apply: (f) => ({ ...f, avoid: addAvoid(f.avoid, "yeux_fermes") }) },
  { id: "sans_corps", label: "Je ne veux pas me concentrer sur mon corps", apply: (f) => ({ ...f, avoid: addAvoid(addAvoid(f.avoid, "interoception"), "toucher_corps") }) },
  { id: "bouger", label: "Je veux bouger", apply: (f) => ({ ...f, canal: "moteur" }) },
  { id: "sans_bouger", label: "Je ne peux pas bouger beaucoup", apply: (f) => ({ ...f, avoid: addAvoid(f.avoid, "mouvement") }) },
  { id: "limites", label: "J'ai besoin de retrouver mes limites", apply: (f) => ({ ...f, besoin: "limites" }) },
  { id: "repondre", label: "Je dois répondre à quelqu'un", apply: (f) => ({ ...f, besoin: "limites", protection: "fawn" }) },
  { id: "seul", label: "Je suis seul·e", apply: (f) => ({ ...f, excludeRelational: true }) },
  { id: "avec_autres", label: "Je suis avec d'autres personnes", apply: (f) => ({ ...f, canal: "relationnel", excludeRelational: false }) },
  { id: "travail", label: "Je suis au travail", apply: (f) => ({ ...f, avoid: addAvoid(addAvoid(f.avoid, "yeux_fermes"), "mouvement") }) },
  { id: "lieu_public", label: "Je suis dans un lieu public", apply: (f) => ({ ...f, avoid: addAvoid(addAvoid(f.avoid, "yeux_fermes"), "mouvement") }) },
  { id: "lit", label: "Je suis au lit", apply: (f) => ({ ...f, avoid: addAvoid(f.avoid, "mouvement") }) },
  { id: "creatif", label: "J'ai envie de quelque chose de créatif", apply: (f) => ({ ...f, tag: "creativite" }) },
  { id: "ne_sait_pas", label: "Je ne sais pas ce dont j'ai besoin", apply: (f) => ({ ...f, etat: null, besoin: null, protection: null, canal: null, duree: null, tag: null, family: null }) },
];

function pickSurprise(pool, feedback, etat, excludeId) {
  let candidates = pool;
  if (etat === "dissociation") {
    const restreint = candidates.filter((ex) => !ex.sensible.some((s) => ["yeux_fermes", "interoception", "imagination"].includes(s)));
    if (restreint.length > 0) candidates = restreint;
  }
  // Éviter de retirer immédiatement le même exercice deux fois de suite, si le choix le permet
  if (excludeId && candidates.length > 1) {
    const sansRepetition = candidates.filter((ex) => ex.id !== excludeId);
    if (sansRepetition.length > 0) candidates = sansRepetition;
  }
  return candidates.length > 0 ? candidates[Math.floor(Math.random() * candidates.length)] : null;
}

/* ---------------------------------------------------------------
   SYSTÈME D'ÉTIQUETTES VISUELLES
   Une couleur = une fonction de l'exercice, jamais un état psychologique.
--------------------------------------------------------------- */
const FAMILIES = {
  orientation: { label: "Revenir au présent", color: "sage" },
  espace: { label: "Créer de l'espace", color: "blue" },
  energie: { label: "Énergie / mobilisation", color: "ocre" },
  limites: { label: "Limites / relation", color: "terracotta" },
  creativite: { label: "Créatif / imaginaire", color: "violet" },
  contenant: { label: "Contenant / pause", color: "stone" },
  force: { label: "Force / protection", color: "force" },
};

const BESOIN_TO_FAMILY = {
  orienter: "orientation", appuis: "orientation", corps: "orientation", sens: "energie",
  dissocie: "orientation", tolerance_renforcer: "orientation",
  mouvement: "energie", choix: "limites",
  contenir: "contenant", douceur: "contenant", honte: "contenant",
  mobiliser_fight: "force",
  mobiliser_flight: "espace", mental: "espace", transition: "espace",
  limites: "limites", lien: "limites",
  lieu_ressource: "creativite",
};
const PROTECTION_TO_FAMILY = { fight: "force", flight: "espace", freeze: "orientation", fawn: "limites" };

const CANAL_MODALITE = {
  visuel: "Vue", auditif: "Sons", tactile: "Toucher", moteur: "Mouvement",
  cognitif: "Paroles", imaginatif: "Imagination", relationnel: "Relation",
};

function exerciseFamily(ex) {
  if (ex.besoins && ex.besoins[0] && BESOIN_TO_FAMILY[ex.besoins[0]]) return BESOIN_TO_FAMILY[ex.besoins[0]];
  if (ex.protection && ex.protection[0] && PROTECTION_TO_FAMILY[ex.protection[0]]) return PROTECTION_TO_FAMILY[ex.protection[0]];
  return "orientation";
}

function exerciseModalites(ex) {
  return (ex.canaux || []).slice(0, 2).map((cn) => CANAL_MODALITE[cn]).filter(Boolean);
}

function ExoTag({ family, c, children, small, onClick }) {
  const fam = FAMILIES[family];
  const bg = fam ? c[fam.color + "Soft"] : c.bgAlt;
  const fg = fam ? c.text : c.textSoft;
  const Tag = onClick ? "button" : "span";
  return (
    <Tag onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", background: bg, color: fg,
      padding: small ? "3px 9px" : "5px 11px", borderRadius: 999, border: "none",
      fontSize: small ? 11 : 12, fontWeight: 600, whiteSpace: "nowrap",
      cursor: onClick ? "pointer" : "default", fontFamily: fontBody,
    }}>
      {children}
    </Tag>
  );
}

function ModaliteTag({ c, children, onClick }) {
  const Tag = onClick ? "button" : "span";
  return (
    <Tag onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", background: c.bgAlt, color: c.textSoft, border: "none",
      padding: "3px 9px", borderRadius: 999, fontSize: 11, fontWeight: 500, whiteSpace: "nowrap",
      cursor: onClick ? "pointer" : "default", fontFamily: fontBody,
    }}>
      {children}
    </Tag>
  );
}

function MatchDots({ c, level }) {
  if (!level) return null;
  return (
    <span style={{ display: "inline-flex", gap: 3, alignItems: "center" }} title="Niveau de correspondance">
      {[1, 2, 3].map((i) => (
        <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: i <= level ? c.text : c.border }} />
      ))}
    </span>
  );
}

function ExerciseCardTags({ ex, c, feedback, customExercises, onFilterFamily, onFilterCanal }) {
  const fam = exerciseFamily(ex);
  const modalites = exerciseModalites(ex);
  const isPerso = customExercises && customExercises.some((e) => e.id === ex.id);
  const dejaEssaye = feedback && feedback[ex.id];
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginTop: 6 }}>
      <ExoTag family={fam} c={c} small onClick={onFilterFamily ? (e) => { e.stopPropagation(); onFilterFamily(fam); } : undefined}>
        {FAMILIES[fam].label}
      </ExoTag>
      {modalites.map((m, i) => (
        <ModaliteTag key={m} c={c} onClick={onFilterCanal ? (e) => { e.stopPropagation(); onFilterCanal(ex.canaux[i]); } : undefined}>
          {m}
        </ModaliteTag>
      ))}
      {isPerso && <ModaliteTag c={c}>Mon exercice</ModaliteTag>}
      {dejaEssaye && <ModaliteTag c={c}>Déjà essayé · {dejaEssaye}</ModaliteTag>}
    </div>
  );
}

function Library({ c, onBack, filters: f, setFilters: setF, feedback, customExercises, onPick, onGoPreferences, onGoCreate }) {
  const [showFacets, setShowFacets] = useState(false);
  const [showAvoidPanel, setShowAvoidPanel] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showJeNeSaisPas, setShowJeNeSaisPas] = useState(false);
  const [lastSurpriseId, setLastSurpriseId] = useState(null);

  const allExercises = [...EXERCISES, ...customExercises];
  const notAvoided = allExercises.filter((ex) =>
    feedback[ex.id] !== "Je préfère l'éviter" &&
    !(f.avoid && f.avoid.length && ex.sensible.some((s) => f.avoid.includes(s))) &&
    !(f.excludeRelational && ex.canaux.length === 1 && ex.canaux[0] === "relationnel")
  );

  const criteria = activeCriteriaOf(f);
  let list = [];
  let banner = null;
  let perCriterion = null;

  if (criteria.length === 0) {
    list = sortByFeedback(notAvoided, feedback);
  } else {
    const scored = notAvoided.map((ex) => ({ ex, score: scoreExercise(ex, criteria) }));
    const fullMatches = scored.filter((s) => s.score === criteria.length).map((s) => s.ex);
    if (fullMatches.length > 0) {
      list = sortByFeedback(fullMatches, feedback);
    } else {
      const maxScore = Math.max(0, ...scored.map((s) => s.score));
      if (maxScore > 0) {
        list = sortByFeedback(scored.filter((s) => s.score === maxScore).map((s) => s.ex), feedback);
        banner = "partial";
      } else {
        perCriterion = criteria.map((crit) => ({ crit, exercise: notAvoided.find((ex) => matchesCriterion(ex, crit)) || null }));
        banner = "per-criterion";
      }
    }
  }

  const matchLevel = criteria.length === 0 ? 0 : (banner === "partial" ? 2 : banner === "per-criterion" ? 1 : 3);

  return (
    <div>
      <BackRow c={c} onBack={onBack} />
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
        <ScreenTitle c={c}>Faire un exercice</ScreenTitle>
        <button onClick={() => setShowHelp((s) => !s)} aria-label="Comment fonctionnent les filtres ?" style={{
          width: 22, height: 22, borderRadius: "50%", border: `1px solid ${c.border}`, background: c.card,
          color: c.textSoft, fontSize: 12, cursor: "pointer", flexShrink: 0, marginTop: -10,
        }}>?</button>
      </div>
      <p style={{ color: c.textSoft, fontSize: 14, lineHeight: 1.6, marginBottom: 14 }}>
        Vous pouvez arrêter à tout moment. Il n'existe pas un exercice qui convient à tout le monde — l'objectif
        est de découvrir progressivement ce qui vous aide, ce qui vous aide parfois, et ce que vous préférez éviter.
      </p>

      {showHelp && (
        <Card c={c} style={{ background: c.bgAlt, border: "none", marginBottom: 16 }}>
          <div style={{ fontWeight: 700, color: c.text, marginBottom: 8, fontSize: 14 }}>Comment fonctionnent les filtres ?</div>
          <p style={{ fontSize: 12.5, color: c.textSoft, lineHeight: 1.6, margin: "0 0 8px" }}>
            Les filtres vous aident à trouver des exercices qui se rapprochent de ce que vous vivez et de ce qui
            vous convient aujourd'hui. Vous pouvez sélectionner plusieurs éléments à la fois. Vous n'avez pas
            besoin de tout sélectionner — plus vous ajoutez de critères, plus la recherche devient précise.
          </p>
          <p style={{ fontSize: 12.5, color: c.textSoft, lineHeight: 1.6, margin: "0 0 8px" }}>
            <strong>Si plusieurs exercices correspondent à tout ce que vous avez choisi</strong>, ils seront
            proposés en priorité. <strong>Si aucun ne correspond exactement à toute votre sélection</strong>,
            l'application cherche d'abord ceux qui correspondent au plus grand nombre d'éléments. <strong>Si votre
            combinaison est très spécifique</strong>, des exercices pourront être proposés séparément pour
            différentes parties de ce que vous traversez.
          </p>
          <p style={{ fontSize: 12.5, color: c.text, lineHeight: 1.6, margin: 0, fontWeight: 600 }}>
            Vous ne serez jamais obligé·e de tout choisir ni de trouver la « bonne » combinaison. Vous pourrez
            modifier vos filtres à tout moment.
          </p>
        </Card>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <button onClick={() => setShowFacets((s) => !s)} style={{ fontSize: 12.5, color: c.text, background: c.bgAlt, border: "none", borderRadius: 999, padding: "8px 13px", cursor: "pointer" }}>
          {showFacets ? "Masquer les filtres" : "Affiner ma recherche"}
        </button>
        <button onClick={() => setShowAvoidPanel((s) => !s)} style={{ fontSize: 12.5, color: c.text, background: c.terracottaSoft, border: "none", borderRadius: 999, padding: "8px 13px", cursor: "pointer" }}>
          Ce que je préfère éviter aujourd'hui
        </button>
        <button onClick={onGoPreferences} style={{ fontSize: 12.5, color: c.textSoft, background: "none", border: `1px solid ${c.border}`, borderRadius: 999, padding: "8px 13px", cursor: "pointer" }}>
          Mes préférences
        </button>
        <button onClick={() => setShowThemes((s) => !s)} style={{ fontSize: 12.5, color: c.text, background: c.blueSoft, border: "none", borderRadius: 999, padding: "8px 13px", cursor: "pointer" }}>
          Parcours thématiques
        </button>
        <button onClick={() => setShowJeNeSaisPas((s) => !s)} style={{ fontSize: 12.5, color: c.textSoft, background: "none", border: `1px dashed ${c.border}`, borderRadius: 999, padding: "8px 13px", cursor: "pointer" }}>
          Je ne sais pas quoi choisir
        </button>
      </div>

      {showJeNeSaisPas && (
        <Card c={c} style={{ marginBottom: 14, background: c.bgAlt, border: "none" }}>
          <p style={{ fontSize: 12.5, color: c.textSoft, margin: "0 0 10px", lineHeight: 1.6 }}>
            C'est possible. Vous pouvez commencer sans filtre, répondre à quelques questions, ou choisir ce qui
            vous attire le moins difficilement aujourd'hui.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Btn c={c} variant="secondary" onClick={() => { setF({ etat: null, besoin: null, protection: null, canal: null, duree: null, tag: null, family: null, excludeRelational: false, avoid: f.avoid }); setShowFacets(true); setShowJeNeSaisPas(false); }}>Me poser quelques questions</Btn>
            <Btn c={c} variant="secondary" onClick={() => { setF({ etat: null, besoin: null, protection: null, canal: null, duree: null, tag: null, family: null, excludeRelational: false, avoid: f.avoid }); setShowJeNeSaisPas(false); }}>Me montrer différents types d'exercices</Btn>
            <Btn c={c} variant="secondary" onClick={() => { setF((prev) => ({ ...prev, duree: "30s" })); setShowJeNeSaisPas(false); }}>Me proposer quelque chose de très court</Btn>
            <Btn c={c} variant="ghost" onClick={() => setShowJeNeSaisPas(false)}>Retour</Btn>
          </div>
        </Card>
      )}

      {criteria.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
          {criteria.map((crit) => (
            <span key={crit.type} style={{
              display: "inline-flex", alignItems: "center", gap: 6, background: c.card,
              border: `1px solid ${c.border}`, borderRadius: 999, padding: "5px 6px 5px 12px", fontSize: 12, color: c.text,
            }}>
              {crit.label}
              <button onClick={() => setF((prev) => ({ ...prev, [crit.type]: null }))}
                aria-label={`Retirer le filtre ${crit.label}`}
                style={{ background: c.bgAlt, border: "none", borderRadius: "50%", width: 18, height: 18, color: c.textSoft, cursor: "pointer", fontSize: 11, lineHeight: "18px" }}>×</button>
            </span>
          ))}
          <button onClick={() => setF((prev) => ({ ...prev, etat: null, besoin: null, protection: null, canal: null, duree: null, tag: null, family: null }))}
            style={{ fontSize: 12, color: c.textSoft, background: "none", border: "none", textDecoration: "underline", cursor: "pointer" }}>
            Effacer tous les filtres
          </button>
        </div>
      )}

      {showThemes && (
        <Card c={c} style={{ marginBottom: 14, background: c.bgAlt, border: "none" }}>
          <p style={{ fontSize: 12.5, color: c.textSoft, margin: "0 0 10px" }}>
            Choisissez ce qui correspond le mieux à votre situation maintenant :
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {THEMES.map((th) => (
              <button key={th.id} onClick={() => { setF((prev) => th.apply(prev)); setShowThemes(false); }}
                style={{ textAlign: "left", fontSize: 13, color: c.text, background: c.card, border: `1px solid ${c.border}`, borderRadius: 12, padding: "10px 12px", cursor: "pointer" }}>
                {th.label}
              </button>
            ))}
          </div>
        </Card>
      )}

      {showAvoidPanel && (
        <Card c={c} style={{ marginBottom: 14, background: c.bgAlt, border: "none" }}>
          <p style={{ fontSize: 12.5, color: c.textSoft, margin: "0 0 8px" }}>
            Sélectionnez ce que vous préférez éviter pour cette session (cela ne sera pas proposé) :
          </p>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            {EVITER_LIST.map((ev) => {
              const active = f.avoid.includes(ev.id);
              return (
                <Chip key={ev.id} c={c} active={active} onClick={() =>
                  setF((prev) => ({ ...prev, avoid: active ? prev.avoid.filter((x) => x !== ev.id) : [...prev.avoid, ev.id] }))
                }>{ev.label}</Chip>
              );
            })}
          </div>
        </Card>
      )}

      {showFacets && (
        <Card c={c} style={{ marginBottom: 16 }}>
          <FacetRow title="Mon état actuel" options={ETATS_LIST} value={f.etat} onToggle={(v) => setF({ ...f, etat: v })} c={c} />
          <FacetRow title="Ce dont j'ai besoin" options={BESOINS_LIST} value={f.besoin} onToggle={(v) => setF({ ...f, besoin: v })} c={c} />
          <FacetRow title="Ma réaction de protection" options={FFFF_INFO.map((x) => ({ id: x.id, label: x.label.split(" — ")[0] }))} value={f.protection} onToggle={(v) => setF({ ...f, protection: v })} c={c} />
          <FacetRow title="Ce qui me convient aujourd'hui" options={CANAUX_LIST} value={f.canal} onToggle={(v) => setF({ ...f, canal: v })} c={c} />
          <FacetRow title="Le temps que j'ai" options={DUREE_LIST} value={f.duree} onToggle={(v) => setF({ ...f, duree: v })} c={c} />
          <FacetRow title="Fonction de l'exercice" options={Object.entries(FAMILIES).map(([key, fam]) => ({ id: key, label: fam.label }))} value={f.family} onToggle={(v) => setF({ ...f, family: v })} c={c} />
        </Card>
      )}

      <Btn c={c} variant="soft" onClick={() => {
        const pool = list.length > 0 ? list : notAvoided;
        const surprise = pickSurprise(pool, feedback, f.etat, lastSurpriseId);
        if (surprise) {
          setLastSurpriseId(surprise.id);
          onPick(surprise);
        }
      }} style={{ marginBottom: 16 }}>
        🎲 Proposez-moi quelque chose de différent
      </Btn>

      {banner === "partial" && (
        <Card c={c} style={{ background: c.bgAlt, border: "none", marginBottom: 14 }}>
          <p style={{ margin: 0, fontSize: 13.5, color: c.textSoft, lineHeight: 1.6 }}>
            Aucun exercice ne correspond exactement à tout ce que vous décrivez en même temps. Voici ce qui
            correspond au mieux à votre combinaison.
          </p>
        </Card>
      )}

      {banner === "per-criterion" && (
        <div style={{ marginBottom: 16 }}>
          <Card c={c} style={{ background: c.bgAlt, border: "none", marginBottom: 12 }}>
            <p style={{ margin: 0, fontSize: 13.5, color: c.textSoft, lineHeight: 1.6 }}>
              Aucun exercice ne correspond exactement à tout ce que vous décrivez en même temps. En revanche,
              pour chacun de ces éléments pris séparément, voici ce que vous pouvez essayer :
            </p>
          </Card>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {perCriterion.map(({ crit, exercise }) => (
              <div key={crit.type + crit.value}>
                <div style={{ fontSize: 12, color: c.textSoft, marginBottom: 6, fontWeight: 700 }}>Pour {crit.label} :</div>
                {exercise ? (
                  <button onClick={() => onPick(exercise, 1, [crit])}
                    style={{ textAlign: "left", cursor: "pointer", border: `1px solid ${c.border}`, background: c.card, borderRadius: 16, padding: 14, width: "100%" }}>
                    <div style={{ marginBottom: 6 }}>
                      <ExoTag family={exerciseFamily(exercise)} c={c} small>{crit.label}</ExoTag>
                    </div>
                    <span style={{ fontWeight: 700, color: c.text }}>→ {exercise.titre}</span>
                  </button>
                ) : (
                  <p style={{ margin: 0, fontSize: 12.5, color: c.textSoft, fontStyle: "italic" }}>
                    Rien ne correspond directement à cela pour le moment.
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {(banner === "partial" || banner === "per-criterion") && (
        <Btn c={c} variant="ghost" onClick={() => setF({ etat: null, besoin: null, protection: null, canal: null, duree: null, tag: null, family: null, avoid: f.avoid })} style={{ marginBottom: 14 }}>
          Réinitialiser mes critères
        </Btn>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
        {list.map((ex) => (
          <div key={ex.id} onClick={() => onPick(ex, matchLevel, criteria)} role="button" tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter") onPick(ex, matchLevel, criteria); }}
            style={{ textAlign: "left", cursor: "pointer", border: `1px solid ${c.border}`, background: c.card, borderRadius: 18, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, gap: 8 }}>
              <span style={{ fontWeight: 700, color: c.text }}>{ex.titre}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <MatchDots c={c} level={matchLevel} />
                <button onClick={(e) => { e.stopPropagation(); setF((prev) => ({ ...prev, duree: ex.duree })); }}
                  style={{ fontSize: 12, color: c.textSoft, whiteSpace: "nowrap", background: "none", border: "none", cursor: "pointer", fontFamily: fontBody, padding: 0 }}>
                  {DUREE_LIST.find((d) => d.id === ex.duree)?.label}
                </button>
              </div>
            </div>
            <ExerciseCardTags ex={ex} c={c} feedback={feedback} customExercises={customExercises}
              onFilterFamily={(fam) => setF((prev) => ({ ...prev, family: fam }))}
              onFilterCanal={(canal) => setF((prev) => ({ ...prev, canal }))} />
          </div>
        ))}
      </div>

      <Btn c={c} variant="secondary" onClick={onGoCreate}>Créer mon propre exercice <span>+</span></Btn>
    </div>
  );
}

function Exercise({ c, exercise, raison, onStop, onRevenirListe, onEssayerAutreChose, onFinish, onFilterByTag }) {
  const [step, setStep] = useState("do"); // do | pas-maintenant | remarque | continuer | feedback
  const [remarque, setRemarque] = useState(null);
  const [varianteIdx, setVarianteIdx] = useState(0); // 0 = version principale
  const versions = [{ label: "Version principale", etapes: exercise.etapes }, ...(exercise.variantes || [])];
  const etapesAffichees = versions[varianteIdx]?.etapes || exercise.etapes;

  if (step === "pas-maintenant") {
    return (
      <div>
        <ScreenTitle c={c}>Vous avez arrêté cet exercice.</ScreenTitle>
        <p style={{ color: c.textSoft, fontSize: 15, lineHeight: 1.6, marginBottom: 26 }}>
          C'est une possibilité prévue.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Btn c={c} variant="secondary" onClick={onRevenirListe}>Revenir à la liste</Btn>
          <Btn c={c} variant="secondary" onClick={onEssayerAutreChose}>Essayer autre chose</Btn>
          <Btn c={c} variant="ghost" onClick={onStop}>Retourner à l'accueil</Btn>
        </div>
      </div>
    );
  }

  if (step === "remarque") {
    return (
      <div>
        <ScreenTitle c={c}>Qu'est-ce que vous remarquez maintenant ?</ScreenTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 10 }}>
          {REMARQUE_OPTIONS.map((o) => (
            <Btn key={o} c={c} variant={remarque === o ? "primary" : "secondary"} onClick={() => { setRemarque(o); setStep("continuer"); }}>{o}</Btn>
          ))}
        </div>
      </div>
    );
  }

  if (step === "continuer") {
    return (
      <div>
        <ScreenTitle c={c}>Souhaitez-vous continuer ?</ScreenTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Btn c={c} variant="secondary" onClick={() => setStep("do")}>Essayer à nouveau cet exercice</Btn>
          <Btn c={c} variant="secondary" onClick={() => setStep("feedback")}>Essayer autre chose / arrêter ici</Btn>
        </div>
      </div>
    );
  }

  if (step === "feedback") {
    return (
      <div>
        <ScreenTitle c={c}>Cet exercice vous aide généralement…</ScreenTitle>
        <p style={{ color: c.textSoft, fontSize: 13, marginBottom: 16 }}>Sans jugement — juste pour ajuster votre bibliothèque.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {FEEDBACK_OPTIONS.map((o) => (
            <Btn key={o} c={c} variant="secondary" onClick={() => onFinish(o, remarque)}>{o}</Btn>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10, alignItems: "center" }}>
        <ExoTag family={exerciseFamily(exercise)} c={c} onClick={onFilterByTag ? () => onFilterByTag("family", exerciseFamily(exercise)) : undefined}>
          {FAMILIES[exerciseFamily(exercise)].label}
        </ExoTag>
        {exercise.canaux.map((cn) => (
          <ModaliteTag key={cn} c={c} onClick={onFilterByTag ? () => onFilterByTag("canal", cn) : undefined}>
            {CANAL_MODALITE[cn]}
          </ModaliteTag>
        ))}
        <button onClick={onFilterByTag ? () => onFilterByTag("duree", exercise.duree) : undefined}
          style={{ fontSize: 12, color: c.textSoft, background: "none", border: "none", cursor: onFilterByTag ? "pointer" : "default", fontFamily: fontBody, padding: 0 }}>
          ⏱ {DUREE_LIST.find((d) => d.id === exercise.duree)?.label}
        </button>
      </div>
      <ScreenTitle c={c}>{exercise.titre}</ScreenTitle>
      {raison && (
        <Card c={c} style={{ background: c.bgAlt, border: "none", marginBottom: 12 }}>
          <div style={{ fontSize: 11.5, color: c.textSoft, marginBottom: 2 }}>Pourquoi cette proposition ?</div>
          <div style={{ fontSize: 12.5, color: c.text }}>{raison}</div>
        </Card>
      )}
      <p style={{ color: c.textSoft, fontSize: 13, lineHeight: 1.6, marginBottom: 14, fontStyle: "italic" }}>{exercise.objectif}</p>
      {exercise.materiel && (
        <Card c={c} style={{ background: c.bgAlt, border: "none", marginBottom: 14 }}>
          <p style={{ margin: 0, fontSize: 12.5, color: c.textSoft }}>Matériel utile : {exercise.materiel}</p>
        </Card>
      )}
      {versions.length > 1 && (
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 14 }}>
          {versions.map((v, i) => (
            <button key={i} onClick={() => setVarianteIdx(i)}
              style={{
                padding: "7px 12px", borderRadius: 999, fontSize: 12, cursor: "pointer",
                border: `1px solid ${varianteIdx === i ? c.sage : c.border}`,
                background: varianteIdx === i ? c.sageSoft : c.card, color: c.text,
              }}>
              {v.label}
            </button>
          ))}
        </div>
      )}
      <Card c={c} style={{ marginBottom: 16 }}>
        {etapesAffichees.map((et, i) => (
          <p key={i} style={{ margin: i === 0 ? 0 : "10px 0 0", fontSize: 15.5, lineHeight: 1.65, color: c.text }}>{et}</p>
        ))}
      </Card>
      {exercise.precaution && (
        <Card c={c} style={{ background: c.terracottaSoft, border: "none", marginBottom: 20 }}>
          <p style={{ margin: 0, fontSize: 12.5, color: c.text, lineHeight: 1.6 }}>{exercise.precaution}</p>
        </Card>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Btn c={c} variant="primary" onClick={() => setStep("remarque")}>Continuer <span>✓</span></Btn>
        <Btn c={c} variant="secondary" onClick={onEssayerAutreChose}>Faire autrement</Btn>
        <Btn c={c} variant="ghost" onClick={() => setStep("pas-maintenant")}>Pas maintenant</Btn>
      </div>
    </div>
  );
}

function ExerciseDone({ c, goBackHome, onAnother }) {
  return (
    <div>
      <ScreenTitle c={c}>Merci d'avoir essayé.</ScreenTitle>
      <p style={{ color: c.textSoft, fontSize: 15, lineHeight: 1.6, marginBottom: 26 }}>
        C'est noté dans votre suivi personnel, et votre bibliothèque en tiendra compte la prochaine fois. Ce
        n'est pas une performance — simplement une observation de plus sur ce qui vous aide ou non.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Btn c={c} variant="secondary" onClick={onAnother}>Essayer un autre exercice</Btn>
        <Btn c={c} variant="ghost" onClick={goBackHome}>Revenir à l'accueil</Btn>
      </div>
    </div>
  );
}

function Preferences({ c, onBack, avoidPrefs, onSave }) {
  const [selected, setSelected] = useState(avoidPrefs);
  const [saved, setSaved] = useState(false);
  return (
    <div>
      <BackRow c={c} onBack={onBack} />
      <ScreenTitle c={c}>Mes préférences d'exercices</ScreenTitle>
      <p style={{ color: c.textSoft, fontSize: 14, lineHeight: 1.6, marginBottom: 18 }}>
        Ce que vous cochez ici sera écarté par défaut à chaque fois que vous ouvrez la bibliothèque. Vous pourrez
        toujours l'ajuster ponctuellement.
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 22 }}>
        {EVITER_LIST.map((ev) => {
          const active = selected.includes(ev.id);
          return (
            <Chip key={ev.id} c={c} active={active} onClick={() => {
              setSelected((prev) => active ? prev.filter((x) => x !== ev.id) : [...prev, ev.id]);
              setSaved(false);
            }}>{ev.label}</Chip>
          );
        })}
      </div>
      <Btn c={c} variant="primary" onClick={() => { onSave(selected); setSaved(true); }}>
        {saved ? "Enregistré ✓" : "Enregistrer"}
      </Btn>
    </div>
  );
}

function CreateExercise({ c, onBack, onSave }) {
  const [form, setForm] = useState({
    titre: "", quandAide: "", duree: "2min", materiel: "", etapesText: "", aEviter: "", personne: "",
    etats: [], besoins: [], canaux: [], protection: [], sensible: [],
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleIn = (k, id) => setForm((f) => ({
    ...f, [k]: f[k].includes(id) ? f[k].filter((x) => x !== id) : [...f[k], id],
  }));
  const inputStyle = { width: "100%", borderRadius: 12, border: `1px solid ${c.border}`, background: c.card, color: c.text, padding: 10, fontFamily: fontBody, fontSize: 14, resize: "vertical" };
  const submit = () => {
    if (!form.titre.trim()) return;
    onSave({
      id: "perso-" + Date.now(),
      titre: form.titre,
      etats: form.etats, besoins: form.besoins, protection: form.protection, canaux: form.canaux,
      duree: form.duree, materiel: form.materiel || null,
      objectif: form.quandAide || "Exercice personnalisé.",
      etapes: form.etapesText.split("\n").filter(Boolean),
      precaution: form.aEviter ? `À éviter : ${form.aEviter}` : null,
      sensible: form.sensible, perso: true, personneRessource: form.personne,
    });
  };
  return (
    <div>
      <BackRow c={c} onBack={onBack} />
      <ScreenTitle c={c}>Construire quelque chose qui me ressemble</ScreenTitle>
      <p style={{ color: c.textSoft, fontSize: 13, lineHeight: 1.6, marginBottom: 18 }}>
        Vous pouvez le nommer, l'enregistrer, le modifier ou le supprimer plus tard. Rien n'est obligatoire ici,
        chaque champ peut rester vide.
      </p>

      {[
        ["titre", "Nom de mon exercice", 1],
        ["quandAide", "Ce qui m'aide / quand je l'utilise", 2],
      ].map(([key, label, rows]) => (
        <div key={key} style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 13, color: c.textSoft, display: "block", marginBottom: 6 }}>{label}</label>
          <textarea value={form[key]} onChange={(e) => set(key, e.target.value)} rows={rows} style={inputStyle} />
        </div>
      ))}

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 13, color: c.textSoft, display: "block", marginBottom: 6 }}>Quand est-ce que cela pourrait m'aider ? (optionnel)</label>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
          {ETATS_LIST.map((e) => (
            <Chip key={e.id} c={c} active={form.etats.includes(e.id)} onClick={() => toggleIn("etats", e.id)}>{e.label}</Chip>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 13, color: c.textSoft, display: "block", marginBottom: 6 }}>À quoi ça répond ? (optionnel)</label>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
          {BESOINS_LIST.map((b) => (
            <Chip key={b.id} c={c} active={form.besoins.includes(b.id)} onClick={() => toggleIn("besoins", b.id)}>{b.label}</Chip>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 13, color: c.textSoft, display: "block", marginBottom: 6 }}>Qu'est-ce que je préfère utiliser ? (optionnel)</label>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
          {CANAUX_LIST.map((cn) => (
            <Chip key={cn.id} c={c} active={form.canaux.includes(cn.id)} onClick={() => toggleIn("canaux", cn.id)}>{cn.label}</Chip>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 13, color: c.textSoft, display: "block", marginBottom: 6 }}>Une réponse de protection concernée ? (optionnel)</label>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
          {FFFF_INFO.map((p) => (
            <Chip key={p.id} c={c} active={form.protection.includes(p.id)} onClick={() => toggleIn("protection", p.id)}>{p.label.split(" — ")[0]}</Chip>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 13, color: c.textSoft, display: "block", marginBottom: 6 }}>Qu'est-ce que je préfère éviter avec cet exercice ? (optionnel)</label>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
          {EVITER_LIST.map((ev) => (
            <Chip key={ev.id} c={c} active={form.sensible.includes(ev.id)} onClick={() => toggleIn("sensible", ev.id)}>{ev.label}</Chip>
          ))}
        </div>
      </div>

      {[
        ["materiel", "Matériel (optionnel)", 1],
        ["etapesText", "Les étapes (une par ligne)", 4],
        ["aEviter", "Précautions ou notes complémentaires (optionnel)", 2],
        ["personne", "La personne qui peut m'aider (optionnel)", 1],
      ].map(([key, label, rows]) => (
        <div key={key} style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 13, color: c.textSoft, display: "block", marginBottom: 6 }}>{label}</label>
          <textarea value={form[key]} onChange={(e) => set(key, e.target.value)} rows={rows} style={inputStyle} />
        </div>
      ))}
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 13, color: c.textSoft, display: "block", marginBottom: 6 }}>Durée approximative</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {DUREE_LIST.map((d) => (
            <Chip key={d.id} c={c} active={form.duree === d.id} onClick={() => set("duree", d.id)}>{d.label}</Chip>
          ))}
        </div>
      </div>
      <Btn c={c} variant="primary" onClick={submit}>Enregistrer mon exercice <span>✓</span></Btn>
    </div>
  );
}

function SafetyPlan({ c, onBack, plan, onChange, onSave, onGoExport }) {
  const [saved, setSaved] = useState(false);
  const fields = [
    ["signes", "Quand je vais mal, les signes à surveiller sont…"],
    ["personnes", "Les personnes que je peux contacter sont…"],
    ["lieux", "Les lieux où je peux aller sont…"],
    ["eviter", "Les choses à éviter quand je suis débordé·e sont…"],
    ["phrases", "Les phrases qui peuvent m'aider sont…"],
    ["numeros", "Les numéros d'urgence ou de soutien sont…"],
  ];
  const aDuContenu = SAFETY_FIELDS.some(([key]) => plan[key] && plan[key].trim());
  return (
    <div>
      <BackRow c={c} onBack={onBack} />
      <ScreenTitle c={c}>Mes repères de sécurité</ScreenTitle>
      <Card c={c} style={{ background: c.terracottaSoft, border: "none", marginBottom: 20 }}>
        <p style={{ margin: 0, fontSize: 13, color: c.text, lineHeight: 1.6 }}>
          Si vous êtes en danger immédiat, si vous avez peur de passer à l'acte, ou si vous risquez de vous faire
          du mal ou de faire du mal à quelqu'un, contactez immédiatement les services d'urgence de votre pays ou
          une personne de confiance. Cette application ne remplace pas une aide humaine en situation de crise.
        </p>
      </Card>
      {fields.map(([key, label]) => (
        <div key={key} style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, color: c.textSoft, display: "block", marginBottom: 6 }}>{label}</label>
          <textarea
            value={plan[key]}
            onChange={(e) => { onChange(key, e.target.value); setSaved(false); }}
            rows={2}
            style={{
              width: "100%", borderRadius: 12, border: `1px solid ${c.border}`,
              background: c.card, color: c.text, padding: 10, fontFamily: fontBody, fontSize: 14, resize: "vertical",
            }}
          />
        </div>
      ))}
      <Btn c={c} variant="primary" onClick={() => { onSave(); setSaved(true); }} style={{ marginBottom: 12 }}>
        {saved ? "Enregistré ✓" : "Enregistrer"}
      </Btn>
      {aDuContenu && (
        <Btn c={c} variant="secondary" onClick={onGoExport}>
          Exporter mes repères de sécurité en PDF <span>↓</span>
        </Btn>
      )}
    </div>
  );
}

function ReperesExportPreview({ c, onBack, plan, entries, periode, setPeriode, inclureJournal, setInclureJournal, onCreate, onCancel }) {
  const champsRemplis = SAFETY_FIELDS.filter(([key]) => plan[key] && plan[key].trim());
  const journalDisponible = entries.length > 0;
  return (
    <div>
      <BackRow c={c} onBack={onBack} label="Retour" />
      <ScreenTitle c={c}>Exporter mes repères de sécurité</ScreenTitle>
      <Card c={c} style={{ marginBottom: 20 }}>
        <p style={{ margin: "0 0 8px", fontSize: 13.5, color: c.text }}>
          {champsRemplis.length} rubrique{champsRemplis.length > 1 ? "s" : ""} renseignée{champsRemplis.length > 1 ? "s" : ""} sera{champsRemplis.length > 1 ? "ont" : ""} incluse{champsRemplis.length > 1 ? "s" : ""}.
        </p>
        <p style={{ margin: 0, fontSize: 12.5, color: c.textSoft, lineHeight: 1.6 }}>
          Seules les informations que vous avez effectivement renseignées apparaîtront dans le PDF.
        </p>
      </Card>

      {journalDisponible ? (
        <Card c={c} style={{ marginBottom: 20, background: c.bgAlt, border: "none" }}>
          <p style={{ margin: "0 0 12px", fontSize: 13.5, color: c.text, fontWeight: 600 }}>
            Souhaitez-vous également inclure votre journal de suivi dans ce PDF ?
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: inclureJournal ? 16 : 0 }}>
            <Btn c={c} variant={inclureJournal ? "primary" : "secondary"} onClick={() => setInclureJournal(true)}>
              Oui, inclure mon journal de suivi
            </Btn>
            <Btn c={c} variant={!inclureJournal ? "primary" : "secondary"} onClick={() => setInclureJournal(false)}>
              Non, exporter uniquement mes repères de sécurité
            </Btn>
          </div>
          {inclureJournal && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {PERIODES_JOURNAL.map((p) => (
                <button key={p.id} onClick={() => setPeriode(p.id)}
                  style={{
                    textAlign: "left", padding: "9px 12px", borderRadius: 10, cursor: "pointer", fontSize: 13,
                    border: `1px solid ${periode === p.id ? c.sage : c.border}`,
                    background: periode === p.id ? c.sageSoft : c.card, color: c.text,
                  }}>
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </Card>
      ) : (
        <Card c={c} style={{ marginBottom: 20, background: c.bgAlt, border: "none" }}>
          <p style={{ margin: 0, fontSize: 12.5, color: c.textSoft }}>
            Aucune donnée n'est disponible dans votre journal de suivi pour l'instant.
          </p>
        </Card>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Btn c={c} variant="primary" onClick={onCreate}>Créer le PDF <span>↓</span></Btn>
        <Btn c={c} variant="ghost" onClick={onCancel}>Annuler</Btn>
      </div>
    </div>
  );
}

function NervousSystem({ c, onBack }) {
  return (
    <div>
      <BackRow c={c} onBack={onBack} label="Retour à l'accueil" />
      <ScreenTitle c={c}>Comprendre les réactions de mon système nerveux</ScreenTitle>
      <p style={{ color: c.textSoft, fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
        Vos réactions face au stress, à la peur, au conflit ou au trauma ne sont pas des choix conscients ni des
        faiblesses. Ce sont des réponses de protection. Ce modèle peut aider certaines personnes à comprendre
        leurs réactions corporelles et relationnelles — il ne résume pas toute la complexité d'une personne.
      </p>
      {[
        ["Sécurité / engagement social", "sage", "Quand le système nerveux perçoit suffisamment de sécurité, nous pouvons être en lien, réfléchir, parler, écouter, ressentir et revenir plus facilement à l'équilibre."],
        ["Mobilisation", "terracotta", "Quand le système nerveux perçoit une menace, il peut mobiliser de l'énergie pour se protéger. Cela peut ressembler à l'envie de fuir, de se défendre, de contrôler, de s'agiter ou de réagir vite."],
        ["Immobilisation / retrait", "blue", "Quand le système nerveux perçoit qu'il n'y a pas d'issue ou que c'est trop, il peut ralentir, figer ou couper certaines sensations. Cela peut donner une impression de vide, d'absence, de fatigue extrême, de brouillard ou d'effondrement."],
      ].map(([titre, color, txt]) => (
        <Card key={titre} c={c} style={{ background: c[color + "Soft"], border: "none", marginBottom: 14 }}>
          <div style={{ fontWeight: 700, color: c.text, marginBottom: 6 }}>{titre}</div>
          <div style={{ fontSize: 13, color: c.textSoft, lineHeight: 1.6 }}>{txt}</div>
        </Card>
      ))}
      <p style={{ color: c.textSoft, fontSize: 13, lineHeight: 1.6, marginTop: 10 }}>
        Ces états ne sont pas des cases fixes. On peut passer de l'un à l'autre rapidement, ou vivre plusieurs
        signes en même temps. L'objectif n'est pas de se diagnostiquer, mais de mieux se repérer.
      </p>
    </div>
  );
}

function ToleranceZone({ c, onBack, perso, onChange, onSave }) {
  const [saved, setSaved] = useState(false);
  const fields = [
    ["hyper", "Chez moi, l'hyperactivation ressemble à…"],
    ["hypo", "Chez moi, l'hypoactivation ressemble à…"],
    ["tolerance", "Quand je suis dans ma zone de tolérance, je remarque que…"],
    ["signes", "Les premiers signes qui montrent que je sors de ma zone de tolérance sont…"],
  ];
  return (
    <div>
      <BackRow c={c} onBack={onBack} label="Retour à l'accueil" />
      <ScreenTitle c={c}>Comprendre ma zone de tolérance</ScreenTitle>

      <p style={{ color: c.textSoft, fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>
        La zone de tolérance est l'espace dans lequel notre système nerveux peut ressentir des émotions, même
        désagréables, sans être complètement débordé. Quand nous sommes dans cette zone, nous pouvons encore
        réfléchir, communiquer, faire des choix et revenir progressivement à l'équilibre.
      </p>

      {/* Représentation simple à 3 bandes */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 22 }}>
        <div style={{ background: c.terracottaSoft, borderRadius: "12px 12px 0 0", padding: "10px 14px", fontSize: 13, color: c.text }}>
          Hyperactivation
        </div>
        <div style={{ background: c.sageSoft, padding: "18px 14px", fontSize: 13, color: c.text, fontWeight: 700, textAlign: "center" }}>
          Zone de tolérance
        </div>
        <div style={{ background: c.blueSoft, borderRadius: "0 0 12px 12px", padding: "10px 14px", fontSize: 13, color: c.text }}>
          Hypoactivation
        </div>
      </div>

      <Card c={c} style={{ background: c.terracottaSoft, border: "none", marginBottom: 10 }}>
        <p style={{ margin: 0, fontSize: 13, color: c.text, lineHeight: 1.6 }}>
          Quand le système nerveux perçoit un danger ou une menace, il peut accélérer. Ce n'est pas un échec :
          c'est une réaction de protection.
        </p>
      </Card>
      <Card c={c} style={{ background: c.blueSoft, border: "none", marginBottom: 24 }}>
        <p style={{ margin: 0, fontSize: 13, color: c.text, lineHeight: 1.6 }}>
          Quand le système nerveux est trop débordé ou trop épuisé, il peut ralentir ou se couper. Là aussi, ce
          n'est pas volontaire : c'est une réponse de protection.
        </p>
      </Card>

      <div style={{ fontFamily: fontDisplay, fontSize: 18, color: c.text, marginBottom: 12 }}>
        À vous de compléter, si cela vous convient
      </div>
      {fields.map(([key, label]) => (
        <div key={key} style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 13, color: c.textSoft, display: "block", marginBottom: 6 }}>{label}</label>
          <textarea
            value={perso[key]}
            onChange={(e) => { onChange(key, e.target.value); setSaved(false); }}
            rows={2}
            style={{
              width: "100%", borderRadius: 12, border: `1px solid ${c.border}`,
              background: c.card, color: c.text, padding: 10, fontFamily: fontBody, fontSize: 14, resize: "vertical",
            }}
          />
        </div>
      ))}
      <Btn c={c} variant="primary" onClick={() => { onSave(); setSaved(true); }} style={{ marginBottom: 20 }}>
        {saved ? "Enregistré ✓" : "Enregistrer"}
      </Btn>

      <p style={{ color: c.textSoft, fontSize: 13, lineHeight: 1.6 }}>
        Le but n'est pas d'être toujours dans sa zone de tolérance. Les variations sont normales. L'objectif est
        d'apprendre à repérer ce qui se passe et à revenir progressivement vers un peu plus de sécurité quand
        c'est possible.
      </p>
    </div>
  );
}

function Protection({ c, onBack, onExercises }) {
  const [open, setOpen] = useState(null);
  return (
    <div>
      <BackRow c={c} onBack={onBack} label="Retour à l'accueil" />
      <ScreenTitle c={c}>Fight, Flight, Freeze, Fawn</ScreenTitle>
      <p style={{ color: c.textSoft, fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
        Face à une menace réelle ou perçue, notre système nerveux peut déclencher des réponses automatiques de
        protection. Elles ne sont pas choisies volontairement. Elles ont pour fonction première de nous aider à
        survivre ou à préserver le lien quand celui-ci semble nécessaire à notre sécurité.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
        {FFFF_INFO.map((f) => {
          const isOpen = open === f.id;
          return (
            <div key={f.id} style={{ border: `1px solid ${c.border}`, borderRadius: 18, overflow: "hidden" }}>
              <button
                onClick={() => setOpen(isOpen ? null : f.id)}
                style={{
                  width: "100%", textAlign: "left", padding: 16, cursor: "pointer", border: "none",
                  background: c[f.color + "Soft"],
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}
              >
                <span style={{ fontWeight: 700, color: c.text }}>{f.label}</span>
                <span style={{ color: c.textSoft }}>{isOpen ? "–" : "+"}</span>
              </button>
              {isOpen && (
                <div style={{ padding: 16, background: c.card }}>
                  <p style={{ margin: "0 0 10px", fontSize: 14, color: c.text, lineHeight: 1.6 }}>{f.desc}</p>
                  <div style={{ fontSize: 12, color: c.textSoft, marginBottom: 6 }}>Signes possibles :</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                    {f.signes.map((s) => (
                      <span key={s} style={{ fontSize: 12, padding: "5px 10px", borderRadius: 999, background: c.bgAlt, color: c.textSoft }}>
                        {s}
                      </span>
                    ))}
                  </div>
                  <p style={{ margin: "0 0 14px", fontSize: 13, color: c.textSoft, fontStyle: "italic", lineHeight: 1.6 }}>
                    {f.phrase}
                  </p>
                  <Btn c={c} variant="secondary" onClick={() => onExercises(f.id)}>
                    Voir des exercices adaptés <span>→</span>
                  </Btn>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Card c={c} style={{ background: c.bgAlt, border: "none", marginBottom: 12 }}>
        <p style={{ margin: 0, fontSize: 13, color: c.textSoft, lineHeight: 1.6 }}>
          Ces réponses peuvent être utiles dans certains contextes. Elles deviennent surtout coûteuses lorsqu'elles
          se déclenchent très souvent, très intensément, ou dans des situations où le danger n'est plus actuel.
        </p>
      </Card>
      <Card c={c} style={{ background: c.bgAlt, border: "none" }}>
        <p style={{ margin: 0, fontSize: 13, color: c.textSoft, lineHeight: 1.6 }}>
          Les modèles comme la théorie polyvagale ou les réponses Fight, Flight, Freeze, Fawn peuvent aider à
          mettre du sens sur certaines expériences. Ils ne remplacent pas une évaluation clinique et ne résument
          jamais toute la complexité d'une personne.
        </p>
      </Card>
    </div>
  );
}

function Psychoeducation({ c, onBack }) {
  const [open, setOpen] = useState(null);
  return (
    <div>
      <BackRow c={c} onBack={onBack} label="Retour à l'accueil" />
      <ScreenTitle c={c}>Psychoéducation</ScreenTitle>
      <p style={{ color: c.textSoft, fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
        Des fiches courtes, lisibles en moins de deux minutes chacune.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {PSYCHOED_FICHES.map((fiche, i) => {
          const isOpen = open === i;
          return (
            <div key={i} style={{ border: `1px solid ${c.border}`, borderRadius: 16, overflow: "hidden" }}>
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                style={{
                  width: "100%", textAlign: "left", padding: 14, cursor: "pointer", border: "none",
                  background: c.card, color: c.text, fontWeight: 600, fontSize: 14,
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}
              >
                <span>{fiche.titre}</span>
                <span style={{ color: c.textSoft }}>{isOpen ? "–" : "+"}</span>
              </button>
              {isOpen && (
                <div style={{ padding: "0 14px 18px" }}>
                  {fiche.paragraphes.map((p, pi) => (
                    <p key={pi} style={{ margin: pi === 0 ? "0 0 10px" : "0 0 10px", fontSize: 13, color: c.textSoft, lineHeight: 1.65 }}>
                      {p}
                    </p>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   EXPORT DU JOURNAL — utilitaires
--------------------------------------------------------------- */
const PERIODES_JOURNAL = [
  { id: "7", label: "Les 7 derniers jours", jours: 7 },
  { id: "30", label: "Les 30 derniers jours", jours: 30 },
  { id: "90", label: "Les 3 derniers mois", jours: 90 },
  { id: "all", label: "Toutes mes données", jours: null },
];

const CHAMPS_EXPORT = [
  { id: "dates", label: "Dates et heures" },
  { id: "etats", label: "États repérés" },
  { id: "intensites", label: "Intensités" },
  { id: "protection", label: "Réponses de protection reconnues" },
  { id: "exercices", label: "Exercices essayés" },
  { id: "retours", label: "Retours après les exercices" },
];

function entriesDansPeriode(entries, periodeId) {
  const p = PERIODES_JOURNAL.find((x) => x.id === periodeId);
  if (!p || p.jours === null) return entries;
  const cutoff = Date.now() - p.jours * 86400000;
  return entries.filter((e) => new Date(e.date).getTime() >= cutoff);
}

function formatDateFr(d) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

const SAFETY_FIELDS = [
  ["signes", "Quand je vais mal, les signes à surveiller sont…"],
  ["personnes", "Les personnes que je peux contacter sont…"],
  ["lieux", "Les lieux où je peux aller sont…"],
  ["eviter", "Les choses à éviter quand je suis débordé·e sont…"],
  ["phrases", "Les phrases qui peuvent m'aider sont…"],
  ["numeros", "Les numéros d'urgence ou de soutien sont…"],
];

function safetyPlanHasContent(plan) {
  return !!plan && SAFETY_FIELDS.some(([key]) => plan[key] && plan[key].trim().length > 0);
}

function ajouterEnteteIdentite(doc, marge, y, personalInfo) {
  if (!personalInfo) return y;
  const lignes = [];
  if (personalInfo.prenom && personalInfo.prenom.trim()) lignes.push(`Prénom : ${personalInfo.prenom.trim()}`);
  if (personalInfo.nom && personalInfo.nom.trim()) lignes.push(`Nom : ${personalInfo.nom.trim()}`);
  if (personalInfo.dateNaissance && personalInfo.dateNaissance.trim()) {
    lignes.push(`Date de naissance : ${new Date(personalInfo.dateNaissance).toLocaleDateString("fr-FR")}`);
  }
  if (lignes.length === 0) return y;
  doc.setFontSize(10);
  doc.setTextColor(110, 100, 90);
  lignes.forEach((l) => { doc.text(l, marge, y); y += 5.5; });
  doc.setTextColor(40, 38, 34);
  return y + 4;
}

function ajouterSectionReperes(doc, marge, y, plan) {
  if (y > 250) { doc.addPage(); y = 20; }
  doc.setFontSize(13);
  doc.setFont(undefined, "bold");
  doc.text("Mes repères de sécurité", marge, y); y += 8;
  doc.setFont(undefined, "normal");
  doc.setFontSize(10);
  SAFETY_FIELDS.forEach(([key, label]) => {
    const val = plan[key];
    if (!val || !val.trim()) return;
    if (y > 265) { doc.addPage(); y = 20; }
    doc.setFont(undefined, "bold");
    const labelLines = doc.splitTextToSize(label, 180);
    doc.text(labelLines, marge, y); y += labelLines.length * 5.5 + 1;
    doc.setFont(undefined, "normal");
    const valLines = doc.splitTextToSize(val.trim(), 180);
    doc.text(valLines, marge, y); y += valLines.length * 5.5 + 7;
  });
  return y;
}

function ajouterEntreesJournal(doc, marge, y, entriesFiltrees, champs) {
  const sorted = [...entriesFiltrees].sort((a, b) => new Date(b.date) - new Date(a.date));
  sorted.forEach((e) => {
    if (y > 265) { doc.addPage(); y = 20; }
    doc.setFontSize(11);
    doc.setFont(undefined, "bold");
    const dateLabel = champs.dates
      ? new Date(e.date).toLocaleString("fr-FR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })
      : "Entrée";
    doc.text(dateLabel, marge, y); y += 7;
    doc.setFont(undefined, "normal");
    doc.setFontSize(10);

    if (e.type === "check-in") {
      if (champs.etats && e.etat) {
        const lbl = NS_STATES.find((s) => s.id === e.etat)?.label;
        if (lbl) { doc.text(`État repéré : ${lbl}`, marge, y); y += 6; }
      }
      if (champs.intensites && e.intensite !== null && e.intensite !== undefined) {
        doc.text(`Intensité indiquée : ${e.intensite}/10`, marge, y); y += 6;
      }
      if (champs.protection && e.ffff) {
        const flbl = FFFF_INFO.find((f) => f.id === e.ffff)?.label;
        if (flbl) { doc.text(`Réponse de protection reconnue : ${flbl}`, marge, y); y += 6; }
      }
    } else {
      if (champs.exercices) { doc.text(`Exercice essayé : ${e.exercice}`, marge, y); y += 6; }
      if (champs.retours && e.effet) { doc.text(`Retour après l'exercice : ${e.effet}`, marge, y); y += 6; }
      if (champs.retours && e.remarque) { doc.text(`Ce qui a été remarqué : ${e.remarque}`, marge, y); y += 6; }
    }
    y += 4;
  });
  if (sorted.length === 0) {
    doc.setFontSize(11);
    doc.text("Aucune entrée sur cette période.", marge, y); y += 8;
  }
  return y;
}

function ajouterPiedDePage(doc) {
  const nbPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= nbPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 145, 135);
    doc.text(MENTION_PROPRIETE, 15, 290);
    doc.setTextColor(40, 38, 34);
  }
}

function genererPdfJournal(entriesFiltrees, champs, periodeLabel, personalInfo, safetyPlan) {
  const doc = new jsPDF();
  const marge = 15;
  let y = 20;

  doc.setFontSize(18);
  doc.text("Mon journal de suivi", marge, y); y += 10;
  y = ajouterEnteteIdentite(doc, marge, y, personalInfo);
  doc.setFontSize(11);
  doc.setTextColor(110, 100, 90);
  doc.text(`Période : ${periodeLabel}`, marge, y); y += 8;
  doc.setFontSize(9);
  const disclaimer = "Ce document rassemble les informations que vous avez choisi d'enregistrer et d'exporter depuis l'application. Il ne constitue pas un diagnostic ni une évaluation clinique.";
  const disclaimerLines = doc.splitTextToSize(disclaimer, 180);
  doc.text(disclaimerLines, marge, y); y += disclaimerLines.length * 5 + 8;
  doc.setTextColor(40, 38, 34);

  y = ajouterEntreesJournal(doc, marge, y, entriesFiltrees, champs);

  if (safetyPlan && safetyPlanHasContent(safetyPlan)) {
    y += 6;
    y = ajouterSectionReperes(doc, marge, y, safetyPlan);
  }

  ajouterPiedDePage(doc);
  return doc;
}

function genererPdfReperes(plan, personalInfo, entriesFiltrees, champs, periodeLabelJournal) {
  const doc = new jsPDF();
  const marge = 15;
  let y = 20;

  doc.setFontSize(18);
  doc.text("Mes repères de sécurité", marge, y); y += 10;
  y = ajouterEnteteIdentite(doc, marge, y, personalInfo);
  doc.setFontSize(9);
  doc.setTextColor(110, 100, 90);
  const disclaimer = "Ce document rassemble les informations que vous avez choisi d'enregistrer et d'exporter depuis l'application. Il ne constitue pas un diagnostic ni une évaluation clinique.";
  const dLines = doc.splitTextToSize(disclaimer, 180);
  doc.text(dLines, marge, y); y += dLines.length * 5 + 8;
  doc.setTextColor(40, 38, 34);

  y = ajouterSectionReperes(doc, marge, y, plan);

  if (entriesFiltrees && entriesFiltrees.length >= 0 && champs) {
    y += 6;
    doc.setFontSize(9);
    doc.setTextColor(110, 100, 90);
    doc.text(`Journal de suivi — période : ${periodeLabelJournal}`, marge, y); y += 8;
    doc.setTextColor(40, 38, 34);
    y = ajouterEntreesJournal(doc, marge, y, entriesFiltrees, champs);
  }

  ajouterPiedDePage(doc);
  return doc;
}

function telechargerOuPartagerPdf(doc, nomFichier) {
  const blob = doc.output("blob");
  const file = new File([blob], nomFichier, { type: "application/pdf" });
  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    navigator.share({ files: [file], title: nomFichier }).catch(() => doc.save(nomFichier));
  } else {
    doc.save(nomFichier);
  }
}

function calculerResumeRendezVous(entriesFiltrees) {
  const etatCounts = {};
  const exoCounts = {};
  const effetParExo = {};
  entriesFiltrees.forEach((e) => {
    if (e.type === "check-in" && e.etat) etatCounts[e.etat] = (etatCounts[e.etat] || 0) + 1;
    if (e.type === "exercice") {
      exoCounts[e.exercice] = (exoCounts[e.exercice] || 0) + 1;
      if (e.effet) {
        effetParExo[e.exercice] = effetParExo[e.exercice] || [];
        effetParExo[e.exercice].push(e.effet);
      }
    }
  });
  const topEtat = Object.entries(etatCounts).sort((a, b) => b[1] - a[1])[0];
  const topExos = Object.entries(exoCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const aides = Object.entries(effetParExo)
    .filter(([, effets]) => effets.some((x) => x === "Beaucoup" || x === "Un peu"))
    .map(([titre]) => titre).slice(0, 3);
  const moinsAides = Object.entries(effetParExo)
    .filter(([, effets]) => effets.some((x) => x === "Pas vraiment" || x === "Je préfère l'éviter"))
    .map(([titre]) => titre).slice(0, 3);
  return { topEtat, topExos, aides, moinsAides };
}

function genererPdfRendezVous(entriesFiltrees, periodeLabel, question, personalInfo) {
  const doc = new jsPDF();
  const marge = 15;
  let y = 20;
  const resume = calculerResumeRendezVous(entriesFiltrees);

  doc.setFontSize(18);
  doc.text("Préparer mon prochain rendez-vous", marge, y); y += 10;
  y = ajouterEnteteIdentite(doc, marge, y, personalInfo);
  doc.setFontSize(11);
  doc.setTextColor(110, 100, 90);
  doc.text(`Période : ${periodeLabel}`, marge, y); y += 10;
  doc.setTextColor(40, 38, 34);
  doc.setFontSize(9);
  const disclaimer = "Ce document ne constitue pas un diagnostic ni une évaluation clinique. Il rassemble des tendances observées à partir de ce que la personne a choisi d'enregistrer.";
  const dLines = doc.splitTextToSize(disclaimer, 180);
  doc.text(dLines, marge, y); y += dLines.length * 5 + 10;

  const section = (titre, texte) => {
    if (y > 260) { doc.addPage(); y = 20; }
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text(titre, marge, y); y += 7;
    doc.setFont(undefined, "normal");
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(texte, 180);
    doc.text(lines, marge, y); y += lines.length * 5.5 + 8;
  };

  section("Ce que j'ai le plus souvent repéré",
    resume.topEtat
      ? `Sur la période sélectionnée, vous avez plusieurs fois indiqué vous reconnaître dans un état de ${NS_STATES.find((s) => s.id === resume.topEtat[0])?.label || resume.topEtat[0]}.`
      : "Aucun état n'a été repéré de façon récurrente sur cette période.");

  section("Les exercices que j'ai le plus essayés",
    resume.topExos.length > 0
      ? resume.topExos.map(([titre, n]) => `${titre} (${n} fois)`).join(", ") + "."
      : "Aucun exercice essayé sur cette période.");

  section("Ce qui a semblé le plus souvent m'aider",
    resume.aides.length > 0
      ? `Les exercices suivants semblent avoir été plus souvent associés à un retour positif : ${resume.aides.join(", ")}.`
      : "Rien de suffisamment répété pour l'indiquer sur cette période.");

  section("Ce qui m'a moins convenu",
    resume.moinsAides.length > 0
      ? `Vous avez indiqué préférer éviter ou moins apprécier : ${resume.moinsAides.join(", ")}.`
      : "Rien de particulier n'a été indiqué comme peu aidant sur cette période.");

  if (question && question.trim()) {
    section("Ce que j'aimerais aborder", question.trim());
  }

  ajouterPiedDePage(doc);
  return doc;
}

function CeQuiMaide({ c, onBack, feedback, customExercises, entries, onPick, onGoLibrary }) {
  const [showEviter, setShowEviter] = useState(false);
  const toutesLesExercices = [...EXERCISES, ...customExercises];

  const dernierContexte = (titre) => {
    const derniere = entries.find((e) => e.type === "exercice" && e.exercice === titre);
    if (!derniere) return null;
    const parts = [];
    if (derniere.etat) parts.push(NS_STATES.find((s) => s.id === derniere.etat)?.label);
    if (derniere.intensite !== null && derniere.intensite !== undefined) parts.push(`intensité ${derniere.intensite}/10`);
    return parts.length > 0 ? parts.join(" · ") : null;
  };

  const groupes = { souvent: [], parfois: [], eviter: [] };
  let essayes = 0;
  toutesLesExercices.forEach((ex) => {
    const f = feedback[ex.id];
    if (!f) return;
    essayes++;
    if (f === "Beaucoup" || f === "Un peu") groupes.souvent.push(ex);
    else if (f === "Cela dépend") groupes.parfois.push(ex);
    else if (f === "Pas vraiment" || f === "Je préfère l'éviter") groupes.eviter.push(ex);
  });
  const nonEssayes = toutesLesExercices.length - essayes;

  const ExoRow = ({ ex }) => (
    <button onClick={() => onPick(ex)} style={{
      textAlign: "left", cursor: "pointer", border: `1px solid ${c.border}`, background: c.card,
      borderRadius: 16, padding: 14, width: "100%",
    }}>
      <div style={{ fontWeight: 700, color: c.text, fontSize: 14.5, marginBottom: 3 }}>{ex.titre}</div>
      {dernierContexte(ex.titre) && (
        <div style={{ fontSize: 11.5, color: c.textSoft }}>Dernière fois : {dernierContexte(ex.titre)}</div>
      )}
    </button>
  );

  return (
    <div>
      <BackRow c={c} onBack={onBack} label="Retour à l'accueil" />
      <ScreenTitle c={c}>Ce qui m'aide</ScreenTitle>
      <p style={{ color: c.textSoft, fontSize: 13, lineHeight: 1.6, marginBottom: 22 }}>
        Ce n'est pas un classement de réussite. C'est un espace pour repérer, au fil du temps, ce qui semble vous
        convenir — et ce que vous préférez éviter. Cela peut changer d'un jour à l'autre.
      </p>

      {essayes === 0 ? (
        <Card c={c} style={{ background: c.bgAlt, border: "none", marginBottom: 20 }}>
          <p style={{ margin: 0, fontSize: 13.5, color: c.textSoft, lineHeight: 1.6 }}>
            Rien n'est encore noté. Après un exercice, vous pourrez indiquer s'il vous a aidé — cet espace se
            remplira progressivement à partir de vos retours.
          </p>
        </Card>
      ) : (
        <>
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 12.5, color: c.sage, fontWeight: 700, marginBottom: 10 }}>M'aide souvent</div>
            {groupes.souvent.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {groupes.souvent.map((ex) => <ExoRow key={ex.id} ex={ex} />)}
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: 12.5, color: c.textSoft }}>Rien pour l'instant dans cette catégorie.</p>
            )}
          </div>

          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 12.5, color: c.blue, fontWeight: 700, marginBottom: 10 }}>Peut m'aider selon les moments</div>
            {groupes.parfois.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {groupes.parfois.map((ex) => <ExoRow key={ex.id} ex={ex} />)}
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: 12.5, color: c.textSoft }}>Rien pour l'instant dans cette catégorie.</p>
            )}
          </div>

          {groupes.eviter.length > 0 && (
            <div style={{ marginBottom: 22 }}>
              <button onClick={() => setShowEviter((s) => !s)} style={{
                background: "none", border: "none", padding: 0, cursor: "pointer",
                fontSize: 12.5, color: c.textSoft, fontWeight: 700, marginBottom: 10, display: "block",
              }}>
                Je préfère éviter ({groupes.eviter.length}) {showEviter ? "–" : "+"}
              </button>
              {showEviter && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {groupes.eviter.map((ex) => <ExoRow key={ex.id} ex={ex} />)}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {nonEssayes > 0 && (
        <Card c={c} style={{ background: c.bgAlt, border: "none", marginBottom: 12 }}>
          <p style={{ margin: "0 0 10px", fontSize: 12.5, color: c.textSoft, lineHeight: 1.6 }}>
            {nonEssayes} exercice{nonEssayes > 1 ? "s" : ""} n'{nonEssayes > 1 ? "ont" : "a"} pas encore été essayé{nonEssayes > 1 ? "s" : ""} — ce n'est pas grave, rien n'oblige à tout essayer.
          </p>
          <Btn c={c} variant="secondary" onClick={onGoLibrary}>Découvrir dans la bibliothèque <span>→</span></Btn>
        </Card>
      )}
    </div>
  );
}

function Journal({ c, onBack, entries, onGoExport, onGoRdv }) {
  const [showHelp, setShowHelp] = useState(false);
  return (
    <div>
      <BackRow c={c} onBack={onBack} label="Retour à l'accueil" />
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
        <ScreenTitle c={c}>Mon suivi personnel</ScreenTitle>
        <button onClick={() => setShowHelp((s) => !s)} aria-label="À quoi sert le journal ?" style={{
          width: 22, height: 22, borderRadius: "50%", border: `1px solid ${c.border}`, background: c.card,
          color: c.textSoft, fontSize: 12, cursor: "pointer", flexShrink: 0, marginTop: -10,
        }}>?</button>
      </div>
      <p style={{ color: c.textSoft, fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
        Ce suivi n'est pas là pour mesurer une performance. Il peut simplement vous aider à mieux connaître votre
        fonctionnement et à repérer ce qui vous soutient.
      </p>

      {showHelp && (
        <Card c={c} style={{ background: c.bgAlt, border: "none", marginBottom: 16 }}>
          <div style={{ fontWeight: 700, color: c.text, marginBottom: 8, fontSize: 14 }}>À quoi sert le journal ?</div>
          <p style={{ fontSize: 12.5, color: c.textSoft, lineHeight: 1.6, margin: "0 0 8px" }}>
            Le journal vous permet de garder une trace de ce que vous avez choisi d'enregistrer : états repérés,
            exercices essayés et retours éventuels. Vous pouvez l'utiliser uniquement pour vous-même.
          </p>
          <p style={{ fontSize: 12.5, color: c.textSoft, lineHeight: 1.6, margin: "0 0 8px" }}>
            Vous pouvez aussi choisir d'en exporter une partie sous forme de PDF, par exemple pour préparer un
            rendez-vous avec un professionnel.
          </p>
          <p style={{ fontSize: 12.5, color: c.text, lineHeight: 1.6, margin: "0 0 8px", fontWeight: 600 }}>
            Vous décidez toujours de ce que vous enregistrez, de ce que vous exportez et de ce que vous partagez.
          </p>
          <p style={{ fontSize: 12.5, color: c.textSoft, lineHeight: 1.6, margin: 0 }}>
            Aucun journal ni PDF n'est envoyé automatiquement à un professionnel.
          </p>
        </Card>
      )}

      {entries.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
          <button onClick={onGoExport} style={{ fontSize: 12.5, color: c.text, background: c.bgAlt, border: "none", borderRadius: 999, padding: "8px 13px", cursor: "pointer" }}>
            Exporter mon journal
          </button>
          <button onClick={onGoRdv} style={{ fontSize: 12.5, color: c.text, background: c.sageSoft, border: "none", borderRadius: 999, padding: "8px 13px", cursor: "pointer" }}>
            Préparer mon prochain rendez-vous
          </button>
        </div>
      )}

      {entries.length === 0 && (
        <Card c={c} style={{ background: c.bgAlt, border: "none" }}>
          <p style={{ margin: 0, color: c.textSoft, fontSize: 14 }}>
            Rien n'est encore enregistré. Vos observations et exercices apparaîtront ici au fil du temps.
          </p>
        </Card>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {entries.map((e, i) => (
          <Card key={i} c={c}>
            <div style={{ fontSize: 11, color: c.textSoft, marginBottom: 6 }}>
              {new Date(e.date).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
            </div>
            {e.type === "check-in" ? (
              <div style={{ fontSize: 14, color: c.text }}>
                Observation — intensité {e.intensite}/10
                {e.etat && <> · {NS_STATES.find((s) => s.id === e.etat)?.label}</>}
                {e.ffff && FFFF_INFO.find((f) => f.id === e.ffff) && <> · {FFFF_INFO.find((f) => f.id === e.ffff).label}</>}
              </div>
            ) : (
              <div style={{ fontSize: 14, color: c.text }}>
                Exercice « {e.exercice} » — effet ressenti : {e.effet}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

function JournalExportSelect({ c, onBack, champs, setChamps, periode, setPeriode, onNext }) {
  return (
    <div>
      <BackRow c={c} onBack={onBack} label="Retour au journal" />
      <ScreenTitle c={c}>Que souhaitez-vous inclure ?</ScreenTitle>
      <p style={{ color: c.textSoft, fontSize: 13, lineHeight: 1.6, marginBottom: 18 }}>
        Vous décidez toujours de ce que vous exportez. Rien n'est envoyé automatiquement à qui que ce soit.
      </p>

      <div style={{ fontSize: 12, color: c.textSoft, marginBottom: 8 }}>À inclure</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
        {CHAMPS_EXPORT.map((ch) => (
          <label key={ch.id} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: c.text, cursor: "pointer" }}>
            <input type="checkbox" checked={!!champs[ch.id]}
              onChange={(e) => setChamps((prev) => ({ ...prev, [ch.id]: e.target.checked }))}
              style={{ width: 17, height: 17, accentColor: c.sage }} />
            {ch.label}
          </label>
        ))}
      </div>

      <div style={{ fontSize: 12, color: c.textSoft, marginBottom: 8 }}>Période</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
        {PERIODES_JOURNAL.map((p) => (
          <button key={p.id} onClick={() => setPeriode(p.id)}
            style={{
              textAlign: "left", padding: "11px 14px", borderRadius: 12, cursor: "pointer",
              border: `1px solid ${periode === p.id ? c.sage : c.border}`,
              background: periode === p.id ? c.sageSoft : c.card, color: c.text, fontSize: 14,
            }}>
            {p.label}
          </button>
        ))}
      </div>

      <Btn c={c} variant="primary" onClick={onNext}>Aperçu de mon export <span>→</span></Btn>
    </div>
  );
}

function JournalExportPreview({ c, onBack, champs, periode, entries, safetyPlan, inclureReperes, setInclureReperes, onCreate, onCancel }) {
  const periodeLabel = PERIODES_JOURNAL.find((p) => p.id === periode)?.label || "";
  const filtrees = entriesDansPeriode(entries, periode);
  const inclus = CHAMPS_EXPORT.filter((ch) => champs[ch.id]).map((ch) => ch.label);
  const exclus = CHAMPS_EXPORT.filter((ch) => !champs[ch.id]).map((ch) => ch.label);
  const reperesDisponibles = safetyPlanHasContent(safetyPlan);
  return (
    <div>
      <BackRow c={c} onBack={onBack} label="Modifier ma sélection" />
      <ScreenTitle c={c}>Aperçu de ce que vous allez exporter</ScreenTitle>
      <Card c={c} style={{ marginBottom: 20 }}>
        <p style={{ margin: "0 0 8px", fontSize: 13.5, color: c.text }}>{periodeLabel}</p>
        <p style={{ margin: "0 0 12px", fontSize: 13.5, color: c.text }}>{filtrees.length} entrée{filtrees.length > 1 ? "s" : ""} du journal</p>
        <p style={{ margin: "0 0 4px", fontSize: 12.5, color: c.textSoft }}>Vous avez choisi d'inclure :</p>
        <p style={{ margin: "0 0 10px", fontSize: 13, color: c.text }}>{inclus.length > 0 ? inclus.join(", ") : "aucune catégorie"}</p>
        {exclus.length > 0 && (
          <>
            <p style={{ margin: "0 0 4px", fontSize: 12.5, color: c.textSoft }}>Vous avez choisi de ne pas inclure :</p>
            <p style={{ margin: 0, fontSize: 13, color: c.text }}>{exclus.join(", ")}</p>
          </>
        )}
      </Card>

      {reperesDisponibles && (
        <Card c={c} style={{ marginBottom: 20, background: c.bgAlt, border: "none" }}>
          <p style={{ margin: "0 0 12px", fontSize: 13.5, color: c.text, fontWeight: 600 }}>
            Souhaitez-vous également inclure vos repères de sécurité dans ce PDF ?
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Btn c={c} variant={inclureReperes ? "primary" : "secondary"} onClick={() => setInclureReperes(true)}>
              Oui, inclure mes repères de sécurité
            </Btn>
            <Btn c={c} variant={!inclureReperes ? "primary" : "secondary"} onClick={() => setInclureReperes(false)}>
              Non, exporter uniquement mon journal
            </Btn>
          </div>
        </Card>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Btn c={c} variant="primary" onClick={onCreate}>Créer le PDF <span>↓</span></Btn>
        <Btn c={c} variant="secondary" onClick={onBack}>Modifier ma sélection</Btn>
        <Btn c={c} variant="ghost" onClick={onCancel}>Annuler</Btn>
      </div>
    </div>
  );
}

function RdvExportSelect({ c, onBack, periode, setPeriode, question, setQuestion, onNext }) {
  return (
    <div>
      <BackRow c={c} onBack={onBack} label="Retour au journal" />
      <ScreenTitle c={c}>Préparer mon prochain rendez-vous</ScreenTitle>
      <p style={{ color: c.textSoft, fontSize: 13, lineHeight: 1.6, marginBottom: 18 }}>
        Ce résumé, plus court que l'export complet, peut aider à montrer rapidement à votre thérapeute ce qui
        s'est passé depuis le dernier rendez-vous.
      </p>
      <div style={{ fontSize: 12, color: c.textSoft, marginBottom: 8 }}>Période</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
        {PERIODES_JOURNAL.map((p) => (
          <button key={p.id} onClick={() => setPeriode(p.id)}
            style={{
              textAlign: "left", padding: "11px 14px", borderRadius: 12, cursor: "pointer",
              border: `1px solid ${periode === p.id ? c.sage : c.border}`,
              background: periode === p.id ? c.sageSoft : c.card, color: c.text, fontSize: 14,
            }}>
            {p.label}
          </button>
        ))}
      </div>
      <label style={{ fontSize: 13, color: c.textSoft, display: "block", marginBottom: 8 }}>
        Ce que j'aimerais aborder (optionnel)
      </label>
      <textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={3}
        placeholder="Une question, une note, un sujet…"
        style={{ width: "100%", borderRadius: 12, border: `1px solid ${c.border}`, background: c.card, color: c.text, padding: 10, fontFamily: fontBody, fontSize: 14, resize: "vertical", marginBottom: 22 }} />
      <Btn c={c} variant="primary" onClick={onNext}>Aperçu du résumé <span>→</span></Btn>
    </div>
  );
}

function RdvExportPreview({ c, onBack, periode, entries, question, onCreate, onCancel }) {
  const periodeLabel = PERIODES_JOURNAL.find((p) => p.id === periode)?.label || "";
  const filtrees = entriesDansPeriode(entries, periode);
  const resume = calculerResumeRendezVous(filtrees);
  return (
    <div>
      <BackRow c={c} onBack={onBack} label="Modifier ma sélection" />
      <ScreenTitle c={c}>Aperçu du résumé</ScreenTitle>
      <Card c={c} style={{ marginBottom: 20 }}>
        <p style={{ margin: "0 0 10px", fontSize: 13.5, color: c.text, fontWeight: 600 }}>{periodeLabel}</p>
        <p style={{ margin: "0 0 6px", fontSize: 12.5, color: c.textSoft }}>Ce que j'ai le plus souvent repéré</p>
        <p style={{ margin: "0 0 12px", fontSize: 13, color: c.text }}>
          {resume.topEtat ? `Un état de ${NS_STATES.find((s) => s.id === resume.topEtat[0])?.label || resume.topEtat[0]}, plusieurs fois.` : "Rien de récurrent sur cette période."}
        </p>
        <p style={{ margin: "0 0 6px", fontSize: 12.5, color: c.textSoft }}>Exercices les plus essayés</p>
        <p style={{ margin: 0, fontSize: 13, color: c.text }}>
          {resume.topExos.length > 0 ? resume.topExos.map(([t]) => t).join(", ") : "Aucun sur cette période."}
        </p>
      </Card>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Btn c={c} variant="primary" onClick={onCreate}>Créer le PDF <span>↓</span></Btn>
        <Btn c={c} variant="secondary" onClick={onBack}>Modifier ma sélection</Btn>
        <Btn c={c} variant="ghost" onClick={onCancel}>Annuler</Btn>
      </div>
    </div>
  );
}

function Settings({ c, theme, toggleTheme, onBack, onWipe, personalInfo, onChangePersonalInfo, onSavePersonalInfo }) {
  const [confirm, setConfirm] = useState(false);
  const [showColors, setShowColors] = useState(false);
  const [savedInfo, setSavedInfo] = useState(false);
  const inputStyle = { width: "100%", borderRadius: 12, border: `1px solid ${c.border}`, background: c.card, color: c.text, padding: 10, fontFamily: fontBody, fontSize: 14 };
  return (
    <div>
      <BackRow c={c} onBack={onBack} label="Retour à l'accueil" />
      <ScreenTitle c={c}>Réglages</ScreenTitle>

      <Card c={c} style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: c.text, fontSize: 15 }}>Apparence</span>
          <button onClick={toggleTheme} style={{ background: c.bgAlt, border: "none", borderRadius: 999, padding: "8px 14px", fontSize: 13, color: c.text, cursor: "pointer" }}>
            {theme === "light" ? "Clair" : "Sombre"}
          </button>
        </div>
      </Card>

      <Card c={c} style={{ marginBottom: 14 }}>
        <p style={{ margin: "0 0 4px", fontSize: 15, color: c.text, fontWeight: 600 }}>Informations personnelles</p>
        <p style={{ margin: "0 0 14px", fontSize: 12.5, color: c.textSoft, lineHeight: 1.6 }}>
          Ces informations sont facultatives. Elles permettent uniquement de personnaliser vos documents
          exportés (et le message d'accueil pour le prénom).
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: c.textSoft, display: "block", marginBottom: 5 }}>Prénom</label>
            <input type="text" value={personalInfo.prenom}
              onChange={(e) => { onChangePersonalInfo("prenom", e.target.value); setSavedInfo(false); }}
              style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: c.textSoft, display: "block", marginBottom: 5 }}>Nom</label>
            <input type="text" value={personalInfo.nom}
              onChange={(e) => { onChangePersonalInfo("nom", e.target.value); setSavedInfo(false); }}
              style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: c.textSoft, display: "block", marginBottom: 5 }}>Date de naissance</label>
            <input type="date" value={personalInfo.dateNaissance}
              onChange={(e) => { onChangePersonalInfo("dateNaissance", e.target.value); setSavedInfo(false); }}
              style={inputStyle} />
          </div>
        </div>
        <Btn c={c} variant="secondary" onClick={() => { onSavePersonalInfo(); setSavedInfo(true); }}>
          {savedInfo ? "Enregistré ✓" : "Enregistrer"}
        </Btn>
      </Card>

      <Card c={c} style={{ marginBottom: 14 }}>
        <button onClick={() => setShowColors((s) => !s)} style={{
          width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer",
          display: "flex", justifyContent: "space-between", alignItems: "center", padding: 0,
        }}>
          <span style={{ color: c.text, fontSize: 15, fontWeight: 600 }}>Couleurs des exercices</span>
          <span style={{ color: c.textSoft }}>{showColors ? "–" : "+"}</span>
        </button>
        {showColors && (
          <div style={{ marginTop: 14 }}>
            <p style={{ fontSize: 12.5, color: c.textSoft, lineHeight: 1.6, marginBottom: 12 }}>
              Chaque couleur représente une fonction que peut avoir un exercice — jamais un état psychologique
              ou un diagnostic.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {Object.entries(FAMILIES).map(([key, fam]) => (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 16, height: 16, borderRadius: 6, background: c[fam.color + "Soft"], border: `1px solid ${c.border}` }} />
                  <span style={{ fontSize: 13, color: c.text }}>{fam.label}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 11.5, color: c.textSoft, marginTop: 12, lineHeight: 1.5 }}>
              Les couleurs servent seulement à vous aider à vous repérer dans la bibliothèque. Elles ne
              représentent en aucun cas un diagnostic ni une évaluation de votre état.
            </p>
          </div>
        )}
      </Card>

      <Card c={c} style={{ marginBottom: 14 }}>
        <p style={{ margin: "0 0 6px", fontSize: 13, color: c.text, fontWeight: 600 }}>À propos de cette application</p>
        <p style={{ margin: "0 0 10px", fontSize: 12.5, color: c.textSoft, lineHeight: 1.6 }}>
          Cette application est un outil de soutien et de psychoéducation. Elle ne remplace pas un suivi
          médical, psychologique ou psychiatrique, et ne pose aucun diagnostic. Elle ne surveille pas votre
          état : aucune information n'est envoyée automatiquement à qui que ce soit.
        </p>
        <p style={{ margin: 0, fontSize: 11, color: c.textSoft, opacity: 0.8 }}>{MENTION_PROPRIETE}</p>
      </Card>

      <Card c={c} style={{ marginBottom: 14 }}>
        <p style={{ margin: "0 0 10px", fontSize: 13, color: c.textSoft, lineHeight: 1.6 }}>
          Vos données (repères de sécurité, suivi personnel) sont enregistrées uniquement pour votre usage. Elles
          concernent potentiellement votre santé ou votre vécu émotionnel et méritent une attention particulière.
        </p>
        {!confirm ? (
          <Btn c={c} variant="warn" onClick={() => setConfirm(true)}>Supprimer toutes mes données</Btn>
        ) : (
          <div>
            <p style={{ fontSize: 13, color: c.text, marginBottom: 10 }}>
              Cette action est définitive. Confirmer ?
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn c={c} variant="warn" onClick={onWipe}>Oui, tout supprimer</Btn>
              <Btn c={c} variant="secondary" onClick={() => setConfirm(false)}>Annuler</Btn>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
