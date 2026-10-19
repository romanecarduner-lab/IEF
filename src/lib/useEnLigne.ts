"use client";

import { useEffect, useState } from "react";

/** Vrai tant que le navigateur se croit connecte (evenements online/offline). */
export function useEnLigne(): boolean {
  const [enLigne, setEnLigne] = useState(true);
  useEffect(() => {
    setEnLigne(navigator.onLine);
    const surEnLigne = () => setEnLigne(true);
    const surHorsLigne = () => setEnLigne(false);
    window.addEventListener("online", surEnLigne);
    window.addEventListener("offline", surHorsLigne);
    return () => {
      window.removeEventListener("online", surEnLigne);
      window.removeEventListener("offline", surHorsLigne);
    };
  }, []);
  return enLigne;
}
