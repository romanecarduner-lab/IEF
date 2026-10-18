"use client";

import { useRouter } from "next/navigation";

export function SelecteurParcours({
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
      onChange={(e) => router.push(`/progression?parcours=${e.target.value}`)}
      className="champ-saisie champ-compact"
    >
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.libelle}
        </option>
      ))}
    </select>
  );
}
