"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Champ, MessageStatut } from "@/components/Formulaire";
import { creerTrace } from "./actions";
import { creerClientNavigateur } from "@/lib/supabase/client";
import { preparerImage, estImage } from "@/lib/compressionImage";
import { avecDelaiMaximal, messagePourErreurInattendue } from "@/lib/delaiMaximal";

type TypeOption = { code: string; libelle: string };

const TYPES_AVEC_FICHIER = new Set(["photo", "production", "document", "pdf"]);
const TYPES_AVEC_TEXTE = new Set(["citation", "observation_parentale"]);

export function FormulaireTrace({
  activiteId,
  familleId,
  types,
}: {
  activiteId: string;
  familleId: string;
  types: TypeOption[];
}) {
  const router = useRouter();
  const inputFichierRef = useRef<HTMLInputElement>(null);

  const [typeCode, setTypeCode] = useState(types[0]?.code ?? "");
  const [legende, setLegende] = useState("");
  const [contenuTexte, setContenuTexte] = useState("");
  const [dateTrace, setDateTrace] = useState(new Date().toISOString().slice(0, 10));
  const [chargement, setChargement] = useState(false);
  const [etapeEnvoi, setEtapeEnvoi] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const attendFichier = TYPES_AVEC_FICHIER.has(typeCode);
  const attendTexte = TYPES_AVEC_TEXTE.has(typeCode);

  async function gererEnvoi(evenement: React.FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    setErreur(null);

    const fichier = inputFichierRef.current?.files?.[0] ?? null;

    if (attendFichier && !fichier) {
      setErreur("Merci de choisir un fichier.");
      return;
    }
    if (attendTexte && !contenuTexte.trim()) {
      setErreur("Merci de saisir un texte.");
      return;
    }

    setChargement(true);

    try {
      let cheminStockage: string | null = null;
      let miniatureCheminStockage: string | null = null;

      if (fichier) {
        const supabase = creerClientNavigateur();
        const idTrace = crypto.randomUUID();
        const extension = estImage(fichier) ? "jpg" : fichier.name.split(".").pop() || "bin";

        if (estImage(fichier)) {
          setEtapeEnvoi("Compression de l'image…");
          const { image, miniature } = await preparerImage(fichier);

          setEtapeEnvoi("Envoi de l'image…");
          const cheminImage = `${familleId}/${idTrace}.${extension}`;
          const cheminMiniature = `${familleId}/${idTrace}_thumb.${extension}`;

          const [resultatImage, resultatMiniature] = await Promise.all([
            supabase.storage.from("traces-pedagogiques").upload(cheminImage, image, {
              contentType: "image/jpeg",
            }),
            supabase.storage.from("traces-pedagogiques").upload(cheminMiniature, miniature, {
              contentType: "image/jpeg",
            }),
          ]);

          if (resultatImage.error || resultatMiniature.error) {
            throw new Error("Échec de l'envoi de l'image.");
          }
          cheminStockage = cheminImage;
          miniatureCheminStockage = cheminMiniature;
        } else {
          setEtapeEnvoi("Envoi du fichier…");
          const chemin = `${familleId}/${idTrace}.${extension}`;
          const resultat = await supabase.storage
            .from("traces-pedagogiques")
            .upload(chemin, fichier, { contentType: fichier.type || undefined });

          if (resultat.error) {
            throw new Error("Échec de l'envoi du fichier.");
          }
          cheminStockage = chemin;
        }
      }

      setEtapeEnvoi("Enregistrement…");
      const resultat = await avecDelaiMaximal(
        creerTrace({
          activiteId,
          typeCode,
          cheminStockage,
          miniatureCheminStockage,
          contenuTexte: attendTexte ? contenuTexte : null,
          legende,
          dateTrace,
        })
      );

      if ("erreur" in resultat) {
        setErreur(resultat.erreur);
        return;
      }

      router.refresh();
      setLegende("");
      setContenuTexte("");
      if (inputFichierRef.current) inputFichierRef.current.value = "";
    } catch (erreurInattendue) {
      console.error("Erreur inattendue lors de l'ajout de la trace", erreurInattendue);
      setErreur(messagePourErreurInattendue(erreurInattendue));
    } finally {
      setChargement(false);
      setEtapeEnvoi(null);
    }
  }

  return (
    <div className="rounded-doux border border-trait bg-white/80 p-6 shadow-doux">
      <p className="mb-4 text-sm font-medium text-encre">Ajouter une trace</p>

      {erreur && <MessageStatut type="erreur">{erreur}</MessageStatut>}

      <form onSubmit={gererEnvoi}>
        <div className="mb-4">
          <label htmlFor="type-trace" className="mb-1.5 block text-sm font-medium text-encre">
            Type
          </label>
          <select
            id="type-trace"
            value={typeCode}
            onChange={(e) => setTypeCode(e.target.value)}
            className="w-full rounded-doux border border-trait bg-white px-3.5 py-2.5 text-sm text-encre focus:border-mousse focus:outline-none"
          >
            {types.map((t) => (
              <option key={t.code} value={t.code}>
                {t.libelle}
              </option>
            ))}
          </select>
        </div>

        {attendFichier && (
          <div className="mb-4">
            <label htmlFor="fichier" className="mb-1.5 block text-sm font-medium text-encre">
              Fichier
            </label>
            <input
              ref={inputFichierRef}
              id="fichier"
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf,application/msword,.docx"
              className="w-full text-sm text-encre"
            />
          </div>
        )}

        {attendTexte && (
          <div className="mb-4">
            <label htmlFor="contenu-texte" className="mb-1.5 block text-sm font-medium text-encre">
              Texte
            </label>
            <textarea
              id="contenu-texte"
              rows={3}
              value={contenuTexte}
              onChange={(e) => setContenuTexte(e.target.value)}
              className="w-full rounded-doux border border-trait bg-white px-3.5 py-2.5 text-sm text-encre focus:border-mousse focus:outline-none"
            />
          </div>
        )}

        <Champ
          label="Légende (facultatif)"
          id="legende"
          type="text"
          value={legende}
          onChange={(e) => setLegende(e.target.value)}
        />

        <Champ
          label="Date"
          id="date-trace"
          type="date"
          value={dateTrace}
          onChange={(e) => setDateTrace(e.target.value)}
        />

        <div className="mt-2 flex items-center gap-3">
          <button
            type="submit"
            disabled={chargement}
            className="rounded-doux bg-mousse-fonce px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-mousse disabled:cursor-not-allowed disabled:opacity-60"
          >
            {chargement ? "Enregistrement…" : "Ajouter cette trace"}
          </button>
          {etapeEnvoi && <span className="text-xs text-ardoise">{etapeEnvoi}</span>}
        </div>
      </form>
    </div>
  );
}
