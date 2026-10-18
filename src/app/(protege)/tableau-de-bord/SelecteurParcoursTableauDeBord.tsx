"use client";

import { useRouter } from "next/navigation";

export function SelecteurParcoursTableauDeBord({
  parcoursId,
  options,
}: {
  parcoursId: string;
  options: { id: string; libelle: string }[];
}) {
  const router = useRouter();

  return (
    <select
      value={parcoursId}
      onChange={(e) => router.push(`/tableau-de-bord?parcours=${e.target.value}`)}
      className="champ-saisie champ-compact max-w-full text-xs"
    >
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.libelle}
        </option>
      ))}
    </select>
  );
}
