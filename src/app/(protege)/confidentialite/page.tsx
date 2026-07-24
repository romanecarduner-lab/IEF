import { creerClientServeur } from "@/lib/supabase/server";
import { BoutonExportDonnees } from "./BoutonExportDonnees";
import { BoutonExportFichiers } from "./BoutonExportFichiers";
import { FormulaireSuppressionFamille } from "./FormulaireSuppressionFamille";

export default async function PageConfidentialite() {
  const supabase = creerClientServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: appartenance } = await supabase
    .from("utilisateurs_familles")
    .select("familles(nom)")
    .eq("user_id", user?.id ?? "")
    .limit(1)
    .maybeSingle();

  const famille = appartenance
    ? Array.isArray(appartenance.familles)
      ? appartenance.familles[0]
      : appartenance.familles
    : null;

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 font-display text-2xl italic text-encre">
        Confidentialité et données
      </h1>

      <section className="mb-8">
        <p className="mb-2 text-sm font-medium text-encre">Exporter mes données</p>
        <p className="mb-4 text-sm text-ardoise">
          Récupérez une copie complète de toutes les données de votre espace
          familial (enfants, années, parcours, journal, traces, compétences,
          progression, dossiers), ou de tous les fichiers (photos,
          documents, PDF) que vous avez ajoutés.
        </p>
        <div className="flex flex-wrap gap-3">
          <BoutonExportDonnees />
          <BoutonExportFichiers />
        </div>
      </section>

      <section className="rounded-doux border border-trait bg-white/80 p-6 shadow-doux">
        <p className="mb-2 text-sm font-medium text-encre">Zone de suppression</p>
        <p className="mb-4 text-sm text-ardoise">
          La suppression de votre espace familial est définitive : toutes
          les données et tous les fichiers associés sont réellement
          supprimés (pas seulement archivés), y compris votre compte de
          connexion.
        </p>
        {famille && <FormulaireSuppressionFamille nomFamille={famille.nom as string} />}
      </section>
    </div>
  );
}
