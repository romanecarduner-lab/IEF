"use client";

/**
 * Bouton de suppression d'une activite avec confirmation : la suppression
 * est definitive, elle ne doit pas pouvoir partir d'un simple toucher
 * accidentel au milieu de la liste.
 */
export function BoutonSupprimerActivite({ titre }: { titre: string }) {
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (!window.confirm(`Supprimer « ${titre} » ? Cette action est définitive.`)) {
          e.preventDefault();
        }
      }}
      className="min-h-[40px] px-1 text-sm text-alerte underline decoration-alerte/40 underline-offset-2 hover:decoration-alerte"
    >
      Supprimer
    </button>
  );
}
