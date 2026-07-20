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
      className="rounded-doux border border-trait bg-white px-3.5 py-2 text-sm text-encre focus:border-mousse focus:outline-none"
    >
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.libelle}
        </option>
      ))}
    </select>
  );
}
