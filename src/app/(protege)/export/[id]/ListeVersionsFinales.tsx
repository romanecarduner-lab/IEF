import { creerClientServeur } from "@/lib/supabase/server";
import { lireVersions, nomFichierExport } from "@/lib/versionsDossier";

const DUREE_SIGNATURE_SECONDES = 60 * 60;

/**
 * Historique des versions finalisees d'un dossier : chaque version garde
 * son PDF et son PowerPoint, du plus recent au plus ancien.
 */
export async function ListeVersionsFinales({
  brut,
  prenom,
  titre,
}: {
  brut: unknown;
  prenom: string;
  titre: string;
}) {
  const versions = lireVersions(brut);
  if (versions.length === 0) return null;

  const supabase = creerClientServeur();
  const versionsAvecLiens = await Promise.all(
    [...versions].reverse().map(async (v) => {
      const [{ data: pdf }, { data: pptx }] = await Promise.all([
        supabase.storage
          .from("traces-pedagogiques")
          .createSignedUrl(v.pdf, DUREE_SIGNATURE_SECONDES, {
            download: nomFichierExport({ dateFinalisation: v.finalise_le, prenom, titre, extension: "pdf" }),
          }),
        v.pptx
          ? supabase.storage
              .from("traces-pedagogiques")
              .createSignedUrl(v.pptx, DUREE_SIGNATURE_SECONDES, {
                download: nomFichierExport({ dateFinalisation: v.finalise_le, prenom, titre, extension: "pptx" }),
              })
          : Promise.resolve({ data: null }),
      ]);
      return { ...v, urlPdf: pdf?.signedUrl ?? null, urlPptx: pptx?.signedUrl ?? null };
    })
  );

  return (
    <section className="mb-6 rounded-doux border border-trait bg-papier/40 p-4">
      <h3 className="mb-3 text-sm font-medium text-encre">Versions finalisées</h3>
      <ul className="space-y-3">
        {versionsAvecLiens.map((v, index) => (
          <li
            key={v.pdf}
            className="flex flex-wrap items-center justify-between gap-2 border-b border-trait pb-3 text-sm last:border-b-0 last:pb-0"
          >
            <div>
              <p className="text-encre">
                {v.finalise_le
                  ? `Finalisée le ${new Date(v.finalise_le).toLocaleString("fr-FR", {
                      dateStyle: "long",
                      timeStyle: "short",
                    })}`
                  : "Version finalisée avant l’historique"}
              </p>
              {index === 0 && <p className="text-xs text-ardoise">Dernière version finalisée</p>}
            </div>
            <div className="flex flex-wrap gap-3 text-xs">
              {v.urlPdf && (
                <a href={v.urlPdf} target="_blank" rel="noopener noreferrer" className="text-mousse-fonce underline underline-offset-2">
                  PDF
                </a>
              )}
              {v.urlPptx && (
                <a href={v.urlPptx} target="_blank" rel="noopener noreferrer" className="text-mousse-fonce underline underline-offset-2">
                  PowerPoint
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
