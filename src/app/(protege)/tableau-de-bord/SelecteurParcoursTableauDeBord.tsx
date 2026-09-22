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
      className="rounded-doux border border-trait bg-white px-2.5 py-1 text-xs text-encre focus:border-mousse focus:outline-none"
    >
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.libelle}
        </option>
      ))}
    </select>
  );
}
