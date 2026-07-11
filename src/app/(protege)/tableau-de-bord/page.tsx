import { creerClientServeur } from "@/lib/supabase/server";

export default async function PageTableauDeBord() {
  const supabase = creerClientServeur();

  // Requête volontairement simple : elle sert à vérifier, lot après lot,
  // que la RLS ne renvoie jamais que les données de la famille courante.
  const { data: appartenances } = await supabase
    .from("utilisateurs_familles")
    .select("id, roles_famille(libelle), statuts_appartenance_famille(libelle)");

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl italic text-encre">
        Tableau de bord
      </h1>
      <p className="mb-8 text-sm text-ardoise">
        Le socle est en place. Les enfants, le journal et les traces
        arriveront dans les prochains lots.
      </p>

      <div className="rounded-doux border border-trait bg-white/80 p-6 shadow-doux">
        <p className="mb-3 text-sm font-medium text-encre">
          Membres de votre espace ({appartenances?.length ?? 0})
        </p>
        <ul className="space-y-1 text-sm text-ardoise">
          {appartenances?.map((a) => (
            <li key={a.id}>
              {(a.roles_famille as any)?.libelle ?? "Rôle"} —{" "}
              {(a.statuts_appartenance_famille as any)?.libelle ?? "Statut"}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
