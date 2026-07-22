"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { basculerActivite, basculerTrace } from "./actions";

export function BasculeElement({
  dossierId,
  cibleId,
  inclus,
  type,
  label,
}: {
  dossierId: string;
  cibleId: string;
  inclus: boolean;
  type: "activite" | "trace";
  label: string;
}) {
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);

  async function gererChangement() {
    setEnCours(true);
    try {
      if (type === "activite") {
        await basculerActivite(dossierId, cibleId, !inclus);
      } else {
        await basculerTrace(dossierId, cibleId, !inclus);
      }
      router.refresh();
    } finally {
      setEnCours(false);
    }
  }

  return (
    <label className="flex items-start gap-2 text-sm text-encre">
      <input
        type="checkbox"
        checked={inclus}
        disabled={enCours}
        onChange={gererChangement}
        className="mt-0.5"
      />
      <span>{label}</span>
    </label>
  );
}
