"use client";

/**
 * Bouton de suppression avec confirmation, a placer dans un <form action=...>
 * qui porte l'action serveur : un simple toucher accidentel ne doit pas
 * suffire a supprimer definitivement un element.
 */
export function BoutonSupprimerConfirme({ nom, type }: { nom: string; type: string }) {
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (!window.confirm(`Supprimer ${type} « ${nom} » ? Cette action est définitive.`)) {
          e.preventDefault();
        }
      }}
      className="min-h-[40px] px-1 text-sm text-alerte underline decoration-alerte/40 underline-offset-2 hover:decoration-alerte"
    >
      Supprimer
    </button>
  );
}
